# Project Session Context

Last updated: 2026-09-16

Read this file after `AGENTS.md` when continuing work in a future conversation. Treat it as a handoff, then verify the repository because code and decisions may have changed since it was written. Do not place secrets in this file.

## Working agreement

- The user owns architecture and final technical decisions.
- Inspect the repository before changing code.
- Implement one small, reviewable boundary at a time.
- After each boundary, provide exact testing instructions and stop for review.
- Do not continue to the next objective until the user approves it.
- Preserve existing work and avoid unrelated refactors.

## Current architecture

- CommonJS Node.js/Express API in `index.js`.
- MongoDB/Mongoose models for users, events, and insights.
- JWT registration/login and protected event creation.
- Event ingestion flow: `POST /api/v1/events` -> auth middleware -> BullMQ `events` queue -> background worker -> MongoDB.
- Event retrieval flow: `GET /api/v1/events` -> controller filters/paginates -> MongoDB.
- Insight selection flow: in-process cron -> `insightService` -> unsummarized High/Critical events.
- Redis connection and BullMQ queue live under `src/config`; the worker starts from `worker.js`.

## Implemented and reviewed boundaries

### 1. Insight eligibility selection

- `src/services/insightService.js` selects events whose severity is High or Critical and whose `isSummarized` value is false.
- It returns matching events without calling AI or changing database state.
- `src/services/testInsightService.js` tests the selection against an isolated database.
- Known test issue: its temporary database name still uses the long `insight_eligibility_test_...` prefix, which can exceed deployments limited to 38-byte database names. Shorten it before rerunning on such a deployment.

### 2. OpenRouter request boundary

- `src/services/aiService.js` accepts one event and sends only `eventType`, `source`, `message`, and `severity` to OpenRouter.
- Required environment variables: `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`.
- No SDK dependency was added; it uses Node's built-in `fetch`.
- It uses a 120-second timeout and does not retry.
- The configured and live-tested model was `dots-studio/dots-3-note-preview:free`.
- Its OpenRouter endpoint advertised both `response_format` and `structured_outputs` on 2026-09-16.

### 3. Structured insight output

- `src/services/insightResponse.js` defines a strict JSON schema with:
  - non-empty `summary`
  - `recommendedActions` as an array of non-empty strings; an empty array is allowed
- The request sets `provider.require_parameters: true` so OpenRouter only routes to a compatible endpoint.
- Local validation rejects malformed JSON, missing or extra fields, blank values, refusals, incomplete completions, and missing model metadata.
- Successful output is normalized to `{ summary, recommendedActions, model }`, with `model` taken from provider response metadata.
- Unit tests: `src/services/aiService.test.js` and `src/services/insightResponse.test.js`.
- Live test: `node src/services/testAiService.js`. It passed with the configured model.

### 4. Insight persistence

- Product decision: ordinary repeated processing preserves the first insight and returns it. Internal retries must not silently change the user's result.
- Explicit regeneration and history/versioning are deferred future decisions.
- `src/services/insightPersistenceService.js` accepts an existing event ID and a validated insight.
- It returns an existing insight if one exists, otherwise verifies the source event and inserts an `Insight`.
- Concurrent insert races rely on the unique `Insight.event` index; the loser reads and returns the stored winner.
- It does not call OpenRouter and does not change `Event.isSummarized`.
- Unit test: `src/services/insightPersistenceService.test.js`.
- MongoDB integration test: `src/services/testInsightPersistenceService.js`.
- The integration test originally failed with Atlas error code 8000 because its generated database name exceeded the deployment's 38-byte limit. The user changed it to `ip_<UUID>`, reran it, and reported that all tests passed.

## Verified environment facts

- `MONGO_URI` uses a `mongodb+srv:` URI and includes a database name.
- A read-only connection, admin ping, and collection listing succeeded outside the command sandbox.
- Earlier `ECONNREFUSED` results were caused by sandbox network restrictions, not an unavailable database.
- Never record or print the actual MongoDB URI, OpenRouter key, JWT secret, Redis credentials, or other secret values.

## Decisions still pending

The next boundary is changing the source event's `isSummarized` flag after its insight has been saved. Before implementing it, the user must choose the consistency and recovery behavior for a partial failure where insight persistence succeeds but the event update fails.

Relevant options to present with tradeoffs:

1. Two separate writes with recovery: save/return the insight, then set `isSummarized: true`; a later retry detects the existing insight and retries the event update. Simple and eventually consistent, with a temporary mismatch possible.
2. MongoDB transaction: persist the insight and update the event atomically. Strong consistency, but requires transaction-capable deployment/session handling and adds complexity.
3. Treat insight existence as the processing source of truth and eventually remove or derive `isSummarized`. This changes the data model/query strategy and is a broader architecture decision.

Do not choose among these without the user. Once chosen, implement only that state-update boundary and its focused verification; do not integrate the scheduler yet.

## Important unresolved observations

- `authMiddleware.protect` can call `next()` when a valid token references a user that no longer exists; event creation then accesses `req.user._id`.
- The BullMQ worker is constructed before `worker.js` completes its MongoDB connection.
- Insight selection is unbounded and the scheduler runs in every API instance, so multi-instance overlap, batching, cost, and duplicate AI calls require later architecture decisions.
- Returning an existing persisted insight prevents overwrites but does not prevent duplicate AI calls before persistence.
- Event ingestion has no explicit deduplication guarantee if a job runs again after persistence.
- README architecture/status is behind the current implementation.
- These issues were observed but intentionally not fixed as part of the AI insight boundaries.

## Working tree warning

The working tree contains multiple modified and untracked files from ongoing project work. Preserve them. Do not reset, discard, or rewrite unrelated changes. Check `git status --short` before each implementation.

