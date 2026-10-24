// Translate the interpreter's filter names to the marketplace's query contract.
export function normalizeNeedFilters(input: Record<string, unknown>) {
  const scalar = (value: unknown) => Array.isArray(value) ? value[0] : value;
  const fields: Record<string, unknown> = {};
  for (const key of ["market", "action", "status", "region", "search"]) {
    const value = scalar(input[key]);
    if (typeof value === "string" && value.trim()) fields[key] = value.trim();
  }
  fields.vintage_from = scalar(input.vintage_from ?? input.vintage_min);
  fields.max_price = scalar(input.max_price ?? input.max_price_inr);
  // Listings store Indian states as region; India means no state restriction.
  if (typeof fields.region === "string" && /^(india|in)$/i.test(fields.region)) delete fields.region;
  return fields;
}
