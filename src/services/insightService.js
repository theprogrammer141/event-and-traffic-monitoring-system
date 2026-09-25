const Event = require('../models/eventModel');
const Insight = require('../models/insightModel');
const processEvent = require('../services/aiEventProcessing');

const getEligibleEvents = async (limit = 10) => {
  const events = await Event.aggregate([
    // Stage 1: Join with Insights collection
    {
      $lookup: {
        from: Insight.collection.name, // The collection name in MongoDB ('insights')
        localField: '_id', // The Event's primary key
        foreignField: 'event', // The Insight's foreign key linking back to Event
        as: 'existingInsights', // Put matches into an array called 'existingInsights'
      },
    },

    // Stage 2: Filter for events with NO insights
    {
      $match: {
        existingInsights: { $eq: [] }, // Only keep events where existingInsights is an empty array
      },
    },

    // Stage 3: Assign a numerical priority to each severity
    {
      $addFields: {
        severityRank: {
          $switch: {
            branches: [
              { case: { $eq: ['$severity', 'Critical'] }, then: 1 },
              { case: { $eq: ['$severity', 'High'] }, then: 2 },
              { case: { $eq: ['$severity', 'Medium'] }, then: 3 },
              { case: { $eq: ['$severity', 'Low'] }, then: 4 },
            ],
            default: 5,
          },
        },
      },
    },

    // Stage 4: Sort by priority (rank 1 first), then oldest first (createdAt: 1)
    {
      $sort: {
        severityRank: 1,
        createdAt: 1,
      },
    },

    // Stage 5: Limit the batch size
    {
      $limit: limit,
    },

    // Stage 6: Remove temporary fields from final result
    {
      $project: {
        existingInsights: 0,
        severityRank: 0,
      },
    },
  ]);

  return events;
};

const processEventsForInsights = async (options = {}) => {
  const limit = options.limit || 10;
  const events = await getEligibleEvents(limit);

  const stats = {
    total: events.length,
    succeeded: 0,
    failed: 0,
  };

  if (events.length === 0) {
    return stats;
  }

  console.log(`Processing batch of ${events.length} eligible events...`);

  // Sequential execution for rate-limit protection
  for (const event of events) {
    try {
      await processEvent(event);
      stats.succeeded++;
    } catch (error) {
      stats.failed++;
      console.error(`Failed to process event ${event._id}:`, error.message);
    }
  }

  console.log(`Batch complete. Succeeded: ${stats.succeeded}, Failed: ${stats.failed}`);
  return stats;
};

processEventsForInsights.getEligibleEvents = getEligibleEvents;
module.exports = processEventsForInsights;
