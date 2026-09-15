const cron = require('node-cron');
const processEventsForInsights = require('../services/insightService');

const startInsightScheduler = () => {
  cron.schedule('* * * * *', async () => {
    console.log('⏰ Running scheduled insight processing...');

    try {
      await processEventsForInsights();
    } catch (error) {
      console.error('❌ Scheduled insight processing failed:', error.message);
    }
  });

  console.log('✅ Insight scheduler started');
};

module.exports = startInsightScheduler;