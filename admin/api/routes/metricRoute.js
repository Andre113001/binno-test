const express = require('express')
const router = express.Router()

const metricsController = require('../controllers/metricsController')

router.get('/contents', metricsController.getContents)
router.get('/members', metricsController.getMembers)
router.get('/newsletter-subscriber', metricsController.getNewsletterSubscriber)
router.get('/enablers', metricsController.getEnablers)
router.get('/companies', metricsController.getCompanies)
router.get('/pending-posts', metricsController.getPendingPosts)
router.get('/pending-members', metricsController.getPendingMembers)

router.get('/recent-activities', metricsController.getRecentActivities)

module.exports = router
