const db = require('../../database/db')

//Middlewares
const sanitizeId = require('../middlewares/querySanitizerMiddleware')
const uniqueId = require('../middlewares/uniqueIdGeneratorMiddleware')
const { updateMemberStat } = require('../middlewares/memberStatUpdater');
const { generateAndHash, hashToSHA256, hashToBcrypt } = require('../middlewares/randomGenerator')
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')
const axios = require('axios');

const uploadDocuments = async (req, res) => {
    try {
        // Assuming you have the applicationId available in your request or somewhere
        const { id, email, institution, address, type, classification } =
            req.body // Replace with your logic to get the applicationId

        // Path to the destination folder
        const destinationFolder = `./private/docs/application/${id}`

        // Create the destination folder if it doesn't exist
        if (!fs.existsSync(destinationFolder)) {
            fs.mkdirSync(destinationFolder, { recursive: true })
        }

        // Process each uploaded file
        req.files.forEach((file, index) => {
            const originalName = file.originalname
            const ext = path.extname(originalName)

            // Generate a new file name based on the applicationId
            const newFileName = `${String(id)}_${index + 1}${String(ext)}`

            // Move the file to the destination folder
            fs.writeFileSync(
                path.join(destinationFolder, newFileName),
                file.buffer
            )
        })

        // Insert into the database after files have been successfully uploaded
        db.query(
            'INSERT INTO application_i (app_id, app_dateadded, app_institution, app_email, app_address, app_type, app_class, app_docs_path) VALUES (?, NOW(), ?, ?, ?, ?, ?, ?)',
            [
                id,
                institution,
                email,
                address,
                type,
                classification,
                destinationFolder,
            ],
            (insertError, insertResult) => {
                if (insertResult.affectedRows > 0) {
                    return res.json({ result: true })
                } else {
                    return res.json({ result: false })
                }
            }
        )
    } catch (error) {
        console.error('Error uploading documents:', error)
        return res.status(500).json({ error: 'Internal Server Error' })
    }
}

const getApplications = async (req, res) => {
    try {
        const apps = await new Promise((resolve, reject) => {
            db.query(`SELECT * FROM application_i ORDER BY app_dateadded ASC`, (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })

        return res.status(200).json(apps)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
const getApplicationUploads = async (req, res) => {
    const { appId } = req.params

    const appDocsPath = path.resolve(`./private/docs/application/${appId}`)

    // Check if the directory exists
    if (fs.existsSync(appDocsPath) && fs.statSync(appDocsPath).isDirectory()) {
        // Read the contents of the directory
        fs.readdir(appDocsPath, (err, files) => {
            if (err) {
                console.error('Error reading directory:', err)
                res.status(500).send('Internal Server Error')
                return
            }

            // Send the list of files as a response
            res.json({ files })
        })
    } else {
        // Directory not found
        res.status(404).send('Directory not found')
    }
}

const getImageBlob = (imagePath) => {
    return fs.readFileSync(imagePath)
}

const getFile = async (req, res) => {
    const { appId, fileName } = req.params;
    const appDocsPath = path.resolve('./private/docs/application');
    const filePath = path.join(appDocsPath, appId, fileName);

    const mimeType = mime.lookup(fileName);

    if (mimeType) {
        if (mimeType.includes('image')) {
            const img = getImageBlob(filePath);
            res.send(img);
        } else if (mimeType.includes('pdf')) {
            if (fs.existsSync(filePath)) {
                res.contentType('application/pdf');
                
                // Set Content-Disposition header to inline
                res.setHeader('Content-Disposition', 'inline');
                
                res.sendFile(filePath);
            } else {
                // File not found
                res.status(404).send('File not found');
            }
        } else {
            // Unsupported file type
            res.status(400).send('Unsupported file type');
        }
    } else {
        // Unable to determine MIME type
        res.status(400).send('Unable to determine file type');
    }
};


const getApplicationDetails = async (req, res) => {
    const { appId } = req.params

    try {
        const app = await new Promise((resolve, reject) => {
            db.query(
                `SELECT * FROM application_i WHERE app_id = ?`,
                [appId],
                (err, data) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(data[0])
                    }
                }
            )
        })
        
        const app_path = path.join(
            __dirname,
            `../../private/docs/application/${app.app_docs_path}`
        )

        // Get the list of files in the directory
        const files = fs.readdirSync(app_path);

        // Read file contents as buffers
        const fileData = files.map((file) => {
            const filePath = path.join(app_path, file);
            const fileContent = fs.readFileSync(filePath);
            return {
                name: file,
                data: fileContent,
            };
        });

        // Add the file data to the response object
        app.files = fileData;

        return res.status(200).json(app);

    } catch (error) {
        console.error('Error fetching image:', error)
        res.status(500).send('Internal Server Error')
    }
}


const deleteFolderRecursive = (folderPath) => {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // Recursively delete subdirectories
                deleteFolderRecursive(curPath);
            } else {
                // Delete files
                fs.unlinkSync(curPath);
            }
        });
        // After deleting all files and subdirectories, delete the directory itself
        fs.rmdirSync(folderPath);
        console.log(`Deleted folder: ${folderPath}`);
    }
};

