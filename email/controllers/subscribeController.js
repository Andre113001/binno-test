const path = require('path');
const ejs = require('ejs');
const mailOptionsMiddleware = require('../middlewares/mailOptionsMiddleware');


const add = async (req, res) => {
    const { receiver } = req.body;

    try {
        const subject = "Subscribed to BiNNO Newsletter!"
        const link = `https://member.binnostartup.site/subscribe/${receiver}`

        const templatePath = path.join(__dirname, '../views/Newsletter/Subscribe/add.ejs');
        ejs.renderFile(templatePath, { receiver, link }, (err, data) => {
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

const exist = async (req, res) => {
    const { receiver } = req.body;

    try {
        const subject = "Already Subscribed to BiNNO Newsletter!"

        const templatePath = path.join(__dirname, '../views/Newsletter/Subscribe/exist.ejs');
        ejs.renderFile(templatePath, { receiver }, (err, data) => {
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
    add,
    exist
}