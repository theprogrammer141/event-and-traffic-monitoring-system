const express = require('express');
const router = express.Router();
const eventController = require('./../controllers/eventController');
const authMiddleware = require('./../middlewares/authMiddleware');

router.get('/', authMiddleware.protect, eventController.getAllEvents);
router.post('/', authMiddleware.protect, eventController.createEvent);

module.exports = router;
