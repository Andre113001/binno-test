const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');

router.post('/upload', faqController.uploadFaq);
router.get('/fetch', faqController.readFaq);
router.post('/edit', faqController.editFaq);
router.post('/delete', faqController.deleteFaq);


module.exports = router;