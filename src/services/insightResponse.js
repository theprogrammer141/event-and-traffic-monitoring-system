const responseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'event_insight',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'A concise, non-empty event summary.' },
        recommendedActions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Suggested actions as non-empty strings; may be empty.',
        },
      },
      required: ['summary', 'recommendedActions'],
      additionalProperties: false,
    },
  },
};

const parseInsightResponse = (response) => {
  const choice = response?.choices?.[0];
  if (choice?.message?.refusal) {
    throw new Error('Invalid AI response: model refused the request');
  }
  if (choice?.finish_reason !== 'stop') {
    throw new Error('Invalid AI response: completion did not finish normally');
  }
  if (typeof response.model !== 'string' || !response.model.trim()) {
    throw new Error('Invalid AI response: missing model metadata');
  }
  const content = choice.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Invalid AI response: missing assistant content');
  }

  let insight;
  try {
    insight = JSON.parse(content);
  } catch {
    throw new Error('Invalid AI response: assistant content is not JSON');
  }
  if (!insight || typeof insight !== 'object' || Array.isArray(insight)) {
    throw new Error('Invalid AI response: expected an object');
  }
  const keys = Object.keys(insight);
  if (keys.length !== 2 || !keys.includes('summary') || !keys.includes('recommendedActions')) {
    throw new Error('Invalid AI response: expected only summary and recommendedActions');
  }
  if (typeof insight.summary !== 'string' || !insight.summary.trim()) {
    throw new Error('Invalid AI response: summary must be a non-empty string');
  }
  if (
    !Array.isArray(insight.recommendedActions) ||
    insight.recommendedActions.some((action) => typeof action !== 'string' || !action.trim())
  ) {
    throw new Error('Invalid AI response: recommendedActions must contain non-empty strings');
  }
  return {
    summary: insight.summary.trim(),
    recommendedActions: insight.recommendedActions.map((action) => action.trim()),
    model: response.model,
  };
};

module.exports = { responseFormat, parseInsightResponse };
