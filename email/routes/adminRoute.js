const express = require('express');
const router = express.Router();
const nodemailerMiddleware = require('../middlewares/nodeMailerMiddleware');

const restrictController = require('../controllers/restrictionController');

router.use(nodemailerMiddleware);

router.post('/restrict', restrictController.restrict);
router.post('/remove', restrictController.remove);
router.post('/uplift', restrictController.uplift);
router.post('/recover', restrictController.recover);


module.exports = router;
