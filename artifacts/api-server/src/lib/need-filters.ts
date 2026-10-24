// Translate the interpreter's filter names to the marketplace's query contract.
export function normalizeNeedFilters(input: Record<string, unknown>) {
  const scalar = (value: unknown) => Array.isArray(value) ? value[0] : value;
  const meaningful = (value: unknown) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed || trimmed.toLowerCase() === "null" || (Number.isFinite(Number(trimmed)) && Number(trimmed) === 0)) return undefined;
      return trimmed;
    }
    if (value === null || value === undefined || (typeof value === "number" && value === 0)) return undefined;
    return value;
  };
  const fields: Record<string, unknown> = {};
  for (const key of ["market", "action", "status", "region", "search"]) {
    const value = meaningful(scalar(input[key]));
    if (typeof value === "string") fields[key] = value;
  }
  const vintage = meaningful(scalar(input.vintage_from ?? input.vintage_min));
  const price = meaningful(scalar(input.max_price ?? input.max_price_inr));
  const quantity = meaningful(scalar(input.quantity_t ?? input.quantity ?? input.tonnes));
  if (vintage !== undefined) fields.vintage_from = vintage;
  if (price !== undefined) fields.max_price = price;
  if (quantity !== undefined) fields.quantity_t = quantity;
  // Listings store Indian states as region; India means no state restriction.
  if (typeof fields.region === "string" && /^(india|in)$/i.test(fields.region)) delete fields.region;
  return fields;
}
