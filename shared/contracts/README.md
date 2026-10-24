# Service contracts — required before live service calls

The uploaded setup refers to `00-shared/contracts.md` and JSON schemas from
`zerocarbon-models/contracts/*.json`; neither was supplied.
No provider response is fabricated in their absence.

Copy the original shared contracts here before connecting AgenticOrg or models.
The server validates service output with JSON Schema and fails explicitly when
the contract or connection is absent.

Agent output schema names expected by the adapter:
`NeedInterpretation.json`, `ListingMatches.json`, `ClaimCheck.json`,
`CertificateText.json`, `ConciergeAnswer.json`, `LandScout.json`,
`AskAnswer.json`, `GuardResult.json`. Models: `ScanResult.json`.
If upstream filenames differ, update the mapping in the adapter to the supplied
names, rather than rewriting or inventing the actual upstream schemas.

Once the actual AgenticOrg instance's `/docs` has been inspected, add
`agenticorg-transport.json` with `docs_confirmed: true`, `input_field`
(the documented body wrapper key, or empty string for a direct input body) and
`response_field` (documented dotted JSON path, or empty string for direct JSON).
Keep all transport knowledge in the server helper. Do not mark it confirmed
until the actual instance docs have been checked.

Required configuration (server-only):
AGENTICORG_BASE_URL, AGENTICORG_API_KEY, AGENT_ID_NEED_INTERPRETER,
AGENT_ID_LISTING_MATCHER, AGENT_ID_CLAIM_CHECKER,
AGENT_ID_CERTIFICATE_WRITER, AGENT_ID_ORDER_CONCIERGE,
AGENT_ID_LAND_SCOUT, AGENT_ID_ASK_ZEROCARBON,
AGENT_ID_COMPLIANCE_GUARD, MODELS_API_URL, MODELS_API_KEY,
INTERNAL_KEY, ADMIN_PIN, SESSION_SECRET.

With missing services, filters and demo buying remain usable. Scan and chat
show explicit unavailability; the claim/certificate fixed templates are
deliberately labelled demo. ADMIN_PIN and INTERNAL_KEY fail closed if absent.
