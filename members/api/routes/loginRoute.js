const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');
const multer = require('multer');

// Set up multer storage
const storage = multer.memoryStorage(); // Use memory storage for simplicity, adjust as needed
const upload = multer({ storage: storage });

// Login route
router.post('/', loginController.login);
router.post('/verify', loginController.verify_twoAuth);
router.post('/firstTime', upload.fields([
    { name: 'profile_img_file', maxCount: 1 },
    { name: 'cover_img_file', maxCount: 1 }
]), loginController.firstTime);


module.exports = router;
