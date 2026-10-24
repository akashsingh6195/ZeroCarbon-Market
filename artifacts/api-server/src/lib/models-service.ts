import { db, listingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { ListingScoreFlag } from "@workspace/db";
import { guardLocally } from "./agenticorg";
import { logger } from "./logger";

type ScanRouteName = "zerocarbon_pool" | "india_offset" | "voluntary";

export type ScanRoute = {
  route: ScanRouteName;
  fees_inr_first_year: number;
  fees_inr_yearly: number;
  first_money_in_months: { low: number; high: number };
  paperwork: string;
  fixed_costs_exceed_likely_money: boolean;
  notes: string;
};

export type ScanRoutesResult = {
  routes: ScanRoute[];
  money_likely_inr_per_year: number;
  source: { title: string; url: string };
};

export type SampleForecast = {
  intensity_now: number;
  target: number;
  forecast_year_end: { low: number; high: number; likely: number };
  shortfall_t: { low: number; high: number; likely: number };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

async function postModels(path: string, body: unknown, timeoutMs: number): Promise<unknown> {
  const base = process.env.MODELS_API_URL;
  const key = process.env.MODELS_API_KEY;
  if (!base || !key) throw new Error("Models service is not configured.");

  const url = new URL(path.replace(/^\/+/, ""), `${base.replace(/\/+$/, "")}/`);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("Models service must use HTTPS.");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`Models service HTTP ${response.status}.`);
  return response.json();
}

function parseScore(value: unknown): { score: number; flags: ListingScoreFlag[] } {
  if (!isRecord(value) || !Number.isInteger(value.score) ||
      (value.score as number) < 0 || (value.score as number) > 100 ||
      !Array.isArray(value.flags)) {
    throw new Error("Models score response is invalid.");
  }
  const flags = value.flags.map((flag): ListingScoreFlag => {
    if (!isRecord(flag) || !Number.isInteger(flag.points) ||
        (flag.points as number) < 0 || typeof flag.detail !== "string") {
      throw new Error("Models score flags are invalid.");
    }
    return { points: flag.points as number, detail: guardLocally(flag.detail) };
  });
  return { score: value.score as number, flags };
}

export async function rescoreListing(id: number): Promise<void> {
  if (!process.env.MODELS_API_URL || !process.env.MODELS_API_KEY) return;
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));
  if (!listing) return;

  const maybeSerials = (listing as typeof listing & { serials?: unknown }).serials;
  const input = {
    listing_id: String(listing.id),
    status: listing.status,
    documents: listing.documents,
    delivery_year: listing.delivery_year,
    ...(Array.isArray(maybeSerials) ? { serials: maybeSerials } : {}),
  };
  try {
    const result = parseScore(await postModels("score", input, 5000));
    await db.update(listingsTable).set({
      zerocarbon_score: result.score,
      score_flags: result.flags,
      score_checked_at: new Date(),
    }).where(eq(listingsTable.id, id));
  } catch (err) {
    logger.warn({
      listing_id: id,
      reason: err instanceof Error ? err.message : "Unknown scoring error",
    }, "Listing model score failed; retaining stored score");
  }
}

export async function rescoreAllListings(): Promise<void> {
  if (!process.env.MODELS_API_URL || !process.env.MODELS_API_KEY) return;
  const rows = await db.select({ id: listingsTable.id }).from(listingsTable);
  const batchSize = 4;
  for (let index = 0; index < rows.length; index += batchSize) {
    await Promise.all(rows.slice(index, index + batchSize).map(({ id }) => rescoreListing(id)));
  }
}

