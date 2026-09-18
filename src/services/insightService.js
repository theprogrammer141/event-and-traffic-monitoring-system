const Event = require('../models/eventModel');
const Insight = require('../models/insightModel');

const processEventsForInsights = async () => {
  try {
    const events = await Event.aggregate([
      {
        $lookup: {
          from: Insight.collection.name,
          localField: '_id',
          foreignField: 'event',
          as: 'existingInsights',
        },
      },
      { $match: { existingInsights: { $eq: [] } } },
      { $project: { existingInsights: 0 } },
    ]);

    console.log(`Found ${events.length} events eligible for AI analysis`);

    for (const event of events) {
      console.log('Eligible event:', {
        id: event._id,
        eventType: event.eventType,
        severity: event.severity,
        source: event.source,
      });
    }

    return events;
  } catch (error) {
    console.error('Failed to process events for insights:', error);
    throw error;
  }
};

module.exports = processEventsForInsights;
