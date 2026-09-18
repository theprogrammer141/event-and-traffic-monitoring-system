# Project Session Context

Last updated: 2026-09-18

Read this file after `AGENTS.md` when continuing work in a future conversation. Treat it as a handoff, then verify the repository because code, data, and decisions may have changed since it was written. Do not place secrets in this file.

## Working agreement

- The user owns architecture and final technical decisions.
- Inspect the repository before changing code.
- Implement one small, reviewable boundary at a time.
- After each boundary, provide exact testing instructions and stop for review.
- Do not continue to the next objective until the user approves it.
- Preserve existing work and avoid unrelated refactors.

## Product and domain decisions

- The product is an AI Web Intelligence Platform that receives meaningful operational occurrences from a connected website, displays them on a dashboard, and generates AI diagnoses and recommended actions.
- An `Event` represents an actionable incident or anomaly that merits AI help, not routine raw telemetry such as every successful request, page view, login, or signup.
- Every stored Event is eventually eligible for AI analysis, regardless of severity. Severity should later control urgency or processing priority, not permanent eligibility.
- The application deterministically selects eligible Events before invoking AI. The model analyzes an already-selected Event and never decides which raw telemetry should become an Event.
- An associated `Insight` is the single source of truth that an Event has been analyzed.
- `Event.isSummarized` was rejected as duplicated state and has been retired.
- Ordinary repeated processing preserves the first stored Insight. Explicit regeneration and Insight history/versioning remain deferred product decisions.

## Current architecture

- CommonJS Node.js/Express API in `index.js`.
- MongoDB/Mongoose models for users, events, and insights.
- JWT registration/login and protected event creation.
- Event ingestion flow: `POST /api/v1/events` -> auth middleware -> BullMQ `events` queue -> background worker -> MongoDB.
- Event retrieval flow: `GET /api/v1/events` -> controller filters/paginates -> MongoDB.
- Insight selection flow: in-process cron -> `insightService` -> MongoDB aggregation -> all Events without an associated Insight.
- The scheduler currently only selects and logs eligible Events. It does not call OpenRouter or persist Insights.
- Redis connection and BullMQ queue live under `src/config`; the event-ingestion worker starts from `worker.js`.

## Implemented boundaries

### 1. Insight eligibility selection

- `src/services/insightService.js` uses one MongoDB aggregation with `$lookup` from Events to Insights.
- It returns every Event with no associated Insight; severity and legacy `isSummarized` values do not affect eligibility.
- The temporary lookup data is projected out before results are returned.
- Aggregation results are plain JavaScript objects rather than hydrated Mongoose documents.
- The service does not call AI or change database state.
- `src/services/testInsightService.js` verifies every severity, both legacy Boolean values, Insight presence/absence, no-match behavior, empty-database behavior, and read-only selection.
- The eligibility test uses a short `ie_<UUID>` temporary database name and passed against the configured MongoDB deployment.

### 2. OpenRouter request boundary

- `src/services/aiService.js` accepts one Event and sends only `eventType`, `source`, `message`, and `severity` to OpenRouter.
- Required environment variables: `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`.
- No SDK dependency was added; it uses Node's built-in `fetch`.
- It uses a 120-second timeout and does not retry.
- The configured and live-tested model was `dots-studio/dots-3-note-preview:free` on 2026-09-16.
- Its OpenRouter endpoint advertised both `response_format` and `structured_outputs` on 2026-09-16.

### 3. Structured Insight output

- `src/services/insightResponse.js` defines a strict JSON schema with a non-empty `summary` and `recommendedActions` as an array of non-empty strings; an empty array is allowed.
- The request sets `provider.require_parameters: true` so OpenRouter only routes to a compatible endpoint.
- Local validation rejects malformed JSON, missing or extra fields, blank values, refusals, incomplete completions, and missing model metadata.
- Successful output is normalized to `{ summary, recommendedActions, model }`, with `model` taken from provider response metadata.
- Unit tests: `src/services/aiService.test.js` and `src/services/insightResponse.test.js`.
- Live test: `node src/services/testAiService.js`; it previously passed with the configured model.

### 4. Insight persistence

