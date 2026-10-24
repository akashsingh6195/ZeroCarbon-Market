import { Router } from "express";
import { ForecastSampleComplianceResponse } from "@workspace/api-zod";
import { getSampleFactoryForecast } from "../lib/models-service";

const router = Router();

router.post("/comply/sample-forecast", async (req, res): Promise<void> => {
  try {
    const forecast = await getSampleFactoryForecast();
    res.json(ForecastSampleComplianceResponse.parse({
      available: true,
      message: "",
      ...forecast,
    }));
  } catch (err) {
    req.log.warn({
      reason: err instanceof Error ? err.message : "Unknown forecast error",
    }, "Sample factory forecast unavailable");
    res.json(ForecastSampleComplianceResponse.parse({
      available: false,
      message: "The sample could not be worked out right now.",
    }));
  }
});

export default router;