function parseScanRoutes(value: unknown): ScanRoutesResult {
  const expectedRoutes = new Set<ScanRouteName>(["zerocarbon_pool", "india_offset", "voluntary"]);
  if (!isRecord(value) || !Array.isArray(value.routes) ||
      !finite(value.money_likely_inr_per_year) || !isRecord(value.source) ||
      typeof value.source.title !== "string" || typeof value.source.url !== "string") {
    throw new Error("Models routes response is invalid.");
  }

  let sourceUrl: URL;
  try {
    sourceUrl = new URL(value.source.url);
  } catch {
    throw new Error("Models routes source URL is invalid.");
  }
  if (sourceUrl.protocol !== "https:" && sourceUrl.protocol !== "http:") {
    throw new Error("Models routes source URL is invalid.");
  }

  const routes = value.routes.map((item): ScanRoute => {
    if (!isRecord(item)) throw new Error("Models route row is not an object.");
    const firstMoneyMonths = item.first_money_in_months ?? item.first_money_months;
    const invalidFields: string[] = [];
    if (!expectedRoutes.has(item.route as ScanRouteName)) invalidFields.push("route");
    if (!finite(item.fees_inr_first_year) || item.fees_inr_first_year < 0) invalidFields.push("fees_inr_first_year");
    if (!finite(item.fees_inr_yearly) || item.fees_inr_yearly < 0) invalidFields.push("fees_inr_yearly");
    if (!isRecord(firstMoneyMonths) ||
        !finite(firstMoneyMonths.low) || !finite(firstMoneyMonths.high)) {
      invalidFields.push("first_money_in_months");
    }
    if (typeof item.paperwork !== "string") invalidFields.push("paperwork");
    if (typeof item.fixed_costs_exceed_likely_money !== "boolean") invalidFields.push("fixed_costs_exceed_likely_money");
    if (invalidFields.length) {
      throw new Error(`Models route row invalid fields: ${invalidFields.join(",")}; keys: ${Object.keys(item).join(",")}.`);
    }
    const notes = typeof item.notes === "string"
      ? item.notes
      : Array.isArray(item.notes) && item.notes.every(note => typeof note === "string")
        ? item.notes.join(" ")
        : "";
    return {
      route: item.route as ScanRouteName,
      fees_inr_first_year: item.fees_inr_first_year,
      fees_inr_yearly: item.fees_inr_yearly,
      first_money_in_months: {
        low: firstMoneyMonths.low,
        high: firstMoneyMonths.high,
      },
      paperwork: guardLocally(item.paperwork),
      fixed_costs_exceed_likely_money: item.fixed_costs_exceed_likely_money,
      notes: guardLocally(notes),
    };
  });
  if (routes.length !== 3 || new Set(routes.map(route => route.route)).size !== 3) {
    throw new Error("Models routes response must include all three routes.");
  }

  return {
    routes,
    money_likely_inr_per_year: value.money_likely_inr_per_year,
    source: { title: value.source.title, url: sourceUrl.toString() },
  };
}

export async function getScanRoutes(areaHa: number, creditsPerYearLikely: number): Promise<ScanRoutesResult> {
  return parseScanRoutes(await postModels("routes", {
    area_ha: areaHa,
    credits_per_year_likely: creditsPerYearLikely,
  }, 4000));
}

export const sampleFactoryInput = {
  plant_id: "SAMPLE-FACTORY-1",
  target: 0.18,
  expected_yearly_production_t: 120000,
  months: [
    { month: "2026-01", production_t: 9800, coal_t: 880, gas_scm: 0, power_kwh: 910000, diesel_l: 2100 },
    { month: "2026-02", production_t: 10200, coal_t: 930, gas_scm: 0, power_kwh: 935000, diesel_l: 2200 },
    { month: "2026-03", production_t: 9900, coal_t: 905, gas_scm: 0, power_kwh: 905000, diesel_l: 2050 },
    { month: "2026-04", production_t: 10400, coal_t: 960, gas_scm: 0, power_kwh: 960000, diesel_l: 2300 },
    { month: "2026-05", production_t: 10100, coal_t: 925, gas_scm: 0, power_kwh: 930000, diesel_l: 2150 },
    { month: "2026-06", production_t: 9700, coal_t: 890, gas_scm: 0, power_kwh: 900000, diesel_l: 2000 },
  ],
} as const;

export async function getSampleFactoryForecast(): Promise<SampleForecast> {
  const value = await postModels("comply/forecast", sampleFactoryInput, 6000);
  if (!isRecord(value) || !finite(value.intensity_now) ||
      !isRecord(value.forecast_year_end) || !finite(value.forecast_year_end.low) ||
      !finite(value.forecast_year_end.high) || !finite(value.forecast_year_end.likely) ||
      !isRecord(value.shortfall_t) || !finite(value.shortfall_t.low) ||
      !finite(value.shortfall_t.high) || !finite(value.shortfall_t.likely)) {
    throw new Error("Models compliance forecast is invalid.");
  }
  return {
    intensity_now: value.intensity_now,
    target: sampleFactoryInput.target,
    forecast_year_end: {
      low: value.forecast_year_end.low,
      high: value.forecast_year_end.high,
      likely: value.forecast_year_end.likely,
    },
    shortfall_t: {
      low: value.shortfall_t.low,
      high: value.shortfall_t.high,
      likely: value.shortfall_t.likely,
    },
  };
}
