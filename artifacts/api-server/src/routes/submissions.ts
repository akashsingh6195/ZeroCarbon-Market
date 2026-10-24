import { Router } from "express";
import { GetLiveSubmissionsResponse } from "@workspace/api-zod";
import { getLiveSubmissions } from "../lib/live-submissions";

const router = Router();

router.get("/live/submissions", async (_req, res): Promise<void> => {
  res.set("Cache-Control", "no-store");
  res.json(GetLiveSubmissionsResponse.parse(await getLiveSubmissions()));
});

export default router;
