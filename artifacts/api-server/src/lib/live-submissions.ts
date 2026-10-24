import { parse } from "csv-parse/sync";
import type { LiveSubmissions } from "@workspace/api-zod";

const REFRESH_INTERVAL_MS = 60_000;
const MAX_CSV_BYTES = 5_000_000;
const productNames = [
  "Buying carbon credits",
  "Consultancy service",
  "Listing on ZeroCarbon",
] as const;
type ProductCounts = LiveSubmissions["product_counts"];

let lastAttemptAt = 0;
let refreshInFlight: Promise<void> | null = null;
let cachedSummary: Omit<LiveSubmissions, "stale"> | null = null;

function safeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, " ")
    .replace(/\+?\d(?:[\s().-]*\d){8,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function maskName(value: unknown) {
  const words = safeText(value).split(/\s+/).filter(Boolean);
  if (!words.length) return "Someone";
  const first = words[0];
  if (/\d{7,}|@/.test(first)) return "Someone";
  const secondInitial = words[1] ? `${Array.from(words[1])[0]}.` : "";
  return [first, secondInitial].filter(Boolean).join(" ");
}

function amountInr(value: unknown): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim()
    .replace(/^(?:Rs\.?|INR)\s*/i, "")
    .replace(/[₹,\s]/g, "");
  if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function parseTimestamp(value: string): string | null {
  const local = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  const hour = local
    ? local[8]
      ? (Number(local[4]) % 12) + (/pm/i.test(local[8]) ? 12 : 0)
      : Number(local[4])
    : 0;
  const date = local
    ? new Date(Date.UTC(
      Number(local[3]), Number(local[1]) - 1, Number(local[2]),
      hour,
      Number(local[5]), Number(local[6] ?? 0),
    ) - 330 * 60_000)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function emptyProducts(): ProductCounts {
  return { buying_carbon_credits: 0, consultancy_service: 0, listing_on_zerocarbon: 0 };
}

function productKey(product: string): keyof ProductCounts | null {
  switch (product) {
    case "Buying carbon credits": return "buying_carbon_credits";
    case "Consultancy service": return "consultancy_service";
    case "Listing on ZeroCarbon": return "listing_on_zerocarbon";
    default: return null;
  }
}

function safeProduct(value: unknown) {
  const product = typeof value === "string" ? value.trim() : "";
  return productNames.includes(product as typeof productNames[number]) ? product : "Other";
}

function summarize(csv: string, now: number): Omit<LiveSubmissions, "stale"> {
  const headers = parse(csv, { bom: true, to: 1, skip_empty_lines: true })[0] as string[] | undefined;
  const requiredHeaders = [
    "Timestamp",
    "Name/Organisation",
    "Product",
    "Amount paid",
    "Payment Screenshot",
    "Date of Payment",
    "Transaction/UTR",
    "Notes",
  ];
  if (!headers || requiredHeaders.some((header) => !headers.includes(header))) {
    throw new Error("Unexpected payment form CSV columns.");
  }
  const rows = parse(csv, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  }) as Record<string, string>[];
  const products = emptyProducts();
  const amounts: number[] = [];
  const satisfaction: number[] = [];
  const heard = new Map<string, number>();
  const latest: LiveSubmissions["latest"] = [];
  let total = 0;
  let count = 0;
  const satisfactionHeader = Object.keys(rows[0] ?? {}).find((key) => key.startsWith("On a scale of 1-5"));
  const heardHeader = Object.keys(rows[0] ?? {}).find((key) => key.startsWith("How did you hear about our services?"));

  for (const row of rows) {
    const timestamp = typeof row.Timestamp === "string" ? row.Timestamp.trim() : "";
    if (!timestamp) continue;
    count++;

    const amount = amountInr(row["Amount paid"]);
    if (amount !== null) {
      total += amount;
      amounts.push(amount);
    }

    const product = safeProduct(row.Product);
    const key = productKey(product);
    if (key) products[key]++;

    if (satisfactionHeader) {
      const rating = Number(row[satisfactionHeader]);
      if (Number.isFinite(rating) && rating >= 1 && rating <= 5) satisfaction.push(rating);
    }

    if (heardHeader) {
      const cleaned = safeText(row[heardHeader]);
      const source = cleaned ? maskName(cleaned) : "Not specified";
      heard.set(source, (heard.get(source) ?? 0) + 1);
    }

    latest.push({
      timestamp: parseTimestamp(timestamp),
      name: maskName(row["Name/Organisation"]),
      product,
      amount_inr: amount,
    });
  }

  latest.sort((a, b) => (b.timestamp ? Date.parse(b.timestamp) : 0) - (a.timestamp ? Date.parse(a.timestamp) : 0));
  return {
    total_submissions: count,
    total_amount_inr: Math.round(total * 100) / 100,
    product_counts: products,
    average_satisfaction: satisfaction.length
      ? Math.round((satisfaction.reduce((sum, value) => sum + value, 0) / satisfaction.length) * 10) / 10
      : null,
    heard_about: [...heard].map(([source, sourceCount]) => ({ source, count: sourceCount }))
      .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source)),
    latest: latest.slice(0, 10),
    updated_at: new Date(now).toISOString(),
  };
}

async function refresh(now: number) {
  try {
    const url = process.env.LIVE_SUBMISSIONS_CSV_URL;
    if (!url) return;
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return;
    const csv = await response.text();
    if (Buffer.byteLength(csv, "utf8") > MAX_CSV_BYTES) return;
    cachedSummary = summarize(csv, Date.now());
  } catch {
    // Keep the last sanitized summary. Never log, persist, or expose CSV rows or parser errors.
  }
}

export async function getLiveSubmissions(now = Date.now()): Promise<LiveSubmissions> {
  if (now - lastAttemptAt >= REFRESH_INTERVAL_MS && !refreshInFlight) {
    lastAttemptAt = now;
    refreshInFlight = refresh(now).finally(() => { refreshInFlight = null; });
  }
  if (refreshInFlight) await refreshInFlight;
  const summary = cachedSummary ?? {
    total_submissions: 0,
    total_amount_inr: 0,
    product_counts: emptyProducts(),
    average_satisfaction: null,
    heard_about: [],
    latest: [],
    updated_at: null,
  };
  return {
    ...summary,
    stale: !summary.updated_at || now - Date.parse(summary.updated_at) >= REFRESH_INTERVAL_MS,
  };
}
