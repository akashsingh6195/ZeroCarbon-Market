---
name: Assistant latency constraints
description: Why Scan and need results use local text safety and independent deterministic fallbacks.
---

Scan and marketplace need responses use the local claim-safety check rather than sending every result field or listing explanation through another remote agent. Other workflows can retain their remote compliance checks.

**Why:** AgenticOrg has a shared hackathon rate limit. Per-field remote checks multiply both latency and requests, so a two-agent need interaction can otherwise take much longer than the browser timeout even when both core agents succeed.

**How to apply:** Keep external calls bounded per interaction. A ranking or explanatory agent failure must not discard a successful interpreter or validated model result. Preserve the local forbidden-claim check when changing response construction.
