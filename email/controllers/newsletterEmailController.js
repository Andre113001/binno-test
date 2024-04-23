// On each content or paragraph it must limit the words to 90

const path = require('path');
const ejs = require('ejs');
const mailOptionsMiddleware = require('../middlewares/mailOptionsMiddleware');
const { Agent } = require('https');
const db = require('../database/db');

const subject = `BiNNO Newsletter`;

function getCurrentDateInPhilippines() {
    const currentDate = new Date();
    
    // Set the time zone to Asia/Manila (Philippines)
    const options = {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };

    return currentDate.toLocaleString('en-PH', options);
}
const publishedDate = getCurrentDateInPhilippines();

const blogNewsletter = async(req, res) => {
    const {receiver, memberName, image, heading, content, blogId} = req.body;
    
    try {
        const templatePath = path.join(__dirname, '../views/Newsletter/blog.ejs');
        ejs.renderFile(templatePath, { memberName, image, heading, content, publishedDate, blogId }, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).json(err);
            } else {
                const mailOptions = mailOptionsMiddleware(receiver, subject, data);

                req.transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.error(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                        res.status(200).json(info.response);
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
};

const eventNewsletter = async(req, res) => {
    const {receiver, memberName, image, heading, content, date, eventId} = req.body;

    try {
        const templatePath = path.join(__dirname, '../views/Newsletter/event.ejs');
        await ejs.renderFile(templatePath, { memberName, image, heading, content, publishedDate, date, eventId }, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).json(err);
            } else {
                const mailOptions = mailOptionsMiddleware(receiver, subject, data);

                req.transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.error(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                        res.status(200).json(info.response);
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
};

const guidesNewsletter = async(req, res) => {
    const {receiver, memberName, image, heading, content, guideId} = req.body;

    try {
        const templatePath = path.join(__dirname, '../views/Newsletter/guide.ejs');
        await ejs.renderFile(templatePath, { memberName, image, heading, content, publishedDate, guideId }, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).json(err);
            } else {
                const mailOptions = mailOptionsMiddleware(receiver, subject, data);

                req.transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.error(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                        res.status(200).json(info.response);
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
};

const postNewsletter = async(req, res) => {
    const {receiver, memberName, image, content, postId} = req.body;
    
    try {
        const templatePath = path.join(__dirname, '../views/Newsletter/post.ejs');
        await ejs.renderFile(templatePath, { memberName, image, content, publishedDate, postId }, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).json(err);
            } else {
                const mailOptions = mailOptionsMiddleware(receiver, subject, data);

                req.transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.error(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                        res.status(200).json(info.response);
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
    
};

const sendNewsletter = async (req, res, receiver, username, type, title, imgSource, details, link, emailId) => {
    const subject = "BiNNO Newsletter";

    try {
        const templatePath = path.join(__dirname, '../views/Newsletter/newsletter.ejs');
        await ejs.renderFile(templatePath, { username, type, title, imgSource, details, link, emailId }, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).json(err);
            } else {
                const mailOptions = mailOptionsMiddleware(receiver, subject, data);

                req.transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.error(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                        res.status(200).json(info.response);
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
        res.status(500).json(error);
    }
};

const newsletter_basic = async (req, res) => {
    const { type, title, img, username, details, contentId } = req.body;
    // Change the link from 217... to binnostartup.site plus change the link according to type
    try {
        db.query("SELECT email_address, email_id from email_i WHERE email_subscribe = 1", [], async (err, result) => {
            if (err) {
                res.json({ error: err });
            } else {
                // Extract email addresses and create an array
                const emailAddresses = result.map(row => row.email_address);

                const email_ids = result.map(row => row.email_id);

                if (emailAddresses.length > 0) {
                    try {
                        const sentEmails = [];

                        for (let i = 0; i < emailAddresses.length; i++) {
                            const emailAddress = emailAddresses[i];
                            const email_id = email_ids[i];

                            try {
                                const sent = await sendNewsletter(req, res, emailAddress, username, type, title, `https://binnostartup.site/m/api/images?filePath=${img}`, details, `http://binnostartup.site/m/api/${type}/${contentId}`, email_id);
                                sentEmails.push(sent);
                            } catch (error) {
                                // Handle errors for individual emails
                                console.error(error);
                            }
                        }

                        res.json({ success: true });
                    } catch (error) {
                        res.status(500).json({ error: error.message });
                    }
                } else {
                    res.json({ result: "No subscribed yet" });
                }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    blogNewsletter,
    eventNewsletter,
    guidesNewsletter,
    postNewsletter,
    newsletter_basic
}