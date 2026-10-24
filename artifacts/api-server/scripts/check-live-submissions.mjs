import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const temporary = await mkdtemp(path.join(tmpdir(), "zc-live-submissions-"));
try {
  const output = path.join(temporary, "check.mjs");
  const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  await build({
    stdin: {
      resolveDir: apiDir,
      contents: `
import assert from "node:assert/strict";
import { getLiveSubmissions } from "./src/lib/live-submissions.ts";

process.env.LIVE_SUBMISSIONS_CSV_URL = "https://example.test/payments.csv";
const csv = [
  "Timestamp,Name/Organisation,Product,Amount paid,Payment Screenshot,Date of Payment,Transaction/UTR,Notes,How did you hear about our services?,On a scale of 1-5, how satisfied were you with the payment process?",
  '"10/24/2026 12:00:00","Akash Singh 9876543210 akash@example.test","Consultancy service","Rs 2,990","https://example.test/payment.png","10/24/2026","123456789012","private note, with ""quoted text""","Google Search +91 9876543210","5"',
  ',Someone,"Buying carbon credits","not a number","screenshot","today","utr","notes","Friend","4"',
].join("\\n");
let calls = 0;
globalThis.fetch = async () => {
  calls++;
  return calls === 1 ? new Response(csv, { status: 200 }) : new Response("", { status: 503 });
};
const first = await getLiveSubmissions();
assert.equal(calls, 1);
assert.equal(first.total_submissions, 1, "Rows without timestamps are ignored");
assert.equal(first.total_amount_inr, 2990);
assert.equal(first.product_counts.consultancy_service, 1);
assert.equal(first.average_satisfaction, 5);
assert.deepEqual(first.heard_about, [{ source: "Google S.", count: 1 }]);
assert.equal(first.latest[0].name, "Akash S.");
assert.equal(first.latest[0].product, "Consultancy service");
assert.equal(first.latest[0].amount_inr, 2990);
assert.equal(first.latest[0].timestamp, "2026-10-24T06:30:00.000Z");
const wire = JSON.stringify(first);
for (const forbidden of ["9876543210", "akash@example.test", "example.test/payment.png", "123456789012", "private note", "Akash Singh"])
  assert.equal(wire.includes(forbidden), false, "Sensitive source value was excluded");
await getLiveSubmissions(Date.now() + 20_000);
assert.equal(calls, 1, "Cached reads do not fetch the sheet again within one minute");
const stale = await getLiveSubmissions(Date.now() + 61_000);
assert.equal(calls, 2);
assert.equal(stale.stale, true);
assert.equal(stale.total_submissions, 1, "A failed refresh preserves last good totals");
assert.equal(JSON.stringify(stale).includes("123456789012"), false);
console.log("PASS: quoted CSV, summary aggregation, row filtering, name/contact privacy, one-minute cache, stale-data retention");
`,
    },
    bundle: true, platform: "node", format: "esm", outfile: output,
  });
  await import(pathToFileURL(output).href);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
