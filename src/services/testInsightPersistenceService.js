const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
require('dotenv').config();

const Event = require('../models/eventModel');
const Insight = require('../models/insightModel');
const saveInsight = require('./insightPersistenceService');

const run = async () => {
  assert.ok(process.env.MONGO_URI, 'MONGO_URI must be configured');
  const databaseName = `ip_${randomUUID().replaceAll('-', '')}`;
  let connected = false;
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: databaseName,
      serverSelectionTimeoutMS: 5000,
    });
    connected = true;
    console.log(`[persistence-test] Temporary database: ${databaseName}`);
    await Promise.all([Event.init(), Insight.init()]);
    const indexes = await Insight.collection.indexes();
    assert.ok(indexes.some((index) => index.unique && index.key.event === 1));

    const events = await Event.insertMany(
      ['first', 'concurrent', 'invalid'].map((name) => ({
        eventType: 'Server Crash',
        source: `persistence-test-${name}`,
        message: 'Synthetic database timeout',
        severity: 'Critical',
      }))
    );
    const before = await Event.find().sort({ _id: 1 }).lean();
    const input = {
      summary: 'Synthetic service stopped after a timeout.',
      recommendedActions: ['Inspect database connectivity.'],
      model: 'synthetic-test-model',
    };
    const first = await saveInsight(events[0]._id, input);
    const stored = await Insight.findById(first._id).lean();
    assert.equal(stored.event.toString(), events[0]._id.toString());
    for (const field of ['summary', 'recommendedActions', 'model']) {
      assert.deepEqual(stored[field], input[field]);
    }
    assert.ok(stored.createdAt instanceof Date && stored.updatedAt instanceof Date);
    console.log('[persistence-test] PASS: insight fields and event reference persisted');

    const repeated = await saveInsight(events[0]._id, { ...input, summary: 'Must not overwrite' });
    assert.equal(repeated._id.toString(), first._id.toString());
    assert.deepEqual(await Insight.findById(first._id).lean(), stored);
    console.log('[persistence-test] PASS: repeated save preserves original fields and timestamps');

    const contenders = Array.from({ length: 5 }, (_, i) => ({
      ...input,
      summary: `Candidate ${i}`,
    }));
    const results = await Promise.all(contenders.map((value) => saveInsight(events[1]._id, value)));
    const winner = await Insight.findOne({ event: events[1]._id }).lean();
    assert.equal(await Insight.countDocuments({ event: events[1]._id }), 1);
    for (const result of results) {
      assert.equal(result._id.toString(), winner._id.toString());
      assert.equal(result.summary, winner.summary);
    }
    assert.ok(contenders.some((value) => value.summary === winner.summary));
    console.log('[persistence-test] PASS: concurrent saves return one stored winner');

    await assert.rejects(saveInsight(new mongoose.Types.ObjectId(), input), /event does not exist/);
    await assert.rejects(saveInsight(undefined, input), /event ID is required/);
    await assert.rejects(saveInsight(events[2]._id, { ...input, summary: '' }), {
      name: 'ValidationError',
    });
    assert.equal(await Insight.countDocuments(), 2);
    assert.deepEqual(await Event.find().sort({ _id: 1 }).lean(), before);
    console.log('[persistence-test] PASS: invalid saves create nothing; source events unchanged');
  } finally {
    try {
      if (connected) {
        await mongoose.connection.dropDatabase();
        console.log(`[persistence-test] Cleaned temporary database: ${databaseName}`);
      }
    } finally {
      await mongoose.disconnect();
    }
  }
  console.log('[persistence-test] PASS: all checks completed');
};

run().catch((error) => {
  console.error(`[persistence-test] FAIL (${error.name}); checks or cleanup did not complete`);
  if (typeof error.code === 'number') {
    console.error(`[persistence-test] MongoDB error code: ${error.code}`);
  }
  for (const [pattern, hint] of [
    [
      /not authorized|unauthorized|permission/i,
      'Database user lacks permission for the temporary database.',
    ],
    [/quota|limit|too many/i, 'MongoDB reported a resource or database limit.'],
    [/empty|invalid.*name|name.*invalid/i, 'MongoDB rejected the database name.'],
  ]) {
    if (pattern.test(error.message)) {
      console.error(`[persistence-test] ${hint}`);
    }
  }
  if (error.code === 'ERR_ASSERTION') {
    console.error(error.message);
  }
  process.exitCode = 1;
});
