---
name: Models-service contracts
description: Keep the app contract stable when hosted model responses differ from UI wording.
---

Verify a real hosted models-service response before assuming its field names from requested display labels. Normalize external differences at the server boundary, and keep optional model additions from breaking an otherwise successful result.

**Why:** The routes service answered successfully but its timing field differed from the name inferred from the requested “First money in” label. An overly strict assumption silently omitted useful route choices.

**How to apply:** For new model endpoints, inspect a safe sample response, validate it, and normalize it into the app's API contract. On unavailable optional services, preserve stored scores or the validated scan card.
