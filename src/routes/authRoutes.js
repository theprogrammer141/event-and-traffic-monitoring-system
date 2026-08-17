const express = require('express');
const router = express.Router();
const authController = require('./../controllers/authController');

router.post('/registerUser', authController.registerUser);
router.post('/login', authController.login);

module.exports = router;
