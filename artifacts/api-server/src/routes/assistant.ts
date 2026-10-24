import { Router } from "express";
import { AskZeroCarbonBody, AskZeroCarbonResponse, ScanLandBody, ScanLandResponse } from "@workspace/api-zod";
import { organisation } from "../lib/session";
import { agenticorg, guard, guardLocally, blockedPhrases, validateContract } from "../lib/agenticorg";
import { event } from "../lib/events";
import { getScanRoutes, type ScanRoutesResult } from "../lib/models-service";

const router = Router();
const safeScreens = new Set(["/", "/market", "/scan", "/orders", "/ask", "/signup", "/comply"]);
router.post("/ask", async (req, res) => {
  const input = AskZeroCarbonBody.safeParse(req.body);
  if (!input.success) { res.status(400).json({ error: "Ask a question in up to 2,000 characters." }); return; }
  const org = await organisation(req), data = input.data;
  if (blockedPhrases(data.question).length) {
    res.json(AskZeroCarbonResponse.parse({
      answer: "I can explain credit labels, purchase steps and land checks, but cannot give financial advice or support unsupported environmental claims. Would you like to understand the different credit types?",
      see_screen: "/market", available: true, escalate: false,
    })); return;
  }
  try {
    const result = await agenticorg.run("ASK_ZEROCARBON", {
      question: data.question, screen: safeScreens.has(data.screen ?? "") ? data.screen : "/ask",
      role: org?.roles.join(",") ?? "Visitor",
    }, org?.id);
    if (typeof result.answer !== "string") throw new Error("Invalid answer");
    res.json(AskZeroCarbonResponse.parse({
      answer: await guard(result.answer, data.screen ?? "/ask", org?.roles.join(",") ?? "Visitor", org?.id),
      see_screen: typeof result.see_screen === "string" && safeScreens.has(result.see_screen) ? result.see_screen : "/market",
      available: true, escalate: result.escalate === true,
    }));
  } catch {
    res.json(AskZeroCarbonResponse.parse({
      answer: "Our assistant is busy. You can still browse credits, use the filters and follow your demo orders.",
      see_screen: "/market", available: false, escalate: false,
    }));
  }
});

