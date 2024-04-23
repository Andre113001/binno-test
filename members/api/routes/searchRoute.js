const express = require('express');
const router = express.Router();

const searchController = require('../controllers/searchController');

router.post('/blog', searchController.searchBlog);
router.post('/blog/company', searchController.searchCompanyBlogs);
router.post('/blog/enabler', searchController.searchEnablerBlogs);
router.post('/event', searchController.searchEvent);
router.post('/guide', searchController.searchGuides);

module.exports = router;