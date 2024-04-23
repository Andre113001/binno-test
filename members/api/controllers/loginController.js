const db = require('../../database/db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const hash = require('sha256')
const generateToken = require('../middlewares/generateTokenMiddleware');
const axios = require('axios');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const uniqueId = require('../middlewares/uniqueIdGeneratorMiddleware')

const { converBase64ToImage } = require('convert-base64-to-image')

const bcryptConverter = require('../middlewares/bcryptConverter');
const { uploadToLog } = require('../middlewares/activityLogger');


// Reusable function to authenticate user and generate token
const authenticateUser = async (accessKey, password) => {
    // Ensure accessKey is provided and not falsy
    if (!accessKey) {
        return Promise.resolve({ error: 'Access key is required' })
    }

    const hashedAccesskey = hash(accessKey).toString('base64')

    return new Promise((resolve, reject) => {
        db.query(
            `SELECT * FROM member_i WHERE member_accessKey = ? AND member_restrict IS NULL AND member_flag = 1`,
            [hashedAccesskey],
            async (err, result) => {
                if (err) {
                    reject({ error: 'Internal server error' })
                }

                if (
                    result.length === 0 ||
                    !result[0].hasOwnProperty('member_password')
                ) {
                    resolve({ error: 'User not found' })
                } else {
                    const DBpassword = result[0].member_password

                    if (!DBpassword) {
                        resolve({ error: 'User password not found' })
                    }
    
                    const passwordMatch = await bcrypt.compare(password, DBpassword)
    
                    if (passwordMatch) {
                        const otpSent =  twoAuth(accessKey);
                        if (otpSent) {
                            resolve({ twoAuth: true })
                        }
                    } else {
                        console.log('invalid pw');
                        resolve({ twoAuth: false })
                    }
                }
                
            }
        )
    })
}

// Controller to handle login request
const login = async (req, res) => {
    const { accessKey, password } = req.body

    try {
        // Destroy accesskey when logged out or by default
        const result = await authenticateUser(accessKey, password)
        if (result.error) {
            return res.json(result)
        }
        return res.json(result)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

function generateOTP() {
    // Generate a random 6-digit number
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
  }

const twoAuth = async (accesskey) => {
    try {
        const convertedAccessKey = hash(accesskey);
        db.query("SELECT email_i.email_address FROM member_i INNER JOIN member_contact ON member_i.member_contact_id = member_contact.contact_email INNER JOIN email_i ON member_contact.contact_email = email_i.email_id WHERE member_i.member_accesskey = ?", [convertedAccessKey], (err, result) => {
            if (err) {
                console.log(err);
            }

            if (result.length > 0) {
                const email = result[0].email_address;
                const otp = generateOTP();
                const convertedOtp = hash(otp);

                const query = "UPDATE member_i SET member_twoauth = ?, member_twoauth_valid = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE member_accesskey = ?";
                const values = [convertedOtp, convertedAccessKey];

                db.query(query, values, (updateError, updateRes) => {
                    if (updateError) {
                        console.log(updateError);
                    }

                    if (updateRes.affectedRows > 0) {
                        // Email notif here
                        // console.log(email, otp);
                        axios.post(`${process.env.EMAIL_DOMAIN}/others/twoAuth`, {
                            receiver: email,
                            otp: otp
                        })
                        .then(response => {
                            console.log('Response from server', response.data);
                            return true;
                            // Add any additional logic here based on the response if needed
                        })
                        .catch(error => {
                            console.error('Error making request', error.message);
                            return false;
                            // Handle error 
                        });
                    } else {
                        console.error("Fields unsuccessfully updated");
                    }
                });
            } else {
                console.error("Email cannot be found");
            }
        });
    } catch (error) {
        console.log(error);
    }
}

function formatDate() {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    
    const currentDate = new Date();
    const month = months[currentDate.getMonth()];
    const day = currentDate.getDate();
    const year = currentDate.getFullYear();
    let hour = currentDate.getHours();
    const minute = currentDate.getMinutes();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12; // Convert hour to 12-hour format
    const formattedDate = `${month} ${day}, ${year} | ${hour}:${minute < 10 ? '0' : ''}${minute} ${ampm}`;
    
    return formattedDate;
}

const verify_twoAuth = async (req, res) => {
    const { otp, accesskey } = req.body;
    console.log({
        otp: otp, 
        accesskey: accesskey
    });
    const hashedOtp = hash(otp);
    const hashedAccesskey = hash(accesskey);

    // console.log(otp, accesskey);

    try {
        db.query("SELECT member_settings.setting_institution, member_i.member_id, member_i.member_twoauth, member_i.member_first_time FROM member_i INNER JOIN member_settings ON member_i.member_setting = member_settings.setting_id WHERE member_i.member_twoauth = ? AND member_i.member_accesskey = ?", [hashedOtp, hashedAccesskey], (err, result) => {
            if (result.length > 0) {
                    const token = jwt.sign(
                        { userId: result[0].member_id, username: result[0].name },
                        process.env.JWT_SECRET_KEY
                    );
    
                    // Update token to database
                    db.query(
                        'UPDATE member_i SET member_access = ? WHERE member_id = ?',
                        [hash(token), result[0].member_id], 
                    );

                    const todayDateString = formatDate();

                    const logRes = uploadToLog(
                        result[0].member_id, '', result[0].setting_institution, 'Logged in', '', todayDateString
                    )
    
                    return res.json({auth: result[0].member_first_time, token: token});
            } else {
                return res.json({auth: false}); // Return false if no record is found
            }
        });
    } catch (error) {
        console.error(error);
        return res.json({error: error}); // Return false in case of an error
    }      
};

function getFileExtensionFromDataURL(dataURL) {
    const match = dataURL.match(/^data:image\/([a-zA-Z+]+);base64,/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
}

const firstTime = async (req, res) => {
    try {
        const { token, password, contact, description, profileImg, coverImg } = req.body;
        const newId = uniqueId.uniqueIdGenerator();
        let success = true;

        // Process profile image
        const base64ImageProfile = profileImg.split(';base64,').pop();
        const newNameProfile = newId + '.' + getFileExtensionFromDataURL(profileImg);
        const profileImagePath = path.join(__dirname, '../../public/img/profile-img/', newNameProfile);

        fs.writeFile(profileImagePath, base64ImageProfile, { encoding: 'base64' }, function (err) {
            if (err) {
                console.log('Error saving profile image:', err);
                success = false;
            } 
        });

        // Process cover image
        const base64ImageCover = coverImg.split(';base64,').pop();
        const newNameCover = newId + '.' + getFileExtensionFromDataURL(coverImg);
        const coverImagePath = path.join(__dirname, '../../public/img/profile-cover-img/', newNameCover);

        fs.writeFile(coverImagePath, base64ImageCover, { encoding: 'base64' }, function (err) {
            if (err) {
                console.log('Error saving cover image:', err);
                success = false;
            }
        });

        // Rest Query

        const convertedPassword = await bcryptConverter(password);

        db.query("UPDATE member_i SET member_password = ? WHERE member_access = ?", [convertedPassword, hash(token)], (err, result) => {
            if (err) {
                console.log('Error updating password:', err);
                success = false;
            } else {
                console.log("No rows were affected");
            }
        });

        db.query("UPDATE member_contact mc INNER JOIN member_i mi ON mi.member_contact_id = mc.contact_id SET mc.contact_number = ? WHERE mi.member_access = ?", [contact, hash(token)], (err, result) => {
            if (err) {
                console.log('Error updating contact number:', err);
                success = false;
            } else {
                console.log("No rows were affected");
            }
        });

        db.query("UPDATE member_settings ms INNER JOIN member_i mi ON mi.member_setting = ms.setting_id SET ms.setting_bio = ?, ms.setting_profilepic = ?, ms.setting_coverpic = ? WHERE mi.member_access = ?", [description, newNameProfile, newNameCover, hash(token)], (err, result) => {
            if (err) {
                console.log('Error updating member settings:', err);
                success = false;
            } else {
                console.log("No rows were affected");
            }
        });

        db.query("UPDATE member_i SET member_first_time = 0 WHERE member_access = ?", [hash(token)], (err, result) => {
            if (err) {
                console.log('Error updating member_first_time:', err);
                success = false;
            } else {
                console.log("No rows were affected");
            }
        });

        if (success) {
            res.json(true);
        } else {
            res.status(500).json({ error: 'One or more updates failed' });
        }

    } catch (error) {
        console.error('Error in firstTime controller:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}


module.exports = {
    login,
    verify_twoAuth,
    firstTime
}
