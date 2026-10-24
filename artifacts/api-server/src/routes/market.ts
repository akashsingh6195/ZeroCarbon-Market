import { Router } from "express";
import { db, listingsTable } from "@workspace/db";
import {
  GetListingsQueryParams, GetListingsResponse, GetListingParams, GetListingResponse,
  GetMarketSummaryResponse, GetInternalListingsResponse, InterpretNeedBody, InterpretNeedResponse,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { organisation, secretEqual } from "../lib/session";
import { visibleListings, visibleListing } from "../lib/market";
import { agenticorg, guardLocally } from "../lib/agenticorg";
import { normalizeNeedFilters } from "../lib/need-filters";

const router = Router();
router.get("/listings", async (req, res) => {
  const parsed = GetListingsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: "Invalid filters." }); return; }
  res.json(GetListingsResponse.parse(await visibleListings(await organisation(req), parsed.data)));
});
router.get("/listings/:id", async (req, res) => {
  const parsed = GetListingParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: "Invalid listing ID." }); return; }
  const listing = await visibleListing(await organisation(req), parsed.data.id);
  if (!listing) { res.status(404).json({ error: "Listing not found." }); return; }
  res.json(GetListingResponse.parse(listing));
});
router.get("/market-summary", async (req, res) => {
  const listings = await visibleListings(await organisation(req));
  res.json(GetMarketSummaryResponse.parse({
    listings: listings.length,
    available_tonnes: listings.filter(l => l.status !== "retired").reduce((n, l) => n + l.quantity_t, 0),
    regions: new Set(listings.map(l => l.region)).size,
    min_price: listings.length ? Math.min(...listings.map(l => l.price_inr_per_t)) : 0,
    max_price: listings.length ? Math.max(...listings.map(l => l.price_inr_per_t)) : 0,
  }));
});
router.get("/internal/listings", async (req, res) => {
  const key = process.env.INTERNAL_KEY;
  if (!key || !secretEqual(req.get("X-Internal-Key") ?? "", key)) {
    res.status(401).json({ error: "A valid internal key is required." }); return;
  }
  res.json(GetInternalListingsResponse.parse(await db.select().from(listingsTable).where(eq(listingsTable.hidden, false))));
});
router.post("/need", async (req, res) => {
  const parsed = InterpretNeedBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Tell us what you need in up to 1,000 characters." }); return; }
  const org = await organisation(req);
  try {
    const interpreted = await agenticorg.run("NEED_INTERPRETER", { sentence: parsed.data.sentence }, org?.id);
    const filters = GetListingsQueryParams.parse(normalizeNeedFilters(interpreted.filters as Record<string, unknown>));
    const visible = await visibleListings(org, filters);
    let ranked = visible.map(listing => ({ listing, why: "Matches your requested filters." }));
    try {
      const matches = await agenticorg.run("LISTING_MATCHER", {
        filters, buyer_type: org?.roles.includes("Trader") ? "trader_voluntary_only" : org?.buyer_type ?? "voluntary",
      }, org?.id);
      const results = matches.results as { listing_id: number; rank: number; why: string }[];
      const matched = [...results].sort((a, b) => a.rank - b.rank).flatMap(match => {
        const listing = visible.find(l => l.id === match.listing_id);
        return listing ? [{ listing, why: guardLocally(match.why) }] : [];
      });
      // Do not hide valid filtered listings when the ranking agent omits them.
      ranked = matched.concat(ranked.filter(item => !matched.some(m => m.listing.id === item.listing.id)));
    } catch {
      req.log.info("Listing Matcher unavailable; using Need Interpreter filters");
    }
    res.json(InterpretNeedResponse.parse({
      // Local safety avoids an extra remote guard call for every listing.
      available: true, message: "", understood: guardLocally(interpreted.understood as string),
      filters, ranked,
    }));
  } catch {
    res.json(InterpretNeedResponse.parse({
      available: false, message: "Our assistant is busy, use the filters", understood: "", filters: {}, ranked: [],
    }));
  }
});
export default router;
