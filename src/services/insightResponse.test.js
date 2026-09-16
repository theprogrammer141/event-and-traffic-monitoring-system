const assert = require('node:assert/strict');
const { test } = require('node:test');
const { parseInsightResponse } = require('./insightResponse');

const envelope = (content) => ({
  model: 'provider-model',
  choices: [{ finish_reason: 'stop', message: { content } }],
});

test('valid insight is normalized and uses provider model metadata', () => {
  assert.deepEqual(
    parseInsightResponse(
      envelope(JSON.stringify({ summary: ' Summary ', recommendedActions: [' Act '] }))
    ),
    { summary: 'Summary', recommendedActions: ['Act'], model: 'provider-model' }
  );
  assert.deepEqual(
    parseInsightResponse(envelope(JSON.stringify({ summary: 'Summary', recommendedActions: [] })))
      .recommendedActions,
    []
  );
});

for (const [name, content] of [
  ['malformed JSON', '{'],
  ['markdown fences', '```json\n{}\n```'],
  ['null', 'null'],
  ['array', '[]'],
  ['missing fields', '{}'],
  ['extra fields', JSON.stringify({ summary: 'ok', recommendedActions: [], model: 'invented' })],
  ['blank summary', JSON.stringify({ summary: ' ', recommendedActions: [] })],
  ['numeric summary', JSON.stringify({ summary: 1, recommendedActions: [] })],
  ['non-array actions', JSON.stringify({ summary: 'ok', recommendedActions: 'act' })],
  ['blank action', JSON.stringify({ summary: 'ok', recommendedActions: [' '] })],
  ['non-string action', JSON.stringify({ summary: 'ok', recommendedActions: [null] })],
  ['empty content', ''],
]) {
  test(`rejects ${name}`, () => {
    assert.throws(() => parseInsightResponse(envelope(content)), /Invalid AI response:/);
  });
}

test('rejects missing envelopes, model metadata, refusals, and incomplete completions', () => {
  const valid = () => envelope(JSON.stringify({ summary: 'ok', recommendedActions: [] }));
  const missingModel = valid();
  delete missingModel.model;
  const refused = valid();
  refused.choices[0].message.refusal = 'Cannot comply';
  for (const response of [undefined, {}, missingModel, refused]) {
    assert.throws(() => parseInsightResponse(response), /Invalid AI response:/);
  }
  for (const reason of ['length', 'content_filter', 'tool_calls', 'error', null]) {
    const response = valid();
    response.choices[0].finish_reason = reason;
    assert.throws(() => parseInsightResponse(response), /did not finish normally/);
  }
});
