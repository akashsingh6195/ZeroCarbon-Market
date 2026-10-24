import { Router } from "express";
import { db, eventsTable, listingsTable, organisationsTable, ordersTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  GetLiveStatsResponse, RecordVisitBody, AdminLoginBody, GetAdminDashboardResponse,
  UpdateListingVisibilityBody, UpdateListingVisibilityParams, UpdateListingVisibilityResponse,
} from "@workspace/api-zod";
import { event } from "../lib/events";
import { requireAdmin, createSession, secretEqual, publicOrganisation } from "../lib/session";
import { publicOrder } from "../lib/order-service";
import { integrationStatus } from "../lib/agenticorg";

const router = Router();
async function revenue() {
  const [totals] = await db.select({
    fees_earned_inr: sql<number>`coalesce(sum(${ordersTable.fee_inr}) filter (where ${ordersTable.fee_status} = 'earned'), 0)::int`,
    fees_pending_inr: sql<number>`coalesce(sum(${ordersTable.fee_inr}) filter (where ${ordersTable.fee_status} = 'pending'), 0)::int`,
    completed_voluntary_orders: sql<number>`count(*) filter (where ${ordersTable.fee_status} = 'earned' and ${ordersTable.route} in ('voluntary','authorised'))::int`,
    credit_value_traded_inr: sql<number>`coalesce(sum(${ordersTable.quantity_t} * ${ordersTable.price_inr_per_t}) filter (where 'Credits delivered' = any(${ordersTable.stages_done})), 0)::float8`,
  }).from(ordersTable);
  const plans = await db.select({
    plan: sql<string>`${eventsTable.payload}->>'plan'`,
    count: sql<number>`count(*)::int`,
  }).from(eventsTable)
    .where(eq(eventsTable.kind, "plan_interest"))
    .groupBy(sql`${eventsTable.payload}->>'plan'`);
  return {
    ...totals,
    plan_interest_counts: Object.fromEntries(plans.filter(row => row.plan).map(row => [row.plan, Number(row.count)])),
  };
}

async function stats() {
  const [row] = await db.select({
    signups: sql<number>`count(*) filter (where kind = 'signup')::int`,
    orders: sql<number>`count(*) filter (where kind = 'order')::int`,
    tonnes_retired: sql<number>`coalesce(sum(case when kind = 'retired' then (payload->>'quantity_t')::numeric else 0 end), 0)::float8`,
    scans: sql<number>`count(*) filter (where kind = 'scan')::int`,
    qr_visits: sql<number>`count(*) filter (where kind = 'visit' and payload->>'src' = 'qr')::int`,
  }).from(eventsTable);
  const [fees] = await db.select({
    fees_earned_inr: sql<number>`coalesce(sum(${ordersTable.fee_inr}) filter (where ${ordersTable.fee_status} = 'earned'), 0)::int`,
  }).from(ordersTable);
  return { ...row, ...fees, demo: true };
}
router.get("/live", async (_req, res) => {
  res.set("Cache-Control", "no-store").json(GetLiveStatsResponse.parse(await stats()));
});
router.post("/visits", async (req, res) => {
  const input = RecordVisitBody.safeParse(req.body);
  if (!input.success) { res.status(400).json({ error: "Invalid visit source." }); return; }
  await event("visit", null, { src: input.data.src ?? "direct" });
  res.json({ message: "Visit recorded." });
});
const attempts = new Map<string, { count: number; reset: number }>();
router.post("/admin/login", async (req, res) => {
  if (!process.env.ADMIN_PIN) {
    res.status(503).json({ error: "Admin access is not configured. Add ADMIN_PIN in project Secrets." }); return;
  }
  const ip = req.ip ?? "unknown", now = Date.now();
  let attempt = attempts.get(ip);
  if (!attempt || attempt.reset <= now) { attempt = { count: 0, reset: now + 15 * 60 * 1000 }; attempts.set(ip, attempt); }
  if (attempt.count >= 10) { res.status(429).json({ error: "Too many attempts. Please wait 15 minutes." }); return; }
  attempt.count++;
  const input = AdminLoginBody.safeParse(req.body);
  if (!input.success || !secretEqual(input.data.pin, process.env.ADMIN_PIN)) {
    res.status(401).json({ error: "Incorrect admin PIN." }); return;
  }
  attempts.delete(ip);
  await createSession(res, null, true);
  res.json({ message: "Admin access granted." });
});
router.get("/admin", requireAdmin, async (_req, res) => {
  const [live, listings, events, orgs, orders, revenueStats] = await Promise.all([
    stats(), db.select().from(listingsTable).orderBy(listingsTable.id),
    db.select().from(eventsTable).orderBy(desc(eventsTable.created_at)).limit(500),
    db.select().from(organisationsTable).orderBy(desc(organisationsTable.created_at)).limit(500),
    db.select().from(ordersTable).orderBy(desc(ordersTable.created_at)).limit(500),
    revenue(),
  ]);
  res.set("Cache-Control", "no-store").json(GetAdminDashboardResponse.parse({
    stats: live, listings,
    events: events.map(e => ({ id: e.id, kind: e.kind, payload: e.payload, created_at: e.created_at.toISOString() })),
    organisations: orgs.map(publicOrganisation), orders: orders.map(publicOrder), integration_status: integrationStatus(),
    revenue: revenueStats,
  }));
});
router.patch("/admin/listings/:id", requireAdmin, async (req, res) => {
  const input = UpdateListingVisibilityBody.safeParse(req.body), params = UpdateListingVisibilityParams.safeParse(req.params);
  if (!input.success || !params.success) { res.status(400).json({ error: "Choose a listing and visibility." }); return; }
  const [listing] = await db.update(listingsTable).set({ hidden: input.data.hidden }).where(eq(listingsTable.id, params.data.id)).returning();
  if (!listing) { res.status(404).json({ error: "Listing not found." }); return; }
  await event("listing_visibility", null, { listing_id: listing.id, hidden: listing.hidden });
  res.json(UpdateListingVisibilityResponse.parse(listing));
});
export default router;
