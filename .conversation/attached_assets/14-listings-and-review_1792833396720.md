After the hackathon. Let sellers and traders create listings, with review.

- A form: project name, region, market, action, status, vintage, registry, method, serial numbers (or delivery year if Future), price, quantity, a boundary drawn on a map, and document uploads. Traders can only choose market = voluntary.
- On submit: agenticorg.run(AGENT_ID_LISTING_REVIEWER, ...) and {MODELS_API_URL}/score. Show the fix list to the seller.
- When ready, the listing goes into the approvals queue on /admin. Only approved listings appear in Market.
- On each listing page, show the ZeroCarbon Score and, through AGENT_ID_INTEGRITY_WATCH, a plain explanation of each flag.

Add AGENT_ID_LISTING_REVIEWER and AGENT_ID_INTEGRITY_WATCH to Secrets first.
