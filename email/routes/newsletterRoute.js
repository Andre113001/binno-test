const express = require('express');
const router = express.Router();
const nodemailerMiddleware = require('../middlewares/nodeMailerMiddleware');
const newsletterController = require('../controllers/newsletterEmailController');

router.use(nodemailerMiddleware);

router.post('/blog', newsletterController.blogNewsletter);
router.post('/event', newsletterController.eventNewsletter);
router.post('/guides', newsletterController.guidesNewsletter);
router.post('/post', newsletterController.postNewsletter);
router.post('/', newsletterController.newsletter_basic);

module.exports = router;
