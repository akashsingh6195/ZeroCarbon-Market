import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import Ajv from "ajv";
import { event } from "./events";
import { logger } from "./logger";

const contractsDir = path.resolve(process.cwd(), "../../shared/contracts");
const ajv = new Ajv({ allErrors: true, strict: false });
const cache = new Map<string, { until: number; value: Record<string, unknown> }>();
const contractNames: Record<string, string> = {
  NEED_INTERPRETER: "NeedInterpretation", LISTING_MATCHER: "ListingMatches",
  CLAIM_CHECKER: "ClaimCheck", CERTIFICATE_WRITER: "CertificateText",
  ORDER_CONCIERGE: "ConciergeAnswer", LAND_SCOUT: "LandScout",
  ASK_ZEROCARBON: "AskAnswer", COMPLIANCE_GUARD: "GuardResult",
};

export class IntegrationUnavailable extends Error {}

async function loadJson(file: string) {
  try { return JSON.parse(await readFile(path.join(contractsDir, file), "utf8")); }
  catch { throw new IntegrationUnavailable("Shared service contracts have not been supplied."); }
}

// Transport details are loaded ONLY from an explicitly docs-confirmed configuration.
// No request body or response envelope is guessed from an undocumented provider.
async function transport() {
  const config = await loadJson("agenticorg-transport.json");
  if (config.docs_confirmed !== true || typeof config.input_field !== "string" ||
      typeof config.response_field !== "string" || !["", "input", "data", "payload"].includes(config.input_field)) {
    throw new IntegrationUnavailable("AgenticOrg /docs transport confirmation is required.");
  }
  return config as { input_field: string; response_field: string; docs_confirmed: boolean };
}

export async function validateContract(name: string, value: unknown) {
  const schema = await loadJson(`${name}.json`);
  let validate = ajv.getSchema(name);
  if (!validate) { ajv.addSchema(schema, name); validate = ajv.getSchema(name); }
  if (!validate?.(value)) throw new IntegrationUnavailable("Service response did not match its shared contract.");
  return value as Record<string, unknown>;
}

// All provider-specific behavior lives here. Every attempt, including cache hits, is audited.
export const agenticorg = {
  async run(agentName: string, input: Record<string, unknown>, orgId: string | null = null, timeoutMs = 12000) {
    const started = Date.now();
    let result = "failed", failure = "unavailable";
    try {
      const base = process.env.AGENTICORG_BASE_URL;
      const key = process.env.AGENTICORG_API_KEY;
      const id = process.env[`AGENT_ID_${agentName}`];
      if (!base || !key || !id) throw new IntegrationUnavailable("AgenticOrg is not connected.");
      const config = await transport();
      const name = contractNames[agentName];
      if (!name) throw new IntegrationUnavailable("Unknown agent contract.");
      // Load/compile before sending anything to an external service.
      await loadJson(`${name}.json`);
      const cacheKey = createHash("sha256").update(JSON.stringify([orgId, agentName, input])).digest("hex");
      const cached = cache.get(cacheKey);
      if (cached && cached.until > Date.now()) { result = "cached"; return cached.value; }
      const url = new URL(`/api/v1/agents/${encodeURIComponent(id)}/run`, base);
      if (url.protocol !== "https:" && url.hostname !== "localhost") throw new IntegrationUnavailable("AgenticOrg must use HTTPS.");
      const body = config.input_field ? { [config.input_field]: input } : input;
      const response = await fetch(url, {
        method: "POST", headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        failure = `http_${response.status}`;
        throw new IntegrationUnavailable("AgenticOrg request failed.");
      }
      const raw: unknown = await response.json();
      let value: unknown = raw;
      if (config.response_field) for (const key of config.response_field.split(".")) {
        value = value !== null && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined;
      }
      if (typeof value === "string") value = JSON.parse(value);
      const validated = await validateContract(name, value);
      if (cache.size > 500) cache.clear();
      cache.set(cacheKey, { until: Date.now() + 600000, value: validated });
      result = "success";
      return validated;
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") failure = "timeout";
      else if (error instanceof IntegrationUnavailable) failure = error.message;
      throw error;
    } finally {
      await event("agent_call", orgId, {
        agent: agentName, duration_ms: Date.now() - started, result,
        ...(result === "failed" ? { failure } : {}),
      }).catch((err) => logger.error({ err }, "Could not record agent audit"));
    }
  },
};

export const forbidden = /\b(?:invest(?:ing|ment|ments)?|returns?|yields?|profits?|guaranteed)\b|carbon[\s-]+neutral|net[\s-]+zero|you are zero carbon/gi;
export function blockedPhrases(text: string) { return [...new Set(text.match(forbidden) ?? [])]; }
const blockedText = "This text could not be checked. Please use factual credit details and avoid unsupported claims.";

export async function guard(text: string, screen: string, role: string, orgId: string | null = null) {
  try {
    const result = await agenticorg.run("COMPLIANCE_GUARD", { text, screen, role }, orgId, 8000);
    if (typeof result.fixed_text !== "string") return blockedText;
    // Apply local safety even when upstream incorrectly marks its output as safe.
    return blockedPhrases(result.fixed_text).length ? blockedText : result.fixed_text;
  } catch { return blockedPhrases(text).length ? blockedText : text; }
}

export function integrationStatus() {
  const agent = !!(process.env.AGENTICORG_BASE_URL && process.env.AGENTICORG_API_KEY);
  const model = !!(process.env.MODELS_API_URL && process.env.MODELS_API_KEY);
  return `AgenticOrg: ${agent ? "configured; shared contracts and /docs confirmation required" : "not connected"}. Land models: ${model ? "configured; shared ScanResult contract required" : "not connected"}. Payments: demo only.`;
}
