import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db, organisationsTable } from "@workspace/db";
import { SignupBody, SignupResponse, GetSessionResponse } from "@workspace/api-zod";
import { organisation, publicOrganisation, nextScreen, createSession, destroySession } from "../lib/session";
import { event } from "../lib/events";

const router = Router();
router.get("/session", async (req, res) => {
  const org = await organisation(req);
  res.json(GetSessionResponse.parse({ organisation: org ? publicOrganisation(org) : null, next_screen: nextScreen(org) }));
});
router.post("/signup", async (req, res) => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Enter your name, phone, organisation and at least one role." }); return; }
  const input = parsed.data;
  if (!input.name.trim() || !input.organisation_name.trim() || !/^(?:\+91[\s-]?)?[6-9]\d{9}$/.test(input.phone.replace(/[\s()-]/g, ""))) {
    res.status(400).json({ error: "Enter a valid Indian mobile number and non-empty names." }); return;
  }
  if (input.roles.includes("Buyer") && !input.buyer_type) { res.status(400).json({ error: "Choose whether your plant has a CCTS target." }); return; }
  if (input.roles.includes("Seller") && !input.seller_type) { res.status(400).json({ error: "Choose land, a project, or credits." }); return; }
  if (await organisation(req)) await destroySession(req, res);
  const [org] = await db.insert(organisationsTable).values({
    id: randomUUID(), name: input.organisation_name.trim(), contact_name: input.name.trim(),
    phone: input.phone.replace(/[\s()-]/g, ""), roles: [...new Set(input.roles)],
    buyer_type: input.buyer_type ?? "voluntary", seller_type: input.seller_type,
  }).returning();
  await createSession(res, org.id);
  await event("signup", org.id, { roles: org.roles, buyer_type: org.buyer_type, demo: true });
  res.json(SignupResponse.parse({ organisation: publicOrganisation(org), next_screen: nextScreen(org) }));
});
router.delete("/session", async (req, res) => {
  await destroySession(req, res);
  res.json({ message: "Signed out." });
});
export default router;
