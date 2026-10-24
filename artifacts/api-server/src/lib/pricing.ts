import pricing from "../../../../shared/pricing.json";

const feeRoutes = new Set(["voluntary", "authorised"]);
const cancellationStages = new Set(["cancelled", "canceled", "refunded"]);

export function feeRateForRoute(route: string) {
  return feeRoutes.has(route) ? pricing.deal_fee.standard_rate : 0;
}

export function feeAmountInr(quantityT: number, priceInrPerT: number, feeRate: number) {
  return Math.round(quantityT * priceInrPerT * feeRate);
}

export function isCancelledBeforeDelivery(stage: string, stagesDone: string[]) {
  const normalized = stage.toLowerCase();
  const isCancelled = cancellationStages.has(normalized) || normalized.includes("cancel") || normalized.includes("refund");
  return isCancelled && !stagesDone.includes("Credits delivered");
}

export function feeStatusForOrder(route: string, stage: string, stagesDone: string[]) {
  if (feeRateForRoute(route) === 0) return "none" as const;
  if (stagesDone.includes("Credits delivered")) return "earned" as const;
  if (isCancelledBeforeDelivery(stage, stagesDone)) return "cancelled" as const;
  return "pending" as const;
}
