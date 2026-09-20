const assert = require('node:assert/strict');
const { test } = require('node:test');
const Insight = require('../models/insightModel');
const processEvent = require('./aiEventProcessing');

test('processEvent single-event pipeline', async (t) => {
  const sampleEvent = {
    _id: '507f1f77bcf86cd799439011',
    eventType: 'Server Crash',
    source: 'backend-api',
    message: 'Out of memory exception',
    severity: 'Critical',
  };

  const aiOutput = {
    summary: 'Node process ran out of heap memory.',
    recommendedActions: ['Increase heap limit', 'Inspect memory leak'],
  };

  // Test 1: Guard checks
  await assert.rejects(processEvent(null), /A valid event with an _id is required/);
  await assert.rejects(processEvent({}), /A valid event with an _id is required/);

  // Test 2: Idempotency (Insight already exists)
  const existingDoc = {
    _id: 'insight-123',
    event: sampleEvent._id,
    ...aiOutput,
    model: 'test-model',
  };
  const findOneMock = t.mock.method(Insight, 'findOne', async () => existingDoc);

  const resultExisting = await processEvent(sampleEvent);
  assert.deepEqual(resultExisting, existingDoc);

  // Test 3: Happy path (No insight exists -> analyzes and saves)
  findOneMock.mock.mockImplementation(async () => null);

  // Mock global fetch to simulate OpenRouter response
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({
      model: 'test-model',
      choices: [
        {
          finish_reason: 'stop',
          message: { content: JSON.stringify(aiOutput) },
        },
      ],
    }),
  }));

  // Ensure environment variables exist for analyzeEvent
  process.env.OPENROUTER_API_KEY = 'test-key';
  process.env.OPENROUTER_MODEL = 'test-model';

  const Event = require('../models/eventModel');
  t.mock.method(Event, 'exists', async () => ({ _id: sampleEvent._id }));
  t.mock.method(Insight, 'create', async (data) => ({ _id: 'new-insight-id', ...data }));

  const resultNew = await processEvent(sampleEvent);
  assert.equal(resultNew.summary, aiOutput.summary);
  assert.deepEqual(resultNew.recommendedActions, aiOutput.recommendedActions);
});
