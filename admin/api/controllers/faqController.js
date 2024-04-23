const db = require('../../database/db');

const uploadFaq = (req, res) => {
    const { title, content } = req.body; 

    try {
        db.query(`INSERT INTO faq_i (faq_datecreated, faq_title, faq_content) VALUES (NOW(), ?, ?)`, [title, content], (err, result) => {
            if (err) {
                res.json(err);
            } else {
                res.json('Upload is complete');
            }
        })
    } catch (error) {
        console.log(error);
        res.status(500).json(error)
    }
}

const readFaq = (req, res) => {
    try {
        db.query(`SELECT * FROM faq_i`, [], (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.json(result);
            }
        })
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
}

const editFaq = (req, res) => {
    const { faqId, title, content } = req.body;

    try {
        db.query(`UPDATE faq_i SET faq_title = ?, faq_content = ? WHERE faq_id = ?`, [title, content, faqId], (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.json("Faq is updated.");
            }
        })
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
}

const deleteFaq = (req, res) => {
    const { faqId } = req.body;

    try {
        db.query(`UPDATE faq_i SET faq_flag = 0 WHERE faq_id = ?`, [faqId], (err, result) => {
            if (err) {
                console.log(err);
            } else {
                res.json("Faq is deleted.");
            }
        })
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
}

module.exports = {
    uploadFaq,
    readFaq,
    editFaq,
    deleteFaq
}