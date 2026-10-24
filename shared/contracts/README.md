# Shared service contracts

## AgenticOrg

The AgenticOrg transport was confirmed by the hackathon organisers on 24 October
2026. Its request is:

```json
{
  "action": "process",
  "inputs": {},
  "context": {}
}
```

The server calls `POST /api/v1/agents/{AGENT_UUID}/run` with a Bearer
`AGENTICORG_API_KEY` and `Content-Type: application/json`. Responses contain
`status`, `confidence`, and `output`. Only `completed` output is considered;
other statuses, timeouts, HTTP errors, and invalid output use each feature's
existing fallback. String outputs may be JSON in Markdown code fences.

Each agent output must also include `demo: true` and these fields:

- Need Interpreter: `filters`, `understood`, `unclear`
- Listing Matcher: `results` (`listing_id`, `rank`, `why`), `relaxed`
- Claim Checker: `allowed_wording`, `flagged`
- Certificate Writer: `headline`, `body`, `footer`
- Order Concierge: `reply`, `escalate`, `problem_type`
- Land Scout: `headline`, `why`, `what_to_plant`, `credits_line`,
  `money_line`, `next_step`, `cannot_see`
- Ask ZeroCarbon: `answer`, `see_screen`, `refused`
- Compliance Guard: `pass`, `fixed_text`, `issues`

`AGENTICORG_BASE_URL` and the `AGENT_ID_*` UUIDs are ordinary shared
configurations. `AGENTICORG_API_KEY` is a secret; if absent, calls immediately
use local fallbacks. Calls have a 15-second limit, no retries, and identical
requests are cached for ten minutes.

## Land models

`ScanResult.json` is the required JSON Schema for the response from
`MODELS_API_URL/scan`. Keep validating the models response against that schema
before constructing a card or passing it to Land Scout.
