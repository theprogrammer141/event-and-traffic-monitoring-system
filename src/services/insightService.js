const Event = require('../models/eventModel');

const processEventsForInsights = async () => {
  try {
    const events = await Event.find({
      severity: { $in: ['High', 'Critical'] },
      isSummarized: false,
    });

    console.log(`Found ${events.length} events eligible for AI analysis`);

    for (const event of events) {
      console.log('Eligible event:', {
        id: event._id,
        eventType: event.eventType,
        severity: event.severity,
        source: event.source,
      });
    }
  } catch (error) {
    console.error('Failed to process events for insights:', error);
    throw error;
  }
};

module.exports = processEventsForInsights;