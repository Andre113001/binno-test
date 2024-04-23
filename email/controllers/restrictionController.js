const path = require('path');
const ejs = require('ejs');
const mailOptionsMiddleware = require('../middlewares/mailOptionsMiddleware');

const restrict = async (req, res) => {
    const { receiver, memberName, duration } = req.body;
    const subject = "Notice of Platform Membership Restriction"
    try {
        const templatePath = path.join(__dirname, '../views/admin/restriction/restrict.ejs');
        ejs.renderFile(templatePath, { memberName, duration }, (err, data) => {
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

const remove = async (req, res) => {
    const { receiver, memberName } = req.body;
    const subject = "Notice of Platform Membership Termination"
    try {
        const templatePath = path.join(__dirname, '../views/admin/restriction/removed.ejs');
        ejs.renderFile(templatePath, { memberName }, (err, data) => {
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

const uplift = async (req, res) => {
    const { receiver, memberName } = req.body;
    const subject = "Uplift of Platform Membership Restriction"
    try {
        const templatePath = path.join(__dirname, '../views/admin/restriction/uplift.ejs');
        ejs.renderFile(templatePath, { memberName  }, (err, data) => {
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

const recover = async (req, res) => {
    const { receiver, memberName } = req.body;
    const subject = "Welcome Back! Account Recovery Successful"
    try {
        const templatePath = path.join(__dirname, '../views/admin/restriction/recover.ejs');
        ejs.renderFile(templatePath, { memberName  }, (err, data) => {
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

module.exports = {
    restrict,
    remove,
    uplift,
    recover
}