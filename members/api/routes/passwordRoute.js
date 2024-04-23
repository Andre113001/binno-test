const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');

// Password route
router.post('/verifyChangePassword', passwordController.verifyChangePassword);
router.post('/resetTokenChecker', passwordController.resetTokenChecker);
router.post('/changePassword', passwordController.changePassword);

module.exports = router;
