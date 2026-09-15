const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      unique: true,
    },

    summary: {
      type: String,
      required: true,
      trim: true,
    },

    recommendedActions: {
      type: [String],
      default: [],
    },

    model: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Insight = mongoose.model('Insight', insightSchema);

module.exports = Insight;