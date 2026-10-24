import { db, ordersTable, eventsTable, organisationsTable, type OrderRow, type ListingRow } from "@workspace/db";
import { and, eq, lt, inArray } from "drizzle-orm";
import { defaultClaim } from "./market";
import { agenticorg, guard } from "./agenticorg";
import { logger } from "./logger";

export function orderStages(route: string) {
  return route === "india_offset"
    ? ["Order placed", "Bid prepared", "Monthly session", "Credits delivered", "Retired", "Certificate ready"]
    : ["Order placed", "Payment held", "Transfer started", "Credits delivered", "Retired", "Certificate ready"];
}
export function certificateFor(row: OrderRow) {
  const listing = row.listing_snapshot as unknown as ListingRow;
  return {
    token: row.certificate_token, project_name: listing.project_name,
    tonnes: row.quantity_t, vintage: listing.vintage,
    text: `${defaultClaim(listing, row.quantity_t)}\n\nDemo data. Not a real retirement.`,
    serial_numbers: [`DEMO-ZC-${row.id.slice(0, 8).toUpperCase()}-001`],
    issued_at: new Date(row.created_at.getTime() + 15000).toISOString(), demo: true,
  };
}
export function publicOrder(row: OrderRow) {
  return {
    id: row.id, listing: row.listing_snapshot,
    quantity_t: row.quantity_t, price_inr_per_t: row.price_inr_per_t,
    route: row.route, stage: row.stage, stages: orderStages(row.route), stages_done: row.stages_done,
    claim_text: row.claim_text, certificate_token: row.certificate_token,
    created_at: row.created_at.toISOString(), demo: true,
  };
}
export async function advanceOrder(id: string) {
  return db.transaction(async tx => {
    const [row] = await tx.select().from(ordersTable).where(eq(ordersTable.id, id)).for("update");
    if (!row) return null;
    const stages = orderStages(row.route);
    const index = Math.min(stages.length - 1, Math.max(0, Math.floor((Date.now() - row.created_at.getTime()) / 3000)));
    const done = stages.slice(0, index + 1);
    const retired = index >= 4;
    if (retired && !row.retired_logged) await tx.insert(eventsTable).values({
      kind: "retired", org_id: row.org_id, payload: { order_id: row.id, quantity_t: row.quantity_t, demo: true },
    });
    if (row.stage !== stages[index] || (retired && !row.retired_logged)) {
      const [updated] = await tx.update(ordersTable).set({
        stage: stages[index], stages_done: done, retired_logged: retired || row.retired_logged,
      }).where(eq(ordersTable.id, id)).returning();
      return updated;
    }
    return row;
  });
}

export async function advancePendingOrders() {
  const pending = await db.select({ id: ordersTable.id }).from(ordersTable)
    .where(and(lt(ordersTable.created_at, new Date()), inArray(ordersTable.stage, [
      "Order placed", "Payment held", "Transfer started", "Bid prepared", "Monthly session", "Credits delivered", "Retired",
    ])));
  for (const row of pending) await advanceOrder(row.id);
}

export async function writeCertificate(row: OrderRow) {
  const fixed = certificateFor(row);
  let text = fixed.text;
  try {
    if (!row.org_id) throw new Error("Certificate buyer is unavailable");
    const [buyer] = await db.select({ name: organisationsTable.name }).from(organisationsTable)
      .where(eq(organisationsTable.id, row.org_id));
    if (!buyer) throw new Error("Certificate buyer is unavailable");
    const listing = row.listing_snapshot as unknown as ListingRow;
    const result = await agenticorg.run("CERTIFICATE_WRITER", {
      buyer_name: buyer.name,
      quantity_t: fixed.tonnes,
      project: fixed.project_name,
      action: listing.action,
      vintage: fixed.vintage,
      serials: fixed.serial_numbers,
      retired_on: new Date(row.created_at.getTime() + 12000).toISOString(),
    }, row.org_id);
    if (typeof result.headline !== "string" || typeof result.body !== "string" ||
        result.footer !== "Demo data. Not a real retirement.") throw new Error("Certificate output is invalid");
    const verifiedCopy = await guard(`${result.headline}\n\n${result.body}`, "certificate", "Buyer", row.org_id);
    text = `${verifiedCopy}\n\n${result.footer}`;
  } catch { /* The fixed, clearly labelled demo certificate is the specified fallback. */ }
  await db.update(ordersTable).set({ certificate_json: { ...fixed, text } }).where(eq(ordersTable.id, row.id));
}

let progressing = false;
export function startOrderTicker() {
  const timer = setInterval(async () => {
    if (progressing) return;
    progressing = true;
    try { await advancePendingOrders(); }
    catch (err) { logger.error({ err }, "Demo order advancement failed"); }
    finally { progressing = false; }
  }, 1000);
  timer.unref();
}
