import { pgTable, text, doublePrecision, integer, timestamp, jsonb, boolean, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { organisationsTable } from "./organisations";
import { listingsTable } from "./listings";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey(),
  org_id: text("org_id").notNull().references(() => organisationsTable.id),
  listing_id: integer("listing_id").notNull().references(() => listingsTable.id),
  listing_snapshot: jsonb("listing_snapshot").$type<Record<string, unknown>>().notNull(),
  quantity_t: doublePrecision("quantity_t").notNull(),
  price_inr_per_t: doublePrecision("price_inr_per_t").notNull(),
  fee_rate: doublePrecision("fee_rate").notNull().default(0),
  fee_inr: integer("fee_inr").notNull().default(0),
  fee_status: text("fee_status").notNull().default("none"),
  route: text("route").notNull(),
  stage: text("stage").notNull(),
  stages_done: text("stages_done").array().notNull(),
  claim_text: text("claim_text").notNull(),
  certificate_json: jsonb("certificate_json").$type<Record<string, unknown>>(),
  certificate_token: text("certificate_token").notNull().unique(),
  retired_logged: boolean("retired_logged").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  check("order_fee_status", sql`${t.fee_status} in ('pending','earned','none','cancelled')`),
]);
export const insertOrderSchema = createInsertSchema(ordersTable);
export type OrderRow = typeof ordersTable.$inferSelect;
