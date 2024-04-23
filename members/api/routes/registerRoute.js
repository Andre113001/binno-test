const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = multer.memoryStorage(); // Use memory storage for simplicity, adjust as needed

const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 5 } });

const applicationController = require('../controllers/registerController');

router.post('/', applicationController.account_application);
router.post('/upload', upload.array('files'), applicationController.upload_documents);

module.exports = router;