// getRoute.js
const express = require('express');
const router = express.Router();
const db = require('../../database/db');


router.get('/', (req, res) => {
    res.send('Hello, World');
});
  
router.get('/users', async (req, res) => {
    db.query(`SELECT * FROM member_i 
                INNER JOIN member_contact ON member_contact.contact_id = member_i.member_contact_id 
                INNER JOIN email_i ON email_i.email_id = member_contact.contact_email
                INNER JOIN member_settings ON member_settings.setting_id = member_i.member_setting`, (err, result) => {
        if (err) {
            console.error(err);
        } else {
            res.send(result);
        }
    });
});

router.get('/app-requests', async (req, res) => {
    db.query("SELECT * FROM request_i", (err, result) => {
        if (err ) {
            console.err(err);
        } else {
            console.log(result);
            res.send(result);
        }
    });
});

router.get('/activities', async (req, res) => {
    db.query("SELECT * FROM history_i ORDER BY history_datecreated DESC", (err, result) => {
        if (err) {
            console.error(err);
        } else {
            res.send(result);
        }
    });
});

router.get('/activities/:member_id', async (req, res) => {
    const { member_id } = req.params;
    db.query("SELECT * FROM history_i WHERE history_author = ? ORDER BY history_datecreated DESC", [member_id], (err, result) => {
        if (err) {
            console.error(err);
        } else {
            res.send(result);
        }
    });
});
  
  module.exports = router;