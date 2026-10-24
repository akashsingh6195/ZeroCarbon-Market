import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Exercise the actual routes without upstream requests or database writes.
const temporary = await mkdtemp(path.join(tmpdir(), "zc-assistant-"));
try {
  const output = path.join(temporary, "check.mjs");
  await build({
    stdin: {
      resolveDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
      contents: `
import assert from "node:assert/strict";
import scanRouter from "./src/routes/assistant.ts";
import marketRouter from "./src/routes/market.ts";
import { agenticorg, validateContract } from "./src/lib/agenticorg.ts";
import { normalizeNeedFilters } from "./src/lib/need-filters.ts";

const scan = {
  version: "1.0", demo: true,
  location: { lat: 12.5489, lon: 76.8786, area_ha: 1, state: "Karnataka" },
  verdict: "likely_eligible", reasons: ["Cropland suitable for new trees."],
  method: "BM FR05.002",
  land_cover: { cropland: .9, trees: .1, built: 0, water: 0, other: 0 },
  existing_tree_cover: .1,
  species: [{ name: "Melia dubia", why: "Suits this land." }, { name: "Tectona grandis", why: "Suits this climate." }],
  credits_per_year: { low: 7.4, likely: 10.5, high: 13.6, unit: "tCO2e" },
  money_inr: { low: 3700, likely: 6300, high: 9534, basis: "Demo prices" },
  fixed_costs_inr: { first_year: 57052, yearly: 10000 }, unseen: ["Land ownership"]
};
process.env.MODELS_API_URL = "https://models.example.test";
process.env.MODELS_API_KEY = "test-only";
process.env.AGENTICORG_BASE_URL = "https://agents.example.test";
process.env.AGENTICORG_API_KEY = "test-only";
process.env.AGENT_ID_LAND_SCOUT = "7e80e8f6-036d-4ec4-8016-1c43df7d831a";
const originalRun = agenticorg.run;
const originalFetch = globalThis.fetch;
let failure = "hitl_triggered";
let model = scan;
let agentCalls = 0;
const timeouts = [];
const originalTimeout = AbortSignal.timeout;
AbortSignal.timeout = ms => { timeouts.push(ms); return originalTimeout(ms); };
globalThis.fetch = async (url, options) => {
  if (String(url).includes("models.example.test")) return Response.json(model);
  agentCalls++;
  assert.equal(options.headers.Authorization, "Bearer test-only");
  const body = JSON.parse(options.body);
  assert.deepEqual(body, {
    action: "process",
    inputs: { task: "Explain this ZeroCarbon Scan result for the landowner.", lat: model.location.lat, lon: model.location.lon, boundary_geojson: null },
    context: {}
  });
  if (failure === "http_error") return new Response("", { status: 400 });
  if (failure === "timeout") throw new DOMException("test timeout", "TimeoutError");
  return Response.json({ status: failure, confidence: .8, output: {} });
};
const log = { info() {}, warn() {}, error() {} };
async function post(router, path, body) {
  const handler = router.stack.find(layer => layer.route?.path === path).route.stack[0].handle;
  let response;
  const res = { json(value) { response = value; return this; }, status() { return this; } };
  await handler({ body, log }, res);
  return response;
}
// Schema validation must work from a production-style, unrelated cwd.
process.chdir(${JSON.stringify(temporary)});
assert.equal((await validateContract("ScanResult", scan)).verdict, "likely_eligible");
await assert.rejects(() => validateContract("ScanResult", { demo: true }));
for (failure of ["hitl_triggered", "failed", "budget_exceeded", "http_error", "timeout", "completed"]) {
  const result = await post(scanRouter, "/scan", { lat: 12.5489, lon: 76.8786 });
  assert.equal(result.available, true, failure);
  assert.equal(result.headline, "Likely eligible");
  assert.match(result.what_to_plant, /Melia dubia/);
  assert.match(result.what_to_plant, /teak/);
  assert.match(result.credits_line, /7.4 to 13.6/);
}
assert.equal(agentCalls, 6, "No automatic retries");
assert.equal(timeouts.filter(ms => ms === 30000).length, 6, "30 seconds per agent");
model = { ...scan, location: { ...scan.location, lat: 12.06, lon: 76.1511 }, verdict: "not_eligible", species: [], credits_per_year: null, money_inr: null };
failure = "failed";
const forest = await post(scanRouter, "/scan", { lat: 12.06, lon: 76.1511 });
assert.equal(forest.headline, "Not eligible");
assert.equal(forest.credits_line, undefined);
assert.equal(forest.money_line, undefined);
assert.deepEqual(normalizeNeedFilters({ market: [], action: ["removal"], status: [], vintage_min: 2024, max_price_inr: 1200, region: "India" }),
  { action: "removal", vintage_from: 2024, max_price: 1200 });
agenticorg.run = async (name, inputs) => {
  if (name === "NEED_INTERPRETER") return { demo: true, filters: { action: ["removal"], vintage_min: 2024, max_price_inr: 1200, region: "India" }, understood: "Removal credits from India, 2024 or later.", unclear: [] };
  assert.equal(name, "LISTING_MATCHER");
  assert.equal(inputs.filters.vintage_from, 2024);
  throw new Error("Matcher unavailable");
};
const need = await post(marketRouter, "/need", { sentence: "500 tonnes of removals from India, 2024 or newer, under 1,200 a tonne" });
assert.equal(need.available, true);
assert.equal(need.message, "");
assert.equal(need.filters.max_price, 1200);
assert.ok(Array.isArray(need.ranked));
assert.equal(need.ranked.length, 1, "Filtered listings survive a matcher failure");
assert.equal(need.ranked[0].listing.id, 1);
agenticorg.run = originalRun;
globalThis.fetch = originalFetch;
AbortSignal.timeout = originalTimeout;
console.log("PASS: bundled schema, six Land Scout failure paths, exact task envelope, no retries, forest omissions, filter aliases, matcher-failure response");
`,
    },
    bundle: true, platform: "node", format: "esm", outfile: output,
    banner: { js: "import { createRequire } from 'node:module'; globalThis.require = createRequire(import.meta.url);" },
    plugins: [{
      name: "isolated-route-dependencies",
      setup(builder) {
        builder.onLoad({ filter: /src\/lib\/events\.ts$/ }, () => ({ contents: "export async function event() {}", loader: "ts" }));
        builder.onLoad({ filter: /src\/lib\/logger\.ts$/ }, () => ({ contents: "export const logger = {info(){},warn(){},error(){}};", loader: "ts" }));
        builder.onLoad({ filter: /src\/lib\/market\.ts$/ }, () => ({
          contents: `export async function visibleListings(_org, filters) {
            if(filters.action !== "removal" || filters.vintage_from !== 2024 || filters.max_price !== 1200 || filters.region) throw new Error("Wrong filters");
            return [{
              id: 1, project_name: "Test removal project", region: "Karnataka",
              market: "voluntary", action: "removal", status: "issued", vintage: 2024,
              registry: "Demo registry", method: "Agroforestry", price_inr_per_t: 1200,
              quantity_t: 1000, delivery_year: null, zerocarbon_score: 92,
              seller_org_id: null, lat: 13.435, lon: 77.731,
              description: "Demo data", hidden: false, demo: true
            }];
          } export async function visibleListing(){ return null; }`,
          loader: "ts",
        }));
      },
    }],
  });
  await import(pathToFileURL(output).href);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
