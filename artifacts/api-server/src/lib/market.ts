import { and, eq, gte, lte, ilike, or, type SQL } from "drizzle-orm";
import { db, listingsTable, type OrganisationRow, type ListingRow } from "@workspace/db";

export function visibleTo(org: OrganisationRow | null, listing: ListingRow) {
  if (listing.hidden) return false;
  if (org?.roles.includes("Trader")) return listing.market === "voluntary";
  if (org?.buyer_type === "obligated") return listing.market === "india_compliance";
  return true;
}
export async function visibleListings(org: OrganisationRow | null, filters: Record<string, unknown> = {}) {
  const conditions: SQL[] = [eq(listingsTable.hidden, false)];
  if (org?.roles.includes("Trader")) conditions.push(eq(listingsTable.market, "voluntary"));
  else if (org?.buyer_type === "obligated") conditions.push(eq(listingsTable.market, "india_compliance"));
  for (const key of ["market", "action", "status"] as const) {
    if (typeof filters[key] === "string" && filters[key]) conditions.push(eq(listingsTable[key], filters[key] as string));
  }
  if (typeof filters.vintage_from === "number") conditions.push(gte(listingsTable.vintage, filters.vintage_from));
  if (typeof filters.max_price === "number") conditions.push(lte(listingsTable.price_inr_per_t, filters.max_price));
  if (typeof filters.region === "string" && filters.region) conditions.push(ilike(listingsTable.region, `%${filters.region}%`));
  if (typeof filters.search === "string" && filters.search) {
    const q = `%${filters.search}%`;
    conditions.push(or(ilike(listingsTable.project_name, q), ilike(listingsTable.method, q), ilike(listingsTable.region, q))!);
  }
  return db.select().from(listingsTable).where(and(...conditions)).orderBy(listingsTable.id);
}
export async function visibleListing(org: OrganisationRow | null, id: number) {
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));
  return listing && visibleTo(org, listing) ? listing : null;
}
export function defaultClaim(listing: Pick<ListingRow, "action" | "project_name" | "vintage">, tonnes: number) {
  return `We retired ${tonnes} tonnes of ${listing.action} credits from ${listing.project_name}, vintage ${listing.vintage}. Demo data only; no real retirement has taken place.`;
}
