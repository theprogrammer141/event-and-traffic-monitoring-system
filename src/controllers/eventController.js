const Event = require('./../models/eventModel');
const eventQueue = require('./../config/eventQueue');

exports.createEvent = async (req, res) => {
  const { eventType, source, message, severity } = req.body;

  try {
    // add a job to eventQueue with the event data + req.user._id as submittedBy
    const processedEvent = await eventQueue.add(
      'event',
      {
        eventType,
        source,
        message,
        severity,
        submittedBy: req.user._id,
      },
      {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      }
    );

    // respond 202 with something like { status, message, jobId }
    res.status(202).json({
      status: 'success',
      message: 'Event added to queue successfully!',
      jobId: processedEvent.id,
    });
  } catch (error) {
    //If the redis is down, send 500
    res.status(500).json({
      status: 'fail',
      message: 'Queue temporarily unavailable. Try again later.',
    });
  }
};

exports.getAllEvents = async (req, res) => {
  //Paginate
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  //Filtering
  const filter = {};

  filter.submittedBy = req.user._id;

  if (req.query.severity) {
    filter.severity = req.query.severity;
  }
  if (req.query.eventType) {
    filter.eventType = req.query.eventType;
  }

  try {
    const events = await Event.find(filter).skip(skip).limit(limit);
    res.status(200).json({
      status: 'success',
      results: events.length,
      data: {
        events,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Something went wrong!',
    });
  }
};
