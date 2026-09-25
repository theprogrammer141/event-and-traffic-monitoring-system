const express = require('express');
const router = express.Router();
const insightController = require('../controllers/insightController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware.protect);

router.get('/', insightController.getAllInsights);
router.get('/:id', insightController.getInsightById);

module.exports = router;
