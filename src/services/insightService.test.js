const assert = require('node:assert/strict');
const { test } = require('node:test');
const Event = require('../models/eventModel');
const Insight = require('../models/insightModel');
const processEventsForInsights = require('./insightService');

test('insightService batch processing', async (t) => {
  const sampleEvents = [
    {
      _id: 'event-1',
      eventType: 'Server Crash',
      source: 'api',
      severity: 'Critical',
      message: 'DB crash',
    },
    {
      _id: 'event-2',
      eventType: 'Traffic Spike',
      source: 'api',
      severity: 'High',
      message: 'High latency',
    },
    {
      _id: 'event-3',
      eventType: 'Server Crash',
      source: 'api',
      severity: 'Low',
      message: 'Minor warning',
    },
  ];

  // Test 1: Empty batch
  const aggregateMock = t.mock.method(Event, 'aggregate', async () => []);
  const emptyStats = await processEventsForInsights();
  assert.deepEqual(emptyStats, { total: 0, succeeded: 0, failed: 0 });

  // Test 2: Happy path (All 3 succeed)
  aggregateMock.mock.mockImplementation(async () => [...sampleEvents]);

  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({
      model: 'test-model',
      choices: [
        {
          finish_reason: 'stop',
          message: {
            content: JSON.stringify({ summary: 'Analysis ok', recommendedActions: ['Check logs'] }),
          },
        },
      ],
    }),
  }));

  t.mock.method(Insight, 'findOne', async () => null);
  const createMock = t.mock.method(Insight, 'create', async (data) => ({
    _id: 'ins-' + data.event,
    ...data,
  }));
  t.mock.method(Event, 'exists', async () => true);

  process.env.OPENROUTER_API_KEY = 'test-key';
  process.env.OPENROUTER_MODEL = 'test-model';

  const happyStats = await processEventsForInsights({ limit: 3 });
  assert.deepEqual(happyStats, { total: 3, succeeded: 3, failed: 0 });

  // Test 3: Partial failure isolation (1 fails, 2 succeed)
  let calls = 0;
  createMock.mock.mockImplementation(async (data) => {
    calls++;
    if (calls === 2) {
      throw new Error('Simulated DB write failure on item 2');
    }
    return { _id: 'ins-' + data.event, ...data };
  });

  const partialStats = await processEventsForInsights({ limit: 3 });
  assert.equal(partialStats.total, 3);
  assert.equal(partialStats.succeeded, 2);
  assert.equal(partialStats.failed, 1);
});
