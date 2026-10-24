import { createHash } from "node:crypto";
import Ajv from "ajv";
import scanResultSchema from "../../../../shared/contracts/ScanResult.json";
import { event } from "./events";
import { logger } from "./logger";

const ajv = new Ajv({ allErrors: true, strict: false });
const cache = new Map<string, { until: number; value: AgentOutput; confidence: number | string | null }>();
const agentNames = [
  "NEED_INTERPRETER", "LISTING_MATCHER", "CLAIM_CHECKER", "CERTIFICATE_WRITER",
  "ORDER_CONCIERGE", "LAND_SCOUT", "ASK_ZEROCARBON", "COMPLIANCE_GUARD",
] as const;
type AgentName = typeof agentNames[number];
type AgentOutput = Record<string, unknown> & { demo: true };
type AgentStatus = "completed" | "failed" | "hitl_triggered" | "budget_exceeded";
type Confidence = number | string | null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const has = (value: Record<string, unknown>, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const isString = (value: unknown): value is string => typeof value === "string";
const isStringList = (value: unknown) => Array.isArray(value) && value.every(isString);
const isTextOrTextList = (value: unknown) => isString(value) || isStringList(value);

const outputIsValid: Record<AgentName, (value: Record<string, unknown>) => boolean> = {
  NEED_INTERPRETER: value =>
    isRecord(value.filters) && isString(value.understood) &&
    has(value, "unclear"),
  LISTING_MATCHER: value =>
    Array.isArray(value.results) &&
    value.results.every(item => isRecord(item) && Number.isInteger(item.listing_id) &&
      typeof item.rank === "number" && Number.isFinite(item.rank) && isString(item.why)) &&
    has(value, "relaxed"),
  CLAIM_CHECKER: value => isString(value.allowed_wording) && isStringList(value.flagged),
  CERTIFICATE_WRITER: value =>
    isString(value.headline) && isString(value.body) &&
    value.footer === "Demo data. Not a real retirement.",
  ORDER_CONCIERGE: value =>
    isString(value.reply) && typeof value.escalate === "boolean" && has(value, "problem_type"),
  LAND_SCOUT: value =>
    isString(value.headline) && isTextOrTextList(value.why) &&
    (isTextOrTextList(value.what_to_plant) || value.what_to_plant === null) &&
    (isString(value.credits_line) || value.credits_line === null) &&
    (isString(value.money_line) || value.money_line === null) &&
    isString(value.next_step) &&
    (isTextOrTextList(value.cannot_see) || value.cannot_see === null),
  ASK_ZEROCARBON: value =>
    isString(value.answer) && isString(value.see_screen) && typeof value.refused === "boolean",
  COMPLIANCE_GUARD: value =>
    typeof value.pass === "boolean" && isString(value.fixed_text) && has(value, "issues"),
};

export class IntegrationUnavailable extends Error {}

function parseOutput(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    const json = value.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
    value = JSON.parse(json);
  }
  if (!isRecord(value)) throw new IntegrationUnavailable("AgenticOrg output was not a JSON object.");
  return value;
}

export async function validateContract(name: string, value: unknown) {
  // Bundle the actual shared schema: production does not run from the artifact's cwd.
  if (name !== "ScanResult") throw new IntegrationUnavailable("Unknown shared service contract.");
  const schema = scanResultSchema;
  let validate = ajv.getSchema(name);
  if (!validate) { ajv.addSchema(schema, name); validate = ajv.getSchema(name); }
  if (!validate?.(value)) throw new IntegrationUnavailable("Service response did not match its shared contract.");
  return value as Record<string, unknown>;
}

function validAgentName(value: string): value is AgentName {
  return (agentNames as readonly string[]).includes(value);
}

function validConfidence(value: unknown): value is Confidence {
  return value === null || typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value));
}

function isAgentStatus(value: unknown): value is AgentStatus {
  return value === "completed" || value === "failed" ||
    value === "hitl_triggered" || value === "budget_exceeded";
}

