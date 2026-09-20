const Insight = require('./../models/insightModel');
const analyzeEvent = require('./../services/aiService');
const saveInsight = require('./../services/insightPersistenceService');

const processEvent = async (event) => {
  if (!event || !event._id) {
    throw new Error('A valid event with an _id is required');
  }

  const { _id } = event;

  const existingInsight = await Insight.findOne({ event: _id });

  if (existingInsight) {
    return existingInsight;
  }

  const insight = await analyzeEvent(event);

  return await saveInsight(_id, insight);
};

module.exports = processEvent;
