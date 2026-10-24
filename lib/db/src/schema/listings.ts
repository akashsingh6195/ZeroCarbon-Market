import { pgTable, text, integer, doublePrecision, boolean, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { organisationsTable } from "./organisations";

export const listingsTable = pgTable("listings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  project_name: text("project_name").notNull(),
  region: text("region").notNull(),
  market: text("market").notNull(),
  action: text("action").notNull(),
  status: text("status").notNull(),
  vintage: integer("vintage").notNull(),
  registry: text("registry").notNull(),
  method: text("method").notNull(),
  price_inr_per_t: doublePrecision("price_inr_per_t").notNull(),
  quantity_t: doublePrecision("quantity_t").notNull(),
  delivery_year: integer("delivery_year"),
  zerocarbon_score: integer("zerocarbon_score").notNull(),
  seller_org_id: text("seller_org_id").references(() => organisationsTable.id),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
  description: text("description").notNull(),
  hidden: boolean("hidden").notNull().default(false),
  demo: boolean("demo").notNull().default(true),
}, (t) => [
  check("listing_market", sql`${t.market} in ('india_compliance','india_offset','voluntary','authorised')`),
  check("listing_action", sql`${t.action} in ('removal','reduction','avoidance')`),
  check("listing_status", sql`${t.status} in ('future','issued','retired')`),
  check("listing_future_delivery", sql`${t.status} <> 'future' or ${t.delivery_year} is not null`),
  check("listing_quantity", sql`${t.quantity_t} >= 0`),
  check("listing_price", sql`${t.price_inr_per_t} > 0`),
]);
export const insertListingSchema = createInsertSchema(listingsTable);
export type ListingRow = typeof listingsTable.$inferSelect;
