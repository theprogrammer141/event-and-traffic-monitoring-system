const assert = require('node:assert/strict');
require('dotenv').config();
const analyzeEvent = require('./aiService');

const run = async () => {
  const response = await analyzeEvent({
    eventType: 'Server Crash',
    source: 'synthetic-payment-service',
    message: 'Synthetic test: service stopped after a database connection timeout.',
    severity: 'Critical',
  });

  assert.ok(response.model, 'Response must include a model');
  assert.ok(typeof response.summary === 'string' && response.summary.trim());
  assert.ok(Array.isArray(response.recommendedActions));
  assert.ok(
    response.recommendedActions.every((action) => typeof action === 'string' && action.trim())
  );
  console.log('[ai-test] Model:', response.model);
  console.log('[ai-test] Validated insight:', JSON.stringify(response, null, 2));
  console.log('[ai-test] PASS: one synthetic event received a validated structured insight');
};

run().catch((error) => {
  console.error(`[ai-test] FAIL: ${error.message}`);
  process.exitCode = 1;
});
