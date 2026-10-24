import { pgTable, integer, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { organisationsTable } from "./organisations";

export const eventsTable = pgTable("events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  kind: text("kind").notNull(),
  org_id: text("org_id").references(() => organisationsTable.id),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const insertEventSchema = createInsertSchema(eventsTable);
