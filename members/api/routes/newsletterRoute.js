const express = require('express')
const router = express.Router()
const newsletterController = require('../controllers/newsletterController');

router.use(express.json())
router.use(express.urlencoded({ extended: true }))

router.post('/subscribe', newsletterController.subscribe);
router.get('/unsubscribe', newsletterController.unsubscribe);

module.exports = router;