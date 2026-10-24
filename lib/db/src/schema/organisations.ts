import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const organisationsTable = pgTable("organisations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  contact_name: text("contact_name").notNull(),
  roles: text("roles").array().notNull(),
  buyer_type: text("buyer_type").notNull().default("voluntary"),
  seller_type: text("seller_type"),
  phone: text("phone").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertOrganisationSchema = createInsertSchema(organisationsTable);
export type OrganisationRow = typeof organisationsTable.$inferSelect;

export const sessionsTable = pgTable("demo_sessions", {
  id: text("id").primaryKey(),
  org_id: text("org_id").references(() => organisationsTable.id),
  kind: text("kind").notNull().default("organisation"),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
});
