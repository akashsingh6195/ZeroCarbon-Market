import { db, eventsTable } from "@workspace/db";

export async function event(kind: string, org_id: string | null, payload: Record<string, unknown> = {}) {
  await db.insert(eventsTable).values({ kind, org_id, payload });
}
