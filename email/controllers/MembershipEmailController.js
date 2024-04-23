const path = require('path');
const ejs = require('ejs');
const mailOptionsMiddleware = require('../middlewares/mailOptionsMiddleware');
const db = require('../database/db');

const approved = async (req, res) => {
    const { receiver, name, accesskey, tmpPassword  } = req.body;
    const subject = "Congratulations!"
    try {
        const templatePath = path.join(__dirname, '../views/MemberApplication/approved.ejs');
        ejs.renderFile(templatePath, { name, accesskey, tmpPassword }, (err, data) => {
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

const declined = async (req, res) => {
    const { receiver, name, reason } = req.body;
    const subject = "Application Declined for BiNNO Platform"
    try {
        const templatePath = path.join(__dirname, '../views/MemberApplication/reject.ejs');
        ejs.renderFile(templatePath, { name, reason }, (err, data) => {
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
}

const ongoing = async (req, res) => {
    const {email} = req.params;
    const receiver = email;
    const subject = "Process Ongoing..."
    try {
        const templatePath = path.join(__dirname, '../views/MemberApplication/ongoing.ejs');
        await ejs.renderFile(templatePath, { receiver }, (err, data) => {
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
    };
};

const interviewZoom = async (req, res) => {
    const { receiver, zoomLink, timeOfInterview, username, timeIn, timeOut } = req.body;

    const subject = "Zoom Interview"
    try {
        const data = {
            receiver: receiver,
            timeOfInterview: timeOfInterview,
            zoomLink: zoomLink,
            username: username,
            timeIn: timeIn,
            timeOut: timeOut
        }

        console.log(data);

        const templatePath = path.join(__dirname, '../views/MemberApplication/interviewZoom.ejs');
        ejs.renderFile(templatePath, data, (err, data) => {
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
    };
};

const interviewF2f = async (req, res) => {
    const { receiver, timeOfInterview, username, timeIn, timeOut } = req.body;

    const subject = "Face-to-Face Interview"
    try {
        const data = {
            receiver: receiver,
            timeOfInterview: timeOfInterview,
            username: username,
            timeIn: timeIn,
            timeOut: timeOut
        }

        // console.log(data);

        const templatePath = path.join(__dirname, '../views/MemberApplication/interviewF2F.ejs');
        ejs.renderFile(templatePath, data, (err, data) => {
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
    };
};

module.exports = {
    approved,
    ongoing,
    interviewZoom,
    interviewF2f,
    declined
};
