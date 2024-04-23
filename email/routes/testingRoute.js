const express = require('express');
const router = express.Router();
const nodemailerMiddleware = require('../middlewares/nodeMailerMiddleware');
const testingController = require('../controllers/TestingEmailController');

router.use(nodemailerMiddleware);

router.post('/', testingController.testing);

module.exports = router;
