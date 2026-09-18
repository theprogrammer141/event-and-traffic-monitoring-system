const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

const mongoose = require('mongoose');
require('dotenv').config();

const Event = require('../models/eventModel');
const Insight = require('../models/insightModel');
const processEventsForInsights = require('../services/insightService');

const run = async () => {
  assert.ok(process.env.MONGO_URI, 'MONGO_URI must be configured');

  // Override the URI database so fixtures never touch the application database.
  const databaseName = `ie_${randomUUID().replaceAll('-', '')}`;
  let connected = false;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: databaseName,
      serverSelectionTimeoutMS: 5000,
    });
    connected = true;
    console.log(`[eligibility-test] Temporary database: ${databaseName}`);

    // Finish model initialization before testing or removing the temporary database.
    await Promise.all([Event.init(), Insight.init()]);

    const cases = [];
    for (const severity of ['High', 'Critical', 'Medium', 'Low']) {
      for (const isSummarized of [false, true]) {
        for (const hasInsight of [false, true]) {
          cases.push({ severity, isSummarized, hasInsight });
        }
      }
    }

    const fixtures = cases.map(({ severity, isSummarized, hasInsight }) => ({
      eventType: 'Server Crash',
      source: 'insight-eligibility-test',
      message: `Fixture: ${severity}, summarized=${isSummarized}, insight=${hasInsight}`,
      severity,
      isSummarized,
    }));
    const insertion = await Event.collection.insertMany(fixtures);
    const inserted = fixtures.map((fixture, index) => ({
      ...fixture,
      _id: insertion.insertedIds[index],
    }));
    const eventsWithInsights = inserted.filter((event, index) => cases[index].hasInsight);
    await Insight.insertMany(
      eventsWithInsights.map((event) => ({
        event: event._id,
        summary: `Existing insight for ${event.message}`,
        recommendedActions: [],
        model: 'synthetic-test-model',
      }))
    );

    const expectedEvents = inserted.filter((event, index) => !cases[index].hasInsight);
    const ids = (events) => events.map((event) => event._id.toString()).sort();
    const snapshot = async () => ({
      events: await Event.find().sort({ _id: 1 }).lean(),
      insights: await Insight.find().sort({ _id: 1 }).lean(),
    });

    const beforeSelection = await snapshot();
    assert.deepEqual(ids(await processEventsForInsights()), ids(expectedEvents));
    assert.deepEqual(await snapshot(), beforeSelection, 'Selection must not change database state');
    console.log(
      '[eligibility-test] PASS: every event without an insight returned, regardless of severity or legacy isSummarized value'
    );
    console.log('[eligibility-test] PASS: events and insights remained unchanged');

    // Remove only the eligible fixtures, leaving events that already have insights.
    await Event.deleteMany({ _id: { $in: expectedEvents.map((event) => event._id) } });
    const beforeNoMatches = await snapshot();
    assert.deepEqual(await processEventsForInsights(), []);
    assert.deepEqual(await snapshot(), beforeNoMatches, 'No-match selection must not change state');
    console.log('[eligibility-test] PASS: ineligible-only database returns an empty array');

    await Event.deleteMany({ _id: { $in: inserted.map((event) => event._id) } });
    const beforeEmpty = await snapshot();
    assert.deepEqual(await processEventsForInsights(), []);
    assert.deepEqual(await snapshot(), beforeEmpty, 'Empty selection must not change state');
    console.log('[eligibility-test] PASS: empty database returns an empty array');
  } finally {
    try {
      if (connected) {
        await mongoose.connection.dropDatabase();
        console.log(`[eligibility-test] Cleaned temporary database: ${databaseName}`);
      }
    } finally {
      await mongoose.disconnect();
    }
  }

  console.log('[eligibility-test] PASS: all checks completed');
};

run().catch((error) => {
  // Do not print connection errors, which may contain credentials or host details.
  console.error(`[eligibility-test] FAIL (${error.name}); checks or cleanup did not complete`);
  if (error.code === 'ERR_ASSERTION') {
    console.error(error.message);
  }
  process.exitCode = 1;
});
