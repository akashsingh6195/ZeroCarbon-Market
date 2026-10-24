import { Router } from "express";
import { RecordPlanInterestBody, RecordPlanInterestResponse } from "@workspace/api-zod";
import { organisation } from "../lib/session";
import { visibleListing } from "../lib/market";
import { event } from "../lib/events";

const router = Router();

router.post("/plan-interest", async (req, res): Promise<void> => {
  const input = RecordPlanInterestBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "Choose a valid plan or service." });
    return;
  }

  const { plan, listing_id } = input.data;
  if ((plan === "due_diligence") !== (listing_id !== undefined)) {
    res.status(400).json({ error: "Choose a listing for a due-diligence request." });
    return;
  }

  const org = await organisation(req);
  if (listing_id !== undefined && !await visibleListing(org, listing_id)) {
    res.status(404).json({ error: "Listing not found." });
    return;
  }

  await event("plan_interest", org?.id ?? null, {
    plan,
    role: org?.roles.join(", ") ?? "Visitor",
    org: org?.name ?? null,
    ...(listing_id !== undefined ? { listing_id } : {}),
  });
  res.json(RecordPlanInterestResponse.parse({
    message: "Thanks, we will get in touch. Demo: nothing is charged.",
  }));
});

export default router;
