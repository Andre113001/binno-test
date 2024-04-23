const db = require('../../database/db')
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const sha256 = require('sha256')
const axios = require('axios')

dotenv.config()

//Middlewares
const uniqueId = require('../middlewares/uniqueIdGeneratorMiddleware')
const sanitizedMemberId = require('../middlewares/querySanitizerMiddleware')
const bcryptConverter = require('../middlewares/bcryptConverter')
const generateToken = require('../middlewares/generateTokenMiddleware')

// Reusable function to get a member by ID
const getMemberById = (memberId) => {
    return new Promise((resolve, reject) => {
        // Using parameterized query to prevent SQL injection
        const sql = `
            SELECT member_i.*, member_settings.*, member_contact.contact_number , email_i.email_address FROM member_i 
            INNER JOIN member_settings ON member_settings.setting_memberId = member_i.member_id 
            INNER JOIN member_contact ON member_contact.contact_id = member_i.member_contact_id
            INNER JOIN email_i ON member_contact.contact_email = email_i.email_id
            WHERE member_id = ?`
        db.query(sql, [sanitizedMemberId(memberId)], (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

const fetchEnablers = async (req, res) => {
    const query = await new Promise((resolve, reject) => {
        // Using parameterized query to prevent SQL injection
        const sql = `
            SELECT member_i.member_id, member_settings.*, email_i.email_address, member_contact.contact_number FROM member_i INNER JOIN member_settings ON member_i.member_setting = member_settings.setting_id INNER JOIN member_contact ON member_i.member_contact_id = member_contact.contact_id INNER JOIN email_i ON member_contact.contact_email = email_i.email_id WHERE member_type = '2' AND member_first_time = 0 AND member_restrict IS NULL AND member_flag = 1`
        db.query(sql, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })

    res.status(200).json(query)
}
const fetchCompanies = async (req, res) => {
    const query = await new Promise((resolve, reject) => {
        // Using parameterized query to prevent SQL injection
        const sql = `
        SELECT member_i.member_id, member_settings.*, email_i.email_address, member_contact.contact_number FROM member_i INNER JOIN member_settings ON member_i.member_setting = member_settings.setting_id INNER JOIN member_contact ON member_i.member_contact_id = member_contact.contact_id INNER JOIN email_i ON member_contact.contact_email = email_i.email_id WHERE member_type = '1' AND member_first_time = 0 AND member_restrict IS NULL AND member_flag = 1`
        db.query(sql, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })

    res.status(200).json(query)
}

const getMemberByEmail = (memberEmail) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM email_i WHERE email_address = ?`
        db.query(sql, [sanitizedMemberId(memberEmail)], (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

const getMemberByAccessKey = (accesskey) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT member_i.member_id FROM member_i WHERE member_accesskey = ?`
        db.query(sql, [sanitizedMemberId(sha256(accesskey))], (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

const fetchMemberByAccessToken = (accessToken) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT 
                    member_i.member_id,
                    member_i.member_first_time,
                    member_settings.setting_address,
                    member_settings.setting_id,
                    member_settings.setting_bio, 
                    member_settings.setting_color,
                    member_settings.setting_coverpic,
                    member_settings.setting_institution,
                    member_settings.setting_profilepic,
                    member_contact.contact_number, 
                    member_contact.contact_facebook, 
                    member_type.user_type,
                    email_i.email_address
                    FROM member_i
                    INNER JOIN member_settings ON member_i.member_setting = member_settings.setting_id
                    INNER JOIN member_type ON member_i.member_type = member_type.user_type_id
                    INNER JOIN member_contact ON member_i.member_contact_id = member_contact.contact_id
                    INNER JOIN email_i ON member_contact.contact_email = email_i.email_id
                    WHERE member_i.member_access = ?`
        db.query(sql, [sha256(sanitizedMemberId(accessToken))], (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

// Reusable to fetch profile details
const getProfileSettings = (settingId) => {
    return new Promise((resolve, reject) => {
        // Using parameterized query to prevent SQL injection
        const sql = `
            SELECT * FROM member_settings WHERE setting_id = ?`
        db.query(sql, [sanitizedMemberId(settingId)], (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

// Controller to get a member by ID
const getMember = async (req, res) => {
    const { member_id } = req.params

    try {
        const result = await getMemberById(member_id)
        if (result.length > 0) {
            return res.json(result)
        } else {
            return res.status(500).json({ error: 'Member does not exist' })
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

// Controller to get a member by Access Token
const fetchProfileByToken = async (req, res) => {
    const { accessToken } = req.params

    try {
        const result = await fetchMemberByAccessToken(accessToken)
        if (result.length > 0) {
            return res.json(result)
        } else {
            console.log(result)
            return res.status(500).json({ error: 'Member does not exist' })
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

// Controller to update user's profile
const updateProfile = async (req, res) => {
    const {
        member_id,
        description,
        contactNumber,
        profilepic,
        coverpic,
    } = req.body

    try {
        const result = await getMemberById(member_id)

        if (result.length > 0) {
            const getSettingsResult = await getProfileSettings(
                result[0].member_setting
            )
            if (getSettingsResult.length > 0) {
                db.beginTransaction((transactionError) => {
                    if (transactionError) {
                        return res.status(500).json({ error: 'Failed to begin transaction' });
                    }
                
                    db.query(
                        'UPDATE member_settings SET setting_bio = ?, setting_datemodified = NOW() WHERE setting_id = ?',
                        [description, result[0].member_setting],
                        (updateError1, updateRes1) => {
                            if (updateError1) {
                                return db.rollback(() => {
                                    res.status(500).json({ error: 'Failed to update profile', error_text: updateError1 });
                                });
                            }
                
                            db.query(
                                'UPDATE member_contact SET contact_number = ? WHERE contact_id = ?',
                                [contactNumber, result[0].member_contact_id],
                                (updateError2, updateRes2) => {
                                    if (updateError2) {
                                        return db.rollback(() => {
                                            res.status(500).json({ error: 'Failed to update contact number', error_text: updateError2 });
                                        });
                                    }
                
                                    db.commit((commitError) => {
                                        if (commitError) {
                                            return db.rollback(() => {
                                                res.status(500).json({ error: 'Failed to commit transaction', error_text: commitError });
                                            });
                                        }
                
                                        res.status(200).json({
                                            message: 'Profile settings and contact updated successfully',
                                        });
                                    });
                                }
                            );
                        }
                    );
                });                
                
            } else {
                return res.send('No Setting ID Set')
            }
        } else {
            return res.status(500).json({ error: 'Member does not exist' })
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

const updateProfilePic = async (req, res) => {
    try {
        const { newProfilePic, id } = req.body;
        db.query('UPDATE member_settings SET setting_profilepic = ? WHERE setting_id = ?', [newProfilePic, id], (err, result) => {
            if (err) {
                console.log(err);
            }

            if (result.affectedRows > 0) {
                return res.json('Profile Pic Updated');
            } else {
                return res.json('Profile Pic Not Updated');
            }
        })
    } catch (error) {
        console.log('error: ', error);
    }
}

const updateCoverPic = async (req, res) => {
    try {
        const { newCoverPic, id } = req.body;
        db.query('UPDATE member_settings SET setting_coverpic = ? WHERE setting_id = ?', [newCoverPic, id], (err, result) => {
            if (err) {
                console.log(err);
            }

            if (result.affectedRows > 0) {
                return res.json('Cover Pic Updated');
            } else {
                return res.json('Cover Pic Not Updated');
            }
        })
    } catch (error) {
        console.log('error: ', error);
    }
}

// Change status of member [Active, Vacation]
const changeStatus = async (req, res) => {
    const { member_id } = req.params

    try {
        // Fetch the current status of the member
        const result = await getMemberById(member_id)

        if (result.length > 0) {
            const settingFetch = await getProfileSettings(
                result[0].member_setting
            )

            // console.log(settingFetch[0].setting_status);

            // // Toggle the status value (1 to 0 and vice versa)
            const newStatus = settingFetch[0].setting_status === 1 ? 0 : 1

            // Update the member status in the database
            db.query(
                'UPDATE member_settings SET setting_status = ? WHERE setting_id = ?',
                [newStatus, settingFetch[0].setting_id],
                (updateError, updateRes) => {
                    if (updateError) {
                        // console.log(updateError);
                        return res
                            .status(500)
                            .json({ error: 'Failed to update member status' })
                    }

                    if (updateRes.affectedRows > 0) {
                        return res.status(200).json({
                            message: 'Member status updated successfully',
                        })
                    } else {
                        return res
                            .status(500)
                            .json({ message: 'Failed to update member status' })
                    }
                }
            )
        } else {
            return res.status(500).json({ error: 'Member does not exist' })
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}

const verifyChangePassword = async (req, res) => {
    const { accesskey } = req.body

    try {
        const convertedAccessKey = sha256(accesskey)
        db.query(
            'SELECT email_i.email_address, member_settings.setting_institution FROM member_i INNER JOIN member_contact ON member_i.member_contact_id = member_contact.contact_email INNER JOIN email_i ON member_contact.contact_email = email_i.email_id LEFT JOIN member_settings ON member_i.member_setting = member_settings.setting_id WHERE member_i.member_accesskey = ?',
            [convertedAccessKey],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ err })
                }

                if (result.length > 0) {
                    const email = result[0].email_address
                    const name = result[0].setting_institution
                    const token = generateToken(32)
                    const convertedToken = sha256(token)

                    // Assuming you have a MySQL connection named `db`
                    // Make sure to replace 'your_table_name' with the actual table name
                    const query =
                        'UPDATE member_i SET member_resetpassword_token = ?, member_resetpassword_token_valid = DATE_ADD(NOW(), INTERVAL 3 HOUR) WHERE member_accesskey = ?'
                    const values = [convertedToken, convertedAccessKey]

                    db.query(query, values, (updateError, updateRes) => {
                        if (updateError) {
                            return res.status(500).json({ error: updateError })
                        }

                        if (updateRes.affectedRows > 0) {
                            // Email notif here
                            axios
                                .post(
                                    `http://localhost:3002/others/forgotPassword`,
                                    {
                                        receiver: email,
                                        name: name,
                                        token: token,
                                    }
                                )
                                .then((response) => {
                                    console.log(
                                        'Response from localhost:3002',
                                        response.data
                                    )
                                    // Add any additional logic here based on the response if needed
                                    return res
                                        .status(200)
                                        .json({ message: 'Email Sent' })
                                })
                                .catch((error) => {
                                    console.error(
                                        'Error making request',
                                        error.message
                                    )
                                    // Handle error
                                    return res.status(500).json({
                                        message: 'Failed to send email',
                                    })
                                })
                        } else {
                            res.status(500).json({
                                result: 'Fields unsuccessfully updated',
                            })
                        }
                    })
                } else {
                    return res
                        .status(200)
                        .json({ message: 'Email cannot be found' })
                }
            }
        )
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: error })
    }
}

