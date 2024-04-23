const db = require('../../database/db');
const dotenv = require('dotenv');
const sha256 = require('sha256');
const axios = require('axios');

dotenv.config()

//Middlewares
const bcryptConverter = require('../middlewares/bcryptConverter');
const generateToken = require('../middlewares/generateTokenMiddleware');

const verifyChangePassword = async (req, res) => {
    const { accesskey } = req.body;

    try {
        const convertedAccessKey = sha256(accesskey);
        db.query("SELECT email_i.email_address, member_settings.setting_institution FROM member_i INNER JOIN member_contact ON member_i.member_contact_id = member_contact.contact_email INNER JOIN email_i ON member_contact.contact_email = email_i.email_id LEFT JOIN member_settings ON member_i.member_setting = member_settings.setting_id WHERE member_i.member_accesskey = ? AND member_restrict IS NULL AND member_flag = 1", [convertedAccessKey], (err, result) => {
            if (err) {
                return res.status(500).json({ err });
            }

            if (result.length > 0) {
                const email = result[0].email_address;
                const name = result[0].setting_institution;
                const token = generateToken(32);
                const convertedToken = sha256(token);
                
                // Assuming you have a MySQL connection named `db`
                // Make sure to replace 'your_table_name' with the actual table name
                const query = "UPDATE member_i SET member_resetpassword_token = ?, member_resetpassword_token_valid = DATE_ADD(NOW(), INTERVAL 3 HOUR) WHERE member_accesskey = ?";
                const values = [convertedToken, convertedAccessKey];

                db.query(query, values, (updateError, updateRes) => {
                    if (updateError) {
                        return res.status(500).json({ error: updateError });
                    }

                    if (updateRes.affectedRows > 0) {
                        // Email notif here
                        axios.post(`${process.env.EMAIL_DOMAIN}/others/forgotPassword`, {
                            receiver: email,
                            name: name,
                            token: token
                        })
                        .then(response => {
                            console.log('Response from email server', response.data);
                            // Add any additional logic here based on the response if needed
                            return res.status(200).json({ message: "Email Sent" });
                        })
                        .catch(error => {
                            console.error('Error making request', error.message);
                            // Handle error
                            return res.status(500).json({ message: "Failed to send email" });
                        });
                    } else {
                        res.status(500).json({ result: "Fields unsuccessfully updated" });
                    }
                });
            } else {
                return res.status(200).json({ message: "Member cannot be found" });
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error });
    }
};

const resetTokenChecker = async (req, res) => {
    try {
        const { token }= req.body;

        db.query("SELECT member_id, member_resetpassword_token, member_resetpassword_token_valid FROM member_i WHERE member_resetpassword_token = ? AND member_restrict IS NULL AND member_flag = 1", [sha256(token)], (err, result) => {
            if (result.length > 0) {
                const tokenData = result[0];
                const currentTimestamp = new Date().getTime();
                const tokenExpirationTimestamp = new Date(tokenData.member_resetpassword_token_valid).getTime();

                // Check if the token is still valid (not expired)
                if (currentTimestamp < tokenExpirationTimestamp) {
                    res.status(200).json({ message: 'Token is valid' });
                } else {
                    res.status(400).json({ message: 'Token has expired' });
                }
            } else {
                return res.status(500).json({error: err});
            }
        });

        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error });
    }
};

const changePassword = async (req, res) => {
    const { token, newPassword } = req.body
    try {
        const convertedPassword = await bcryptConverter(newPassword);
        db.query("UPDATE member_i SET member_password = ?, member_resetpassword_token = NULL, member_resetpassword_token_valid = NULL WHERE member_resetpassword_token = ?", [convertedPassword, sha256(token)], (updateError, updateRes) => {
            if (updateError) {
                // console.log(updateError);
                return res.status(500).json({ error: 'Failed to change password' });
            }

            if (updateRes.affectedRows > 0) {
                return res.status(200).json({ message: 'Password Changed Successfully' });
            } else {
                return res.status(500).json({ message: 'Failed to change password' });
            }
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: error});
    }
};

module.exports = {
    verifyChangePassword,
    resetTokenChecker,
    changePassword
}