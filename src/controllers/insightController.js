const Insight = require('../models/insightModel');
const Event = require('../models/eventModel');

exports.getAllInsights = async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    // 1. Get all event IDs owned by the logged-in user
    const userEventIds = await Event.find({ submittedBy: req.user._id }).distinct('_id');

    // 2. Build query filter
    const filter = { event: { $in: userEventIds } };

    // Optional: filter by specific event if passed in query
    if (req.query.event) {
      filter.event = req.query.event;
    }

    // 3. Query insights with populated event data
    const total = await Insight.countDocuments(filter);
    const insights = await Insight.find(filter)
      .populate('event')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      status: 'success',
      results: insights.length,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      totalResults: total,
      data: {
        insights,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: `Failed to fetch insights: ${error.message}`,
    });
  }
};

exports.getInsightById = async (req, res) => {
  try {
    const insight = await Insight.findById(req.params.id).populate('event');

    if (!insight) {
      return res.status(404).json({
        status: 'fail',
        message: 'Insight not found',
      });
    }

    // Authorization: verify the event belongs to the current user
    if (insight.event && insight.event.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to view this insight',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        insight,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: `Failed to fetch insight: ${error.message}`,
    });
  }
};
