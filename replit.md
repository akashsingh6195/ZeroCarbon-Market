# ZeroCarbon Market

A mobile-first demonstration marketplace for Indian carbon credits, land scans and factual purchase certificates.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/zerocarbon-market` — React/TypeScript/Tailwind web app, root preview.
- `artifacts/api-server` — Express API, session cookies, service adapters and demo order progression.
- `lib/db/src/schema` — PostgreSQL schema with fictional listings, organisations, demo sessions, orders and events.
- `lib/api-spec/openapi.yaml` — public application API contract; regenerate clients after changes.
- `shared/contracts/README.md` — missing upstream contracts and connection prerequisites.
- `.local/conversation-workspace/files/attached_assets` — the 18 original uploaded requirements.

## Architecture decisions

- The agreed first build is files 01–09. Files 10–16 are explicitly after the hackathon. File 17 requires separate organiser approval; no real money in the current build.
- The provided requirements explicitly request a passwordless, unverified demo signup with a signed cookie. It is not phone authentication and must not be represented as a verified identity.
- Upstream shared contracts and AgenticOrg instance docs were not attached. Fail closed on undocumented service transport/schema; do not guess wrappers or substitute fabricated AI/model results.
- Use fixed, clearly marked factual demo claim/certificate templates when the assistants are unavailable. Manual listing filters and demo buying stay operational.
- Demo order progress is a server-time simulation, not an exchange or registry integration.

## Product

Demo listing browsing, role restrictions, filters and compare; demo onboarding; claim review, mock checkout, parcel-style order progress and public demo certificates; Karnataka map-based scan entry; Ask; live event counters and PIN-protected admin listing visibility.

## User preferences

- Use Forest #1E5B3A, Leaf #6FAE4F, Marigold #E9A23B, Registry Blue #2F4B7C, Soil #7A5A3A, Paper #F7F5EE, Ink #1D2421.
- Phone-first 375px; shared Demo data chip everywhere credits, prices or certificates are shown.
- Plain language. Never market purchases using invest, returns, yield, profit or guaranteed. Never claim the buyer is zero carbon, carbon neutral or net zero.
- Traders only see voluntary credits, including direct API/detail access. Obligated buyers only see India compliance listings and the Comply coming-soon route.
- No PAN, GST, Aadhaar or bank details in the demo.

## Gotchas

- `ADMIN_PIN` and `INTERNAL_KEY` are absent initially and fail closed, never use default credentials.
- AgenticOrg and land models are not connected initially. See `shared/contracts/README.md` before enabling them.
- Do not put external API keys in browser code. All service calls go through Express.
- The scan's local coverage outline is approximate; a connected models service must confirm state coverage and actual land classification.
- Startup seeds an empty demo catalogue only; never auto-runs schema DDL. Use the development DB push command for schema changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
