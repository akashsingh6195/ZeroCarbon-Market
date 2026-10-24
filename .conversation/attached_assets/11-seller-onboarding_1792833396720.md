After the hackathon. Build seller onboarding after ZeroCarbon Scan.

1. "Upload your land record": a photo or PDF of a 7/12 (Maharashtra) or RTC (Karnataka). Route POST /api/records sends it to AGENT_ID_RECORDS_READER. Show the fields it read for the seller to confirm or correct. Delete the uploaded file right after reading; keep only the confirmed fields.
2. Gap form: POST /api/gap-questions calls AGENT_ID_GAP_FORM_GUIDE with the scan, the record and the answers so far. Show the questions it returns (yes/no, choice, number, text) one screen at a time.
3. Route chooser: POST /api/routes calls AGENT_ID_ROUTE_ADVISOR. Show the routes side by side, with the recommended one highlighted and its two reasons.
4. "Draft my agreement" calls AGENT_ID_AGREEMENT_DRAFTER and puts the draft in the approvals queue. The seller sees "A person will check this draft before you see it."

Store everything in a seller_projects table linked to the organisation. Add the four agent IDs to Secrets first.
