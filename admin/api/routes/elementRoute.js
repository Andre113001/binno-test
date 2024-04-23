const express = require('express');
const router = express.Router();
const elementController = require('../controllers/elementController');

// Retrieve Elements
router.get('/:id', elementController.getElements);

// Save Elements
router.post('/save-elements/:id', elementController.saveElementsController);

module.exports = router;
