const db = require('../../database/db')

//Middlewares
const sanitizeId = require('../middlewares/querySanitizerMiddleware')
const uniqueId = require('../middlewares/uniqueIdGeneratorMiddleware')
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const jwt = require('jsonwebtoken')

const getMemberByEmail = (memberEmail) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM email_i WHERE email_address = ?`
        db.query(sql, [sanitizeId(memberEmail)], (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    })
}

const applicationChecker = (email, name) => {
    return new Promise((resolve, reject) => {
        // Using parameterized query to prevent SQL injection
        const sql =
            'SELECT * FROM application_i WHERE app_email = ? OR app_institution = ?'
        db.query(sql, [email, name], (err, data) => {
            if (err) {
                resolve(false)
            } else {
                db.query(
                    'SELECT setting_institution FROM setting_i WHERE setting_institution = ?',
                    [name],
                    (err, data) => {
                        if (err) {
                            resolve(false)
                        } else {
                            resolve(true)
                        }
                    }
                )
            }
        })
    })
}

const account_application = async (req, res) => {
    const { email, institution, address, type, classification } = req.body

    const id = uniqueId.appId_generator()

    try {
        // Check if email already exist in the database
        const result = await getMemberByEmail(email)
        if (result.length > 0) {
            return res.json({
                result: 'Sorry you are already registered to the platform',
            })
        } else {
            // Check if email is under processing in application
            db.query(
                'SELECT app_email, app_institution FROM application_i WHERE app_email = ? OR app_institution = ?',
                [email, institution],
                (EmailError, EmailResult) => {
                    // this must be modular
                    if (EmailError) {
                        // console.log(updateError);
                        return res.status(500).json({
                            error: 'Failed to retrieve Email from application',
                        })
                    }

                    if (EmailResult.length > 0) {
                        return res.json({ result: 'processing' })
                        
                    } else {
                        return res.json({ appId: id })
                    }
                }
            )
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: error })
    }
}


const upload_documents = async(req, res) => {
    const { email, institution, address, type, classification, id } = req.body

    const tokenPayload = {
        userId: id,
        userEmail: email,
        // You can include additional information in the token payload
    }
    const tokenExpiration = 3 * 24 * 60 * 60 // 3 days in seconds
    const token = jwt.sign(
        tokenPayload,
        process.env.SECRET_KEY,
        { expiresIn: tokenExpiration }
    )

    // Calculate the date 3 days from now
    const currentDate = new Date()
    const expirationDate = new Date(
        currentDate.getTime() + 3 * 24 * 60 * 60 * 1000
    ) // 3 days in milliseconds

    db.query(
        'INSERT INTO application_i (app_id, app_institution, app_email, app_address, app_type, app_class, app_dateadded, app_token, app_token_valid) VALUES (?,?,?,?,?,?, NOW(), ?, ?)',
        [
            id,
            institution,
            email,
            address,
            type,
            classification,
            token,
            expirationDate,
        ],
        (insertError, insertResult) => {
            if (insertResult.affectedRows > 0) {
                return res
                    .status(201)
                    .json({ message: 'Application added' })
            } else {
                return res
                    .status(500)
                    .json({ error: 'Failed to apply' })
            }
        }
    )
}



module.exports = {
    account_application,
    upload_documents,
}
