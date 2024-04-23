const express = require('express');
const router = express.Router();
const nodemailerMiddleware = require('../middlewares/nodeMailerMiddleware');
const subscribeController = require('../controllers/subscribeController');

router.use(nodemailerMiddleware);

router.post('/add', subscribeController.add);
router.post('/exist', subscribeController.exist);

module.exports = router;
