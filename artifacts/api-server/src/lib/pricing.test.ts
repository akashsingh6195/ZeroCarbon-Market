import { test } from "node:test";
import assert from "node:assert/strict";
import { feeAmountInr, feeRateForRoute, feeStatusForOrder } from "./pricing";
import pricing from "../../../../shared/pricing.json";

test("seller fee does not increase the buyer's total", () => {
  const total = 10 * 1200;
  const fee = feeAmountInr(10, 1200, 0.06);
  assert.equal(feeRateForRoute("voluntary"), pricing.deal_fee.standard_rate);
  assert.equal(total, 12000);
  assert.equal(fee, 720);
  assert.equal(total - fee, 11280);
  assert.equal(feeAmountInr(10, 1200, 0.05), 600);
});

test("voluntary and authorised fees are earned only after delivery", () => {
  for (const route of ["voluntary", "authorised"]) {
    assert.equal(feeStatusForOrder(route, "Order placed", ["Order placed"]), "pending");
    assert.equal(feeStatusForOrder(route, "Credits delivered", ["Order placed", "Credits delivered"]), "earned");
    assert.equal(feeStatusForOrder(route, "Certificate ready", ["Credits delivered", "Certificate ready"]), "earned");
    assert.equal(feeStatusForOrder(route, "Cancelled", ["Order placed"]), "cancelled");
    assert.equal(feeStatusForOrder(route, "Refunded", ["Order placed"]), "cancelled");
    assert.equal(feeStatusForOrder(route, "Refunded", ["Credits delivered"]), "earned");
  }
});

test("India offset and compliance never carry a ZeroCarbon fee", () => {
  for (const route of ["india_offset", "india_compliance"]) {
    assert.equal(feeRateForRoute(route), 0);
    assert.equal(feeAmountInr(10, 1200, feeRateForRoute(route)), 0);
    assert.equal(feeStatusForOrder(route, "Credits delivered", ["Credits delivered"]), "none");
    assert.equal(feeStatusForOrder(route, "Cancelled", ["Order placed"]), "none");
  }
});