// AgenticOrg's email-confirmed API contract; UUIDs are supplied through configuration.
export const agenticorg = {
  async run(agentName: AgentName, input: Record<string, unknown>, orgId: string | null = null) {
    const started = Date.now();
    let status = "unconfigured";
    let confidence: Confidence = null;
    let outcome = "fallback";
    let httpStatus: number | undefined;
    try {
      if (!validAgentName(agentName)) {
        status = "invalid_agent";
        throw new IntegrationUnavailable("Unknown AgenticOrg agent.");
      }
      const base = process.env.AGENTICORG_BASE_URL;
      const key = process.env.AGENTICORG_API_KEY;
      const id = process.env[`AGENT_ID_${agentName}`];
      if (!base || !key || !id) throw new IntegrationUnavailable("AgenticOrg is not connected.");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        status = "invalid_agent_id";
        throw new IntegrationUnavailable("AgenticOrg requires a configured agent UUID.");
      }
      const cacheKey = createHash("sha256").update(JSON.stringify([orgId, agentName, input])).digest("hex");
      const cached = cache.get(cacheKey);
      if (cached && cached.until > Date.now()) {
        status = "completed";
        outcome = "cached";
        confidence = cached.confidence;
        return cached.value;
      }
      const url = new URL(`/api/v1/agents/${encodeURIComponent(id)}/run`, base);
      if (url.protocol !== "https:" && url.hostname !== "localhost") throw new IntegrationUnavailable("AgenticOrg must use HTTPS.");
      const body = { action: "process", inputs: input, context: {} };
      const response = await fetch(url, {
        method: "POST", headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body), signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) {
        status = "http_error";
        httpStatus = response.status;
        throw new IntegrationUnavailable("AgenticOrg request failed.");
      }
      let envelope: unknown;
      try {
        envelope = await response.json();
      } catch {
        status = "invalid_response";
        throw new IntegrationUnavailable("AgenticOrg returned invalid JSON.");
      }
      if (!isRecord(envelope) || !isAgentStatus(envelope.status) ||
          !has(envelope, "confidence") || !validConfidence(envelope.confidence) ||
          !has(envelope, "output")) {
        status = "invalid_response";
        throw new IntegrationUnavailable("AgenticOrg response did not match its confirmed envelope.");
      }
      status = envelope.status;
      confidence = envelope.confidence;
      if (status !== "completed") {
        throw new IntegrationUnavailable(`AgenticOrg agent status: ${status}.`);
      }
      let output: Record<string, unknown>;
      try {
        output = parseOutput(envelope.output);
      } catch {
        status = "invalid_output";
        throw new IntegrationUnavailable("AgenticOrg output was not valid JSON.");
      }
      if (output.demo !== true || !outputIsValid[agentName](output)) {
        status = "invalid_output";
        throw new IntegrationUnavailable("AgenticOrg output failed its required field checks.");
      }
      const validated = output as AgentOutput;
      if (cache.size > 500) cache.clear();
      cache.set(cacheKey, { until: Date.now() + 600000, value: validated, confidence });
      outcome = "success";
      return validated;
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") status = "timeout";
      else if (!(error instanceof IntegrationUnavailable) && status === "unconfigured") status = "failed";
      throw error;
    } finally {
      await event("agent_call", orgId, {
        agent: agentName, status, confidence, duration_ms: Date.now() - started, outcome,
        ...(httpStatus === undefined ? {} : { http_status: httpStatus }),
      }).catch((err) => logger.error({ err }, "Could not record agent audit"));
    }
  },
};

export const forbidden = /\b(?:invest(?:ing|ment|ments)?|returns?|yields?|profits?|guaranteed)\b|carbon[\s-]+neutral|net[\s-]+zero|you are zero carbon/gi;
export function blockedPhrases(text: string) { return [...new Set(text.match(forbidden) ?? [])]; }
const blockedText = "This text could not be checked. Please use factual credit details and avoid unsupported claims.";

export function guardLocally(text: string) {
  return blockedPhrases(text).length ? blockedText : text;
}

export async function guard(text: string, screen: string, role: string, orgId: string | null = null) {
  try {
    const result = await agenticorg.run("COMPLIANCE_GUARD", { text, screen, role }, orgId);
    if (typeof result.fixed_text !== "string") return blockedText;
    // Apply local safety even when upstream incorrectly marks its output as safe.
    return blockedPhrases(result.fixed_text).length ? blockedText : result.fixed_text;
  } catch { return blockedPhrases(text).length ? blockedText : text; }
}

export function integrationStatus() {
  const agent = !process.env.AGENTICORG_BASE_URL
    ? "not configured"
    : !process.env.AGENTICORG_API_KEY
      ? "configured; API key missing, agent calls use fallbacks"
      : "connected";
  const model = !!(process.env.MODELS_API_URL && process.env.MODELS_API_KEY);
  return `AgenticOrg: ${agent}. Land models: ${model ? "configured; ScanResult checked against shared schema" : "not connected"}. Payments: demo only.`;
}
