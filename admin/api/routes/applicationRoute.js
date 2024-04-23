const express = require('express')
const router = express.Router()
const multer = require('multer')
const storage = multer.memoryStorage() // Use memory storage for simplicity, adjust as needed

const upload = multer({ storage: storage })

const applicationController = require('../controllers/applicationController')

router.post(
    '/upload',
    upload.array('files'),
    applicationController.uploadDocuments
)
router.get('/', applicationController.getApplications)
router.get('/:appId', applicationController.getApplicationDetails)
router.get('/get/:appId', applicationController.fetchApplicationById)
router.get('/upload/:appId', applicationController.getApplicationUploads)
router.get('/upload/:appId/:fileName', applicationController.getFile)
router.post('/approval', applicationController.setApprovalStatus)

module.exports = router