- `src/services/insightPersistenceService.js` accepts an existing Event ID and a validated Insight.
- It returns an existing Insight if one exists; otherwise it verifies the source Event and inserts an Insight.
- Concurrent insert races rely on the unique `Insight.event` index; the loser reads and returns the stored winner.
- It does not call OpenRouter or change the source Event.
- Unit test: `src/services/insightPersistenceService.test.js`.
- MongoDB integration test: `src/services/testInsightPersistenceService.js` using an `ip_<UUID>` temporary database; it passed.

### 5. `isSummarized` retirement and data migration

- `isSummarized` was removed from `src/models/eventModel.js`; new Event writes no longer store it.
- `src/migrations/removeIsSummarized.js` is a standalone, idempotent migration.
- `npm run migrate:remove-is-summarized` is read-only and reports how many Events still contain the legacy field.
- `npm run migrate:remove-is-summarized -- --apply` unsets only that field.
- `src/migrations/testRemoveIsSummarized.js` verifies schema removal, dry-run immutability, apply behavior, field-only changes, repeat safety, and cleanup in a `mi_<UUID>` database.
- The migration integration test passed against the configured MongoDB deployment.
- The application database migration was applied on 2026-09-18: dry run found 5 legacy Event documents, apply matched and modified all 5, and the final dry run found 0.
- The removed Boolean values were not retained. Rolling back to the old selector would require reconstructing them from Insight existence.

## Verification status

- Eligibility MongoDB integration test passed and cleaned its temporary database.
- Migration MongoDB integration test passed and cleaned its temporary database.
- AI, response-parser, and persistence unit tests passed: 3 tests, 0 failures.
- Prettier passed for all files in the current change.
- ESLint completed with 0 errors and 59 warnings, primarily the project's existing console-output warnings plus migration/test console output.
- The actual application database contains 0 Event documents with `isSummarized` after migration verification.
- `MONGO_URI` uses a `mongodb+srv:` URI and includes a database name. Never record or print the URI or any API key, JWT secret, Redis credential, or other secret.
- MongoDB commands need execution outside the command sandbox in this environment; earlier connection failures inside it were sandbox restrictions, not database availability.

## Next smallest logical objective

Compose one already-selected Event through the existing boundaries:

Event -> `analyzeEvent` -> validated structured result -> `saveInsight`

Keep this boundary independent of the cron scheduler, batching, BullMQ, and multi-instance coordination. Test it with controlled service doubles or one explicit invocation so failures remain isolated.

Before scheduler integration, the user must decide how to prevent or accept duplicate AI requests when concurrent processors select the same Event. The current unique `Insight.event` index prevents duplicate stored Insights but does not prevent duplicate OpenRouter calls or cost. Realistic later options include accepting this temporarily, adding an atomic processing claim/lease, or introducing a dedicated Insight queue with an event-based job identity.

## Important unresolved observations

- `authMiddleware.protect` can call `next()` when a valid token references a user that no longer exists; event creation then accesses `req.user._id`.
- The BullMQ event worker is constructed before `worker.js` completes its MongoDB connection.
- Insight selection is unbounded and unordered.
- The scheduler runs in every API instance, so multiple instances can overlap.
- No batching, AI rate limiting, cost control, processing claim, or Insight-worker concurrency policy exists yet.
- Returning an existing persisted Insight prevents overwrites but does not prevent duplicate AI calls before persistence.
- Event ingestion has no explicit deduplication guarantee if a job runs again after persistence.
- The Event enum still contains broad `Login` and `SignUp` values and does not contain examples such as `API Failure`; event classification must later be aligned with the decision that Events are meaningful/actionable occurrences.
- The upstream telemetry-to-actionable-Event detection or aggregation boundary has not been designed.
- README architecture/status is behind the current implementation and still references `isSummarized`.
- These issues were observed but intentionally not changed as part of the completed boundaries.

## Working tree warning

- The working tree contains modified and untracked files from the eligibility and migration work. Preserve them until the user reviews and commits them.
- `.gitignore` is also modified but was not changed as part of the eligibility or migration implementation; treat it as unrelated user work.
- Check `git status --short` before every implementation. Do not reset, discard, or rewrite unrelated changes.
