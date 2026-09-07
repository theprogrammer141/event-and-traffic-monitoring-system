const eventQueue = require('./../config/eventQueue');
const Event = require('./../models/eventModel');
const { Worker } = require('bullmq');
const redis = require('./../config/redis');

const worker = new Worker('events', async (job) => {
  // job.data contains your queued payload: { eventType, source, message, severity, submittedBy }
  // Save it to MongoDB
  console.log('📥 Job received:', job.id, job.data);
  try {
    const { eventType, source, message, severity, submittedBy } = job.data;
    const newEvent = await Event.create({
      eventType,
      source,
      message,
      severity,
      submittedBy,
    });

    // If successful, return something (doesn't matter what — just signals completion)
    return `Event created successfully: ${newEvent}`;
  } catch (error) {
    // If it throws, BullMQ catches it and marks the job as failed
    throw new Error(`Failed to create event: ${error.message}`);
  }
}, {connection: redis});

module.exports = worker;
