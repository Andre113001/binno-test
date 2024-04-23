const path = require('path');
const ejs = require('ejs');
const mailOptionsMiddleware = require('../middlewares/mailOptionsMiddleware');


const forgotpassword = async(req, res) => {
    const { receiver, name, token  } = req.body;
    const subject = "Change Password"
    try {
        const templatePath = path.join(__dirname, '../views/Others/forgotPassword.ejs');
        await ejs.renderFile(templatePath, { name, token }, (err, data) => {
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

const twoAuth = async(req, res) => {
    const {receiver, otp} = req.body;
    const subject = "Attempting to log-in";
    try {
        const templatePath = path.join(__dirname, '../views/Others/twoAuth.ejs');
        await ejs.renderFile(templatePath, { otp }, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).json(err);
            } else {
                const mailOptions = mailOptionsMiddleware(receiver, subject, data);

                req.transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Email sending error:', error);
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
    forgotpassword,
    twoAuth
}