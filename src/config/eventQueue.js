const { Queue } = require('bullmq');
const redis = require('./redis');

//Create queue instance
const eventQueue = new Queue('events', {
  connection: redis,
});

//Export queue instance
module.exports = eventQueue;
