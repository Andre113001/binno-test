const express = require('express');
const router = express.Router();
const nodemailerMiddleware = require('../middlewares/nodeMailerMiddleware');
const othersController = require('../controllers/OthersEmailController');

router.use(nodemailerMiddleware);

router.post('/forgotPassword', othersController.forgotpassword);
router.post('/twoAuth', othersController.twoAuth);

module.exports = router;