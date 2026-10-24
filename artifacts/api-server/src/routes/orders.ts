import { Router } from "express";
import { randomUUID, randomBytes } from "node:crypto";
import { and, eq, desc } from "drizzle-orm";
import { db, ordersTable, listingsTable, eventsTable, type ListingRow } from "@workspace/db";
import {
  CheckClaimBody, CheckClaimResponse, CreateOrderBody, CreateOrderResponse, GetOrdersResponse,
  GetOrderParams, GetOrderResponse, GetCertificateParams, GetCertificateResponse, AskOrderParams, AskOrderBody, AskOrderResponse,
} from "@workspace/api-zod";
import { organisation } from "../lib/session";
import { visibleListing, visibleTo, defaultClaim } from "../lib/market";
import { agenticorg, guard, blockedPhrases } from "../lib/agenticorg";
import { advanceOrder, publicOrder, certificateFor, writeCertificate } from "../lib/order-service";
import { event } from "../lib/events";
import { logger } from "../lib/logger";

const router = Router();
router.post("/claim-check", async (req, res) => {
  const input = CheckClaimBody.safeParse(req.body);
  if (!input.success) { res.status(400).json({ error: "Choose a listing and valid quantity." }); return; }
  const org = await organisation(req), data = input.data;
  const listing = await visibleListing(org, data.listing_id);
  if (!listing) { res.status(404).json({ error: "Listing not found." }); return; }
  if (listing.status !== "issued" || !Number.isFinite(data.quantity_t) || data.quantity_t > listing.quantity_t) {
    res.status(400).json({ error: "Choose available issued credits and a quantity within the listing's supply." }); return;
  }
  let allowed_wording = defaultClaim(listing, data.quantity_t), fallback = true;
  let flags = blockedPhrases(data.claim_text);
  try {
    const result = await agenticorg.run("CLAIM_CHECKER", {
      planned_claim: data.claim_text,
      credits: data.quantity_t,
      company_emissions_t: null,
    }, org?.id);
    if (typeof result.allowed_wording !== "string" || !Array.isArray(result.flagged)) throw new Error("Invalid claim result");
    allowed_wording = await guard(result.allowed_wording, "claim-check", "Buyer", org?.id);
    flags = [...new Set([...flags, ...(Array.isArray(result.flagged) ? result.flagged.filter((x): x is string => typeof x === "string") : [])])];
    fallback = false;
  } catch { /* Use the specified fixed factual template. */ }
  res.json(CheckClaimResponse.parse({ allowed_wording, flagged_phrases: flags, fallback }));
});
router.post("/orders", async (req, res) => {
  const org = await organisation(req);
  if (!org) { res.status(401).json({ error: "Sign up before placing a demo order." }); return; }
  if (!org.roles.some(r => ["Buyer", "Trader"].includes(r))) { res.status(403).json({ error: "A buyer or trader role is required." }); return; }
  if (!org.roles.includes("Trader") && org.buyer_type === "obligated") {
    res.status(403).json({ error: "ZeroCarbon Comply is coming soon. Compliance credits cannot be bought in this demo." }); return;
  }
  const input = CreateOrderBody.safeParse(req.body);
  if (!input.success || !input.data.demo_payment_approved) {
    res.status(400).json({ error: "Approve the clearly labelled demo payment. No money moves." }); return;
  }
  const data = input.data;
  if (!Number.isFinite(data.quantity_t) || data.quantity_t < 0.001 || Math.round(data.quantity_t * 1000) !== data.quantity_t * 1000) {
    res.status(400).json({ error: "Enter tonnes to at most three decimal places, at least 0.001." }); return;
  }
  const row = await db.transaction(async tx => {
    const [listing] = await tx.select().from(listingsTable).where(eq(listingsTable.id, data.listing_id)).for("update");
    if (!listing || !visibleTo(org, listing) || listing.status !== "issued" ||
        listing.market === "india_compliance" || data.quantity_t > listing.quantity_t) return null;
    const [order] = await tx.insert(ordersTable).values({
      id: randomUUID(), org_id: org.id, listing_id: listing.id, listing_snapshot: { ...listing },
      quantity_t: data.quantity_t, price_inr_per_t: listing.price_inr_per_t, route: listing.market,
      stage: "Order placed", stages_done: ["Order placed"],
      // User text is not promoted into a certificate claim without a trusted factual check.
      claim_text: defaultClaim(listing, data.quantity_t),
      certificate_token: randomBytes(24).toString("hex"),
    }).returning();
    await tx.update(listingsTable).set({ quantity_t: Math.round((listing.quantity_t - data.quantity_t) * 1000) / 1000 }).where(eq(listingsTable.id, listing.id));
    await tx.insert(eventsTable).values({ kind: "order", org_id: org.id, payload: { order_id: order.id, quantity_t: order.quantity_t, demo: true } });
    return order;
  });
  if (!row) { res.status(409).json({ error: "This listing or quantity is no longer available for demo purchase." }); return; }
  void writeCertificate(row).catch(err => logger.error({ err }, "Certificate assistant failed; fixed template retained"));
  res.status(201).json(CreateOrderResponse.parse(publicOrder(row)));
});
router.get("/orders", async (req, res) => {
  const org = await organisation(req);
  if (!org) { res.status(401).json({ error: "Sign up to see your demo orders." }); return; }
  const rows = await db.select().from(ordersTable).where(eq(ordersTable.org_id, org.id)).orderBy(desc(ordersTable.created_at));
  const advanced = await Promise.all(rows.map(row => advanceOrder(row.id)));
  res.json(GetOrdersResponse.parse(advanced.filter(row => row !== null).map(publicOrder)));
});
router.get("/orders/:id", async (req, res) => {
  const org = await organisation(req), params = GetOrderParams.safeParse(req.params);
  if (!org) { res.status(401).json({ error: "Sign up to see your demo orders." }); return; }
  if (!params.success) { res.status(400).json({ error: "Invalid order ID." }); return; }
  const [owned] = await db.select().from(ordersTable).where(and(eq(ordersTable.id, params.data.id), eq(ordersTable.org_id, org.id)));
  if (!owned) { res.status(404).json({ error: "Order not found." }); return; }
  const row = await advanceOrder(owned.id);
  res.json(GetOrderResponse.parse(publicOrder(row!)));
});
router.get("/certificates/:token", async (req, res) => {
  const params = GetCertificateParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid certificate link." }); return; }
  const [found] = await db.select().from(ordersTable).where(eq(ordersTable.certificate_token, params.data.token));
  if (!found) { res.status(404).json({ error: "Certificate not found." }); return; }
  const row = (await advanceOrder(found.id))!;
  if (row.stage !== "Certificate ready") { res.status(409).json({ error: "Your demo certificate is being prepared. Please wait for the order tracker." }); return; }
  res.json(GetCertificateResponse.parse(row.certificate_json ?? certificateFor(row)));
});
router.post("/orders/:id/question", async (req, res) => {
  const org = await organisation(req), params = AskOrderParams.safeParse(req.params), input = AskOrderBody.safeParse(req.body);
  if (!org) { res.status(401).json({ error: "Sign in to ask about an order." }); return; }
  if (!params.success || !input.success) { res.status(400).json({ error: "Enter an order question." }); return; }
  const [row] = await db.select().from(ordersTable).where(and(eq(ordersTable.id, params.data.id), eq(ordersTable.org_id, org.id)));
  if (!row) { res.status(404).json({ error: "Order not found." }); return; }
  try {
    const result = await agenticorg.run("ORDER_CONCIERGE", { order: publicOrder(row), question: input.data.question }, org.id);
    if (typeof result.reply !== "string" || typeof result.escalate !== "boolean") throw new Error("Invalid concierge result");
    if (result.escalate) await event("escalation", org.id, { order_id: row.id, question: input.data.question, problem_type: result.problem_type });
    res.json(AskOrderResponse.parse({ answer: await guard(result.reply, "order", org.roles.join(","), org.id), see_screen: `/orders/${row.id}`, escalate: result.escalate, available: true }));
  } catch {
    await event("escalation", org.id, { order_id: row.id, question: input.data.question, reason: "concierge_unavailable" });
    res.json(AskOrderResponse.parse({ answer: "Our assistant is busy. Your question has been saved for the team to review.", see_screen: `/orders/${row.id}`, escalate: true, available: false }));
  }
});
export default router;
