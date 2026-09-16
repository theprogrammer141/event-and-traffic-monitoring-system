const assert = require('node:assert/strict');
const { test } = require('node:test');
const Event = require('../models/eventModel');
const Insight = require('../models/insightModel');
const saveInsight = require('./insightPersistenceService');

test('preserves existing insights and recovers only event duplicate-key races', async (t) => {
  const saved = { event: 'event-id', summary: 'Original' };
  const find = t.mock.method(Insight, 'findOne', async () => saved);
  const exists = t.mock.method(Event, 'exists', async () => ({ _id: 'event-id' }));
  const create = t.mock.method(Insight, 'create', async () => saved);
  assert.equal(await saveInsight('event-id', { summary: 'Replacement' }), saved);
  assert.equal(create.mock.callCount(), 0);
  assert.equal(exists.mock.callCount(), 0);

  let reads = 0;
  find.mock.mockImplementation(async () => (++reads === 1 ? null : saved));
  create.mock.mockImplementation(async () => {
    throw Object.assign(new Error('Duplicate'), { code: 11000, keyPattern: { event: 1 } });
  });
  assert.equal(await saveInsight('event-id', { summary: 'Replacement' }), saved);
  assert.equal(reads, 2);

  find.mock.mockImplementation(async () => null);
  const failure = new Error('Database unavailable');
  create.mock.mockImplementation(async () => {
    throw failure;
  });
  await assert.rejects(saveInsight('event-id', {}), (error) => error === failure);
  const unrelated = Object.assign(new Error('Other duplicate'), {
    code: 11000,
    keyPattern: { _id: 1 },
  });
  create.mock.mockImplementation(async () => {
    throw unrelated;
  });
  await assert.rejects(saveInsight('event-id', {}), (error) => error === unrelated);

  exists.mock.mockImplementation(async () => null);
  const attempts = create.mock.callCount();
  await assert.rejects(saveInsight('event-id', {}), /event does not exist/);
  await assert.rejects(saveInsight(null, {}), /event ID is required/);
  assert.equal(create.mock.callCount(), attempts);
});