// const changePassword = async (req, res) => {
//     const { accesskey, newPassword } = req.body
//     try {
//         const result = await getMemberByAccessKey(accesskey)
//         if (result.length > 0) {
//             const convertedPassword = await bcryptConverter(newPassword)
//             db.query(
//                 'UPDATE member_i SET member_password = ? WHERE member_id = ?',
//                 [convertedPassword, result[0].member_id],
//                 (updateError, updateRes) => {
//                     if (updateError) {
//                         // console.log(updateError);
//                         return res
//                             .status(500)
//                             .json({ error: 'Failed to change password' })
//                     }

//                     if (updateRes.affectedRows > 0) {
//                         return res
//                             .status(200)
//                             .json({ message: 'Password Changed Successfully' })
//                     } else {
//                         return res
//                             .status(500)
//                             .json({ message: 'Failed to change password' })
//                     }
//                 }
//             )
//         } else {
//             return res.status(500).json({ invalid: 'No user exist' })
//         }
//     } catch (error) {
//         console.log(error)
//         return res.status(500).json({ error: error })
//     }
// }

module.exports = {
    getMember,
    fetchProfileByToken,
    updateProfile,
    changeStatus,
    fetchEnablers,
    fetchCompanies,
    updateProfilePic,
    updateCoverPic
}

// Task: 11/15/2023
// Get Profile Details ✅
// Update Profile Details ✅
// Vacation Mode - Deaactivation / Change visibility ✅

// Task: 12/22/2023
// Create a modular function for checking if email exists in application_i ✅

//INNER JOIN member_type ON member_i.member_type = member_type.user_type_id
// INNER JOIN member_settings ON member_i.member_setting = member_settings.setting_id
// INNER JOIN member_contact ON member_i.member_contact_id = member_contact.contact_id