const setApprovalStatus = async (req, res) => {
    const { appId, approve, reason } = req.body

    try {
        const result = await new Promise((resolve, reject) => {
            db.query(`SELECT * FROM application_i WHERE app_id = ?`, [appId], (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data[0]);
                }
            });
        });

        if (result && Object.keys(result).length > 0) {
            const ak = uniqueId.accessKeyGenerator();

            if (!approve) {
                const approvalStatus = await axios.post(`${process.env.EMAIL_DOMAIN}/membership/declined`, {
                    receiver: result.app_email,
                    name: result.app_institution,
                    reason: reason
                })

                if (approvalStatus.status === 200) {
                    const folderPath = path.join(__dirname, '../../' , result.app_docs_path);

                    // console.log("Folder path: ", folderPath);

                    if (fs.existsSync(folderPath)) {
                        try {
                            deleteFolderRecursive(folderPath)

                            db.query(`DELETE FROM schedule_i WHERE sched_appid = ?`, [result.app_id], (err, result) => {
                                if (err) {
                                    console.log(err);
                                }
                            })

                            db.query(
                                `DELETE FROM application_i WHERE app_id = ?`,
                                [appId],
                                (err, data) => {
                                    if (err) {
                                        res.json("ERROR: ", err)
                                    } 
        
                                    if (data.affectedRows > 0) {
                                        return res.json(true);
                                    }
                                }
                            );

                        } catch (error) {
                            console.log("Folder Deletion Error: ", error);
                        }
                    } else {
                        res.json({filepath: false})
                    }
                    
                } else {
                    return res.json(false);
                }

            } else {
                const approvalStatus = await axios.post(`${process.env.EMAIL_DOMAIN}/membership/approved`, {
                    receiver: result.app_email,
                    name: result.app_institution,
                    accesskey: ak,
                    tmpPassword: ak
                });
                
                if (approvalStatus.status === 200) {
                    let app_id = result.app_id;
                    let email = result.app_email;
                    let app_institution = result.app_institution;
                    let access_key = '';
                    let member_password = '';
                    
                    db.query(
                        `INSERT INTO email_i (email_id, email_datecreated, email_address, email_user_type, email_subscribe, email_flag) VALUES ('${app_id}', NOW(), '${email}', 'member' ,'1', '1')`
                    );
                
                    db.query(
                        `INSERT INTO member_contact (contact_id, contact_datecreated, contact_email) VALUES ('${app_id}', NOW(), '${app_id}')`
                    );
                
                    db.query(
                        `INSERT INTO member_settings (setting_id, setting_institution, setting_datecreated, setting_address, setting_memberId) VALUES (?, ?, NOW(), ?, ?)`,
                        [app_id, app_institution, result.app_address, app_id], (err, insertResult) => {
                            if (err) {
                                console.error(err);
                            }
                        }
                    );

                    const membertype = result.app_type === 'Enabler' ? 2 : 1;
                    

                    const hashedAK = hashToSHA256(ak);
                    const hashedTmp = await hashToBcrypt(ak);

                    
                    console.log({
                        hashedAK: hashedAK,
                        hashedTmp: hashedTmp,
                        membertype: membertype
                    });

                    db.query(
                        `INSERT INTO member_i (member_id, member_type, member_datecreated, member_contact_id, member_setting, member_accesskey, member_password) VALUES (?, ?, NOW(), ?, ?, ?, ?)`,
                        [
                            app_id,
                            membertype,
                            app_id,
                            app_id,
                            hashedAK,
                            hashedTmp,
                        ], (err, insertResult) => {
                            if (err) {
                                console.error(err);
                                return res.json(false);
                            } 

                            if (insertResult.affectedRows > 0) {
                                
                                db.query(
                                    `DELETE FROM application_i WHERE app_id = ?`,
                                    [appId]
                                );
                                
                                deleteFolderRecursive(result.app_docs_path);
                                updateMemberStat(result.app_type);

                                return res.json(true);
                            } else {
                                console.error(err);
                            }
                        }
                    );

                
                
                } else {
                    res.json('email sent approved');
                }                
            }
        } else {
            return res.json("No Application Found");
        }
    } catch (error) {
        console.log("setApprovalStatus Error:", error);
    }
}


const fetchApplicationById = async (req, res) => {
    const { appId } = req.params;

    try {
        db.query('SELECT * FROM application_i WHERE app_id = ?', [sanitizeId(appId)], (err, result) => {
            if (result.length > 0) {
                res.json(result);
            } else {
                res.json('No application found');
            }
        }) 
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: error })
    }
}

module.exports = {
    uploadDocuments,
    getApplications,
    getApplicationDetails,
    setApprovalStatus,
    getApplicationUploads,
    getFile,
    fetchApplicationById,
}
