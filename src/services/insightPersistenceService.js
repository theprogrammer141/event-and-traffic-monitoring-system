const Event = require('../models/eventModel');
const Insight = require('../models/insightModel');

// Call with an existing event ID and the validated output from analyzeEvent().
const saveInsight = async (eventId, insight) => {
  if (!eventId) {
    throw new Error('An event ID is required');
  }

  const existing = await Insight.findOne({ event: eventId });
  if (existing) {
    return existing;
  }

  if (!(await Event.exists({ _id: eventId }))) {
    throw new Error('Cannot save insight: event does not exist');
  }

  try {
    return await Insight.create({
      event: eventId,
      summary: insight?.summary,
      recommendedActions: insight?.recommendedActions,
      model: insight?.model,
    });
  } catch (error) {
    // The unique event index resolves concurrent inserts; never overwrite the winner.
    if (error.code === 11000 && error.keyPattern?.event === 1) {
      const saved = await Insight.findOne({ event: eventId });
      if (saved) {
        return saved;
      }
    }
    throw error;
  }
};

module.exports = saveInsight;
