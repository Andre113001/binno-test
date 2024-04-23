const express = require('express')
const router = express.Router();
const membershipController = require('../controllers/membershipController');

router.post('/restrict', membershipController.restrictMember);
router.post('/lift_restrict', membershipController.liftRestriction);
router.post('/recover', membershipController.recoverMember);

module.exports = router;