// Approximate state outline used only to reject obviously out-of-coverage pins.
// The models service must make the final coverage/land classification decision.
const karnatakaOutline = [
  [74.08, 15.78], [74.25, 16.50], [74.85, 16.90], [75.25, 16.85],
  [75.60, 17.30], [76.15, 17.40], [76.45, 17.85], [77.55, 18.45],
  [77.70, 17.45], [77.25, 16.40], [77.58, 15.85], [77.05, 15.10],
  [76.90, 14.60], [77.60, 14.30], [78.50, 13.65], [78.60, 12.75],
  [77.80, 12.45], [77.47, 11.65], [76.45, 11.58], [75.80, 12.10],
  [75.37, 12.45], [74.85, 12.80], [74.50, 13.65], [74.00, 14.80],
];
function inKarnataka(lat: number, lon: number) {
  let inside = false;
  for (let i = 0, j = karnatakaOutline.length - 1; i < karnatakaOutline.length; j = i++) {
    const a = karnatakaOutline[i], b = karnatakaOutline[j];
    if (((a[1] > lat) !== (b[1] > lat)) && lon < (b[0] - a[0]) * (lat - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
type ScanResultContract = {
  location: { area_ha: number };
  verdict: "likely_eligible" | "needs_checks" | "not_eligible";
  reasons: string[];
  species: { name: string; why: string }[];
  credits_per_year: { low: number; likely: number; high: number; unit: "tCO2e" } | null;
  money_inr: { low: number; likely: number; high: number; basis: string } | null;
  fixed_costs_inr: { first_year: number; yearly: number };
  unseen: string[];
};
function fallbackScanCard(raw: Record<string, unknown>) {
  const scan = raw as unknown as ScanResultContract;
  const formatRupees = (amount: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
  const headline = {
    likely_eligible: "Likely eligible",
    needs_checks: "Needs checks",
    not_eligible: "Not eligible",
  }[scan.verdict];
  const credits = scan.credits_per_year;
  const money = scan.money_inr;
  const speciesName = (name: string) =>
    name.trim().toLowerCase() === "tectona grandis" ? `${name} (teak)` : name;

  return {
    headline,
    reasons: scan.reasons.slice(0, 3),
    ...(scan.verdict !== "not_eligible" && scan.species.length
      ? { what_to_plant: scan.species.map(({ name, why }) => `${speciesName(name)} — ${why}`).join("\n") }
      : {}),
    ...(credits
      ? { credits_line: `About ${credits.low.toFixed(1)} to ${credits.high.toFixed(1)} tonnes of CO2 a year, most likely ${credits.likely.toFixed(1)}.` }
      : {}),
    ...(money
      ? { money_line: `Roughly Rs ${formatRupees(money.low)} to Rs ${formatRupees(money.high)} a year at demo prices, before fees.` }
      : {}),
    next_step: scan.verdict === "not_eligible"
      ? "This land is unlikely to earn credits as it is."
      : money && money.likely < scan.fixed_costs_inr.first_year
        ? `Join ZeroCarbon Pool: on your own, the first-year fees (Rs ${formatRupees(scan.fixed_costs_inr.first_year)}) are more than the likely money.`
        : "Fill in the details satellites cannot see.",
    limitations: scan.unseen.join("\n"),
  };
}
router.post("/scan", async (req, res) => {
  const input = ScanLandBody.safeParse(req.body);
  if (!input.success) { res.status(400).json({ error: "Choose a valid map pin." }); return; }
  const org = await organisation(req), data = input.data;
  await event("scan", org?.id ?? null, { lat: data.lat, lon: data.lon, demo: true });
  if (!inKarnataka(data.lat, data.lon)) {
    res.json(ScanLandResponse.parse({ available: false, message: "Scan covers Karnataka today; more states soon" })); return;
  }
  if (data.boundary_geojson) {
    const geom = (data.boundary_geojson.type === "Feature" ? data.boundary_geojson.geometry : data.boundary_geojson) as { type?: string; coordinates?: unknown };
    if (!geom || geom.type !== "Polygon" || !Array.isArray(geom.coordinates) || !Array.isArray(geom.coordinates[0])) {
      res.status(400).json({ error: "Draw a valid land boundary polygon." }); return;
    }
    const ring = geom.coordinates[0] as unknown[];
    if (ring.length < 4 || ring.length > 1000 || !ring.every(p => Array.isArray(p) &&
      typeof p[0] === "number" && typeof p[1] === "number" && inKarnataka(p[1], p[0]))) {
      res.status(400).json({ error: "Choose a boundary inside Karnataka with 3–999 corners." }); return;
    }
  }
  try {
    const base = process.env.MODELS_API_URL, key = process.env.MODELS_API_KEY;
    if (!base || !key) throw new Error("Models not connected");
    const url = new URL("/scan", base);
    if (url.protocol !== "https:" && url.hostname !== "localhost") throw new Error("Models must use HTTPS");
    const started = Date.now();
    let raw: Record<string, unknown>;
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "X-API-Key": key }, body: JSON.stringify(data), signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error(`Models service HTTP ${response.status}`);
      raw = await validateContract("ScanResult", await response.json());
      await event("model_call", org?.id ?? null, { model: "scan", duration_ms: Date.now() - started, result: "success" })
        .catch(() => req.log.warn("Could not record successful model call"));
    } catch (err) {
      req.log.warn({ reason: err instanceof Error ? err.message : "Unknown scan error" }, "Scan models response failed");
      await event("model_call", org?.id ?? null, { model: "scan", duration_ms: Date.now() - started, result: "failed" });
      throw err;
    }
    const scanData = raw as unknown as ScanResultContract;
    const routesPromise: Promise<ScanRoutesResult | undefined> =
      (scanData.verdict === "likely_eligible" || scanData.verdict === "needs_checks") &&
      scanData.credits_per_year
      ? getScanRoutes(scanData.location.area_ha, scanData.credits_per_year.likely)
        .catch((err) => {
          req.log.info({ reason: err instanceof Error ? err.message : "Unknown routes error" }, "Scan route options unavailable");
          return undefined;
        })
      : Promise.resolve(undefined);
    const fallbackContent = fallbackScanCard(raw);
    const fallback = async () => {
      const routeOptions = await routesPromise;
      return ScanLandResponse.parse({
        available: true, message: "", verdict: raw.verdict, ...fallbackContent,
        ...(routeOptions ? { routes: routeOptions } : {}),
      });
    };
    try {
    const card = await agenticorg.run("LAND_SCOUT", {
        task: "Explain this ZeroCarbon Scan result for the landowner.",
        lat: data.lat, lon: data.lon, boundary_geojson: data.boundary_geojson ?? null,
      }, org?.id);
    // Keep this to one agent call; apply the existing local claim-safety check.
    const guarded = async (value: unknown, fixed: string) => guardLocally(typeof value === "string" ? value : fixed);
    const why = Array.isArray(card.why) ? card.why.filter((x): x is string => typeof x === "string") :
      typeof card.why === "string" ? [card.why] : [];
    const cannotSee = Array.isArray(card.cannot_see) ? card.cannot_see.filter((x): x is string => typeof x === "string").join("\n") :
      typeof card.cannot_see === "string" ? card.cannot_see : "";
    const whatToPlant = Array.isArray(card.what_to_plant) ? card.what_to_plant.filter((x): x is string => typeof x === "string").join("\n") :
      typeof card.what_to_plant === "string" ? card.what_to_plant : "";
    const routeOptions = await routesPromise;
    res.json(ScanLandResponse.parse({
      available: true, message: "", verdict: raw.verdict,
      headline: await guarded(card.headline, "Your demo land scan is ready"),
      reasons: await Promise.all(why.filter(x => x.trim()).slice(0, 3).map(x => guarded(x, ""))),
      next_step: await guarded(card.next_step, "Arrange an on-site assessment before making a decision."),
      ...(whatToPlant.trim() ? { what_to_plant: await guarded(whatToPlant, "") } : {}),
      ...(fallbackContent.credits_line ? { credits_line: fallbackContent.credits_line } : {}),
      ...(fallbackContent.money_line ? { money_line: fallbackContent.money_line } : {}),
      ...(cannotSee.trim() ? { limitations: await guarded(cannotSee, "") } : {}),
      ...(routeOptions ? { routes: routeOptions } : {}),
    }));
    } catch {
      req.log.info("Land Scout card unavailable; using validated ScanResult");
      res.json(await fallback());
    }
  } catch (err) {
    req.log.warn({ reason: err instanceof Error ? err.message : "Unknown scan error" }, "Scan unavailable");
    res.json(ScanLandResponse.parse({ available: false, message: "Scan is busy, try again in a minute" }));
  }
});
export default router;
