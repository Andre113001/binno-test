const db = require('../../database/db');
const { readElements, saveElements } = require('../utils/elementsUtility');

// Reusable function to retrieve elements by ID
const getElementsById = (id) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT test_txt FROM test WHERE test_id = ?', [id], async (err, result) => {
            if (err) {
                reject(err);
            } else {
                if (result.length === 0) {
                    resolve({ error: 'No data found for the given ID' });
                } else {
                    const elementsData = await readElements(id);
                    resolve(elementsData);
                }
            }
        });
    });
}

// Reusable function to save elements by ID
const saveElementsById = async (id, newFile) => {
    return await saveElements(id, newFile);
}

// Controller to retrieve elements by ID
const getElements = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await getElementsById(id);
        if (result.error) {
            return res.status(404).json(result);
        }
        return res.json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Controller to save elements by ID
const saveElementsController = async (req, res) => {
    const { id } = req.params;
    const { newFile } = req.body;

    const result = await saveElementsById(id, newFile);

    if (result.success) {
        res.status(200).json(result);
    } else {
        res.status(500).json(result);
    }
}

module.exports = {
    getElements,
    saveElementsController,
};
