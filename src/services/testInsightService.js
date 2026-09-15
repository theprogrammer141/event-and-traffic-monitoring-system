require('dotenv').config();

const connectDB = require('../config/db');
const processEventsForInsights = require('../services/insightService');

const run = async () => {
  await connectDB();

  await processEventsForInsights();

  process.exit(0);
};

run();