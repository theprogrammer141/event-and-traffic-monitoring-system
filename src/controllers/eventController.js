const Event = require('./../models/eventModel');

exports.createEvent = async (req, res) => {
  const { eventType, source, message, severity } = req.body;

  try {
    const newEvent = await Event.create({
      eventType,
      source,
      message,
      severity,
    });

    res.status(201).json({
      status: 'success',
      data: {
        event: newEvent,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Document creation failed',
    });
  }
};

exports.getAllEvents = async (req, res) => {
  //Paginate
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  //Filtering
  const filter = {}
  
  if(req.query.severity) filter.severity = req.query.severity;
  if(req.query.eventType) filter.eventType = req.query.eventType; 

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
