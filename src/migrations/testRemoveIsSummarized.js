const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const mongoose = require('mongoose');
require('dotenv').config();

const Event = require('../models/eventModel');
const removeIsSummarized = require('./removeIsSummarized');

const eventFields = (name) => ({
  eventType: 'Server Crash',
  source: `remove-is-summarized-test-${name}`,
  message: `Synthetic ${name} event`,
  severity: 'High',
});

const run = async () => {
  assert.ok(process.env.MONGO_URI, 'MONGO_URI must be configured');
  const databaseName = `mi_${randomUUID().replaceAll('-', '')}`;
  let connected = false;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: databaseName,
      serverSelectionTimeoutMS: 5000,
    });
    connected = true;
    console.log(`[remove-is-summarized-test] Temporary database: ${databaseName}`);
    await Event.init();

    const currentEvent = await Event.create({
      ...eventFields('current'),
      isSummarized: true,
    });
    const storedCurrentEvent = await Event.collection.findOne({ _id: currentEvent._id });
    assert.equal(Object.hasOwn(storedCurrentEvent, 'isSummarized'), false);
    console.log('[remove-is-summarized-test] PASS: Event schema no longer stores legacy field');

    await Event.collection.insertMany([
      { ...eventFields('legacy-false'), isSummarized: false },
      { ...eventFields('legacy-true'), isSummarized: true },
    ]);
    const before = await Event.collection.find().sort({ _id: 1 }).toArray();

    assert.deepEqual(await removeIsSummarized(), {
      mode: 'dry-run',
      matchedCount: 2,
      modifiedCount: 0,
    });
    assert.deepEqual(await Event.collection.find().sort({ _id: 1 }).toArray(), before);
    console.log('[remove-is-summarized-test] PASS: dry run reports without changing state');

    assert.deepEqual(await removeIsSummarized({ apply: true }), {
      mode: 'apply',
      matchedCount: 2,
      modifiedCount: 2,
    });
    const after = await Event.collection.find().sort({ _id: 1 }).toArray();
    const expectedAfter = before.map((event) => {
      const expected = { ...event };
      delete expected.isSummarized;
      return expected;
    });
    assert.deepEqual(after, expectedAfter);
    console.log('[remove-is-summarized-test] PASS: apply removed only the legacy field');

    assert.deepEqual(await removeIsSummarized({ apply: true }), {
      mode: 'apply',
      matchedCount: 0,
      modifiedCount: 0,
    });
    console.log('[remove-is-summarized-test] PASS: repeated apply is safe');
  } finally {
    try {
      if (connected) {
        await mongoose.connection.dropDatabase();
        console.log(`[remove-is-summarized-test] Cleaned temporary database: ${databaseName}`);
      }
    } finally {
      await mongoose.disconnect();
    }
  }

  console.log('[remove-is-summarized-test] PASS: all checks completed');
};

run().catch((error) => {
  console.error(`[remove-is-summarized-test] FAIL (${error.name}); checks or cleanup incomplete`);
  if (error.code === 'ERR_ASSERTION') {
    console.error(error.message);
  }
  process.exitCode = 1;
});
