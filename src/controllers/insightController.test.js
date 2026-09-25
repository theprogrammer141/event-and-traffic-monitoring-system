const assert = require('node:assert/strict');
const { test } = require('node:test');
const Insight = require('../models/insightModel');
const Event = require('../models/eventModel');
const insightController = require('./insightController');

test('insightController.getAllInsights', async (t) => {
  const userId = '507f1f77bcf86cd799439011';
  const userEventIds = ['event-1', 'event-2'];

  t.mock.method(Event, 'find', () => ({
    distinct: async (field) => {
      assert.equal(field, '_id');
      return userEventIds;
    },
  }));

  const mockInsights = [
    { _id: 'ins-1', event: { _id: 'event-1', message: 'crash' }, summary: 'analysis 1' },
    { _id: 'ins-2', event: { _id: 'event-2', message: 'slow' }, summary: 'analysis 2' },
  ];

  t.mock.method(Insight, 'countDocuments', async () => 2);
  t.mock.method(Insight, 'find', () => ({
    populate: () => ({
      sort: () => ({
        skip: () => ({
          limit: async () => mockInsights,
        }),
      }),
    }),
  }));

  const req = {
    user: { _id: userId },
    query: { page: '1', limit: '10' },
  };

  let responseData = null;
  let statusCode = null;

  const res = {
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          responseData = data;
        },
      };
    },
  };

  await insightController.getAllInsights(req, res);

  assert.equal(statusCode, 200);
  assert.equal(responseData.status, 'success');
  assert.equal(responseData.results, 2);
  assert.deepEqual(responseData.data.insights, mockInsights);
});

test('insightController.getInsightById - 404 when not found', async (t) => {
  t.mock.method(Insight, 'findById', () => ({
    populate: async () => null,
  }));

  const req = {
    params: { id: 'missing-id' },
    user: { _id: 'user-1' },
  };

  let statusCode = null;
  let responseData = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          responseData = data;
        },
      };
    },
  };

  await insightController.getInsightById(req, res);

  assert.equal(statusCode, 404);
  assert.equal(responseData.message, 'Insight not found');
});

test('insightController.getInsightById - 403 when forbidden (different user)', async (t) => {
  t.mock.method(Insight, 'findById', () => ({
    populate: async () => ({
      _id: 'ins-1',
      event: { submittedBy: 'other-user' },
    }),
  }));

  const req = {
    params: { id: 'ins-1' },
    user: { _id: 'current-user' },
  };

  let statusCode = null;
  let responseData = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          responseData = data;
        },
      };
    },
  };

  await insightController.getInsightById(req, res);

  assert.equal(statusCode, 403);
  assert.equal(responseData.message, 'You do not have permission to view this insight');
});

test('insightController.getInsightById - 200 when authorized', async (t) => {
  const matchingInsight = {
    _id: 'ins-1',
    event: { submittedBy: 'current-user', message: 'crash' },
    summary: 'analysis',
  };

  t.mock.method(Insight, 'findById', () => ({
    populate: async () => matchingInsight,
  }));

  const req = {
    params: { id: 'ins-1' },
    user: { _id: 'current-user' },
  };

  let statusCode = null;
  let responseData = null;
  const res = {
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => {
          responseData = data;
        },
      };
    },
  };

  await insightController.getInsightById(req, res);

  assert.equal(statusCode, 200);
  assert.equal(responseData.status, 'success');
  assert.deepEqual(responseData.data.insight, matchingInsight);
});
