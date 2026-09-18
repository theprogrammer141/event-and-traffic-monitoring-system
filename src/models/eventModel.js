const mongoose = require('mongoose');
const { Schema } = mongoose;

const eventSchema = Schema(
  {
    eventType: {
      type: String,
      enum: ['Login', 'SignUp', 'Server Crash', 'Traffic Spike'],
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      required: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
