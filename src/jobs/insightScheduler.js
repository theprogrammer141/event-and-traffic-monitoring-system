const cron = require('node-cron');
const processEventsForInsights = require('../services/insightService');

const startInsightScheduler = () => {
  let isProcessing = false;

  cron.schedule('* * * * *', async () => {
    if (isProcessing) {
      console.log('⚠️ Previous insight batch still in progress, skipping this tick.');
      return;
    }

    isProcessing = true;
    console.log('⏰ Running scheduled insight processing...');

    try {
      await processEventsForInsights();
    } catch (error) {
      console.error('❌ Scheduled insight processing failed:', error.message);
    } finally {
      isProcessing = false;
    }
  });

  console.log('✅ Insight scheduler started');
};

module.exports = startInsightScheduler;
