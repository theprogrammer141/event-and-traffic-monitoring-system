const assert = require('node:assert/strict');
const { test } = require('node:test');
const analyzeEvent = require('./aiService');

test('OpenRouter request boundary', async (t) => {
  const previousKey = process.env.OPENROUTER_API_KEY;
  const previousModel = process.env.OPENROUTER_MODEL;
  t.after(() => {
    for (const [key, value] of [
      ['OPENROUTER_API_KEY', previousKey],
      ['OPENROUTER_MODEL', previousModel],
    ]) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  process.env.OPENROUTER_API_KEY = 'test-key';
  process.env.OPENROUTER_MODEL = 'dots-studio/dots-3-note-preview:free';
  const event = {
    eventType: 'Server Crash',
    source: 'synthetic-test',
    message: 'Synthetic failure',
    severity: 'Critical',
    submittedBy: 'must-not-be-sent',
  };
  const snapshot = structuredClone(event);
  const insight = { summary: 'Analysis', recommendedActions: ['Check logs'] };
  const result = {
    model: 'returned-model',
    choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(insight) } }],
  };
  const request = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://openrouter.ai/api/v1/chat/completions');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'Bearer test-key');
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'dots-studio/dots-3-note-preview:free');
    assert.deepEqual(body.provider, { require_parameters: true });
    assert.equal(body.response_format.type, 'json_schema');
    assert.equal(body.response_format.json_schema.strict, true);
    assert.equal(body.response_format.json_schema.schema.additionalProperties, false);
    assert.deepEqual(body.response_format.json_schema.schema.required, [
      'summary',
      'recommendedActions',
    ]);
    assert.equal(body.stream, false);
    const { submittedBy, ...expected } = event;
    assert.equal(submittedBy, 'must-not-be-sent');
    assert.deepEqual(JSON.parse(body.messages[1].content), expected);
    return { ok: true, json: async () => result };
  });

  assert.deepEqual(await analyzeEvent(event), { ...insight, model: 'returned-model' });
  assert.deepEqual(event, snapshot);

  request.mock.mockImplementation(async () => ({ ok: false, status: 401 }));
  await assert.rejects(analyzeEvent(event), /OpenRouter request failed \(HTTP 401\)/);
  assert.equal(request.mock.callCount(), 2, 'A failed request must not be retried');

  request.mock.mockImplementation(async () => ({
    ok: true,
    json: async () => ({ error: { message: 'private provider details' } }),
  }));
  await assert.rejects(analyzeEvent(event), /^Error: OpenRouter returned a provider error$/);

  request.mock.mockImplementation(async () => {
    throw new DOMException('private details', 'TimeoutError');
  });
  await assert.rejects(analyzeEvent(event), /^Error: OpenRouter request timed out$/);

  request.mock.mockImplementation(async () => {
    throw new Error('private connection details');
  });
  await assert.rejects(
    analyzeEvent(event),
    /^Error: OpenRouter request failed or returned invalid JSON$/
  );

  const calls = request.mock.callCount();
  await assert.rejects(analyzeEvent({}), /Event eventType must be a non-empty string/);
  delete process.env.OPENROUTER_MODEL;
  await assert.rejects(analyzeEvent(event), /OPENROUTER_MODEL must be configured/);
  process.env.OPENROUTER_API_KEY = '';
  await assert.rejects(analyzeEvent(event), /OPENROUTER_API_KEY must be configured/);
  assert.equal(request.mock.callCount(), calls, 'Invalid input must not make an HTTP request');
});
