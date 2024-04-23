const express = require('express');
const router = express.Router();
const nodemailerMiddleware = require('../middlewares/nodeMailerMiddleware');
const emailController = require('../controllers/MembershipEmailController');

router.use(nodemailerMiddleware);

router.post('/approved', emailController.approved);
router.post('/declined', emailController.declined);
router.post('/ongoing/:email', emailController.ongoing);
router.post('/interview/zoom', emailController.interviewZoom);
router.post('/interview/f2f', emailController.interviewF2f);
module.exports = router;
