import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { db, sessionsTable, organisationsTable, type OrganisationRow } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  signed: true,
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
};

export function secretEqual(a: string, b: string) {
  const aa = Buffer.from(a), bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export async function createSession(res: Response, orgId: string | null, admin = false) {
  if (!process.env.SESSION_SECRET) throw new Error("Session signing is not configured");
  const id = randomBytes(32).toString("hex");
  await db.insert(sessionsTable).values({
    id, org_id: orgId, kind: admin ? "admin" : "organisation",
    expires_at: new Date(Date.now() + cookieOptions.maxAge),
  });
  res.cookie(admin ? "zc_admin" : "zc_demo", id, cookieOptions);
}

async function session(req: Request, admin = false) {
  const id = req.signedCookies?.[admin ? "zc_admin" : "zc_demo"];
  if (typeof id !== "string") return null;
  const [row] = await db.select().from(sessionsTable).where(and(
    eq(sessionsTable.id, id),
    eq(sessionsTable.kind, admin ? "admin" : "organisation"),
    gt(sessionsTable.expires_at, new Date()),
  ));
  return row ?? null;
}
export async function organisation(req: Request): Promise<OrganisationRow | null> {
  const s = await session(req);
  if (!s?.org_id) return null;
  const [org] = await db.select().from(organisationsTable).where(eq(organisationsTable.id, s.org_id));
  return org ?? null;
}
export function publicOrganisation(org: OrganisationRow) {
  return { id: org.id, name: org.contact_name, organisation_name: org.name, roles: org.roles, buyer_type: org.buyer_type };
}
export function nextScreen(org: OrganisationRow | null) {
  if (!org) return "/signup";
  if (org.roles.includes("Trader")) return "/market";
  if (org.buyer_type === "obligated") return "/comply";
  if (org.roles.includes("Seller") && !org.roles.includes("Buyer")) return "/scan";
  return "/market";
}
export async function destroySession(req: Request, res: Response) {
  const id = req.signedCookies?.zc_demo;
  if (typeof id === "string") await db.delete(sessionsTable).where(eq(sessionsTable.id, id));
  res.clearCookie("zc_demo", { path: "/" });
}
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!process.env.ADMIN_PIN) {
    res.status(503).json({ error: "Admin access is not configured. Add ADMIN_PIN in project Secrets." }); return;
  }
  if (!await session(req, true)) { res.status(401).json({ error: "Enter your admin PIN." }); return; }
  next();
}

// No browser-originated cross-site writes, including session creation.
export function sameOrigin(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) { next(); return; }
  if (req.get("sec-fetch-site") === "cross-site") {
    res.status(403).json({ error: "Cross-site requests are not allowed." }); return;
  }
  const origin = req.get("origin");
  const forwardedHost = req.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (origin) {
    let host: string;
    try { host = new URL(origin).host; } catch { res.sendStatus(403); return; }
    if (![req.get("host"), forwardedHost].filter(Boolean).includes(host)) {
      res.status(403).json({ error: "Request origin is not allowed." }); return;
    }
  }
  next();
}
