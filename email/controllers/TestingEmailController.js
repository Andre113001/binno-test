const path = require('path');
const ejs = require('ejs');
const mailOptionsMiddleware = require('../middlewares/mailOptionsMiddleware');
const transporterMiddleware = require('../middlewares/transporterMiddleware');

const testing = async (req, res) => {
    const { receiver , reasonOfRejection, nameOfRecipient } = req.body; // change mo nalng required fields
    const subject = "New Guide Notification" // change mo nalng title
    console.log(req)
    try {
        const templatePath = path.join(__dirname, '../views/MemberApplication/reject.ejs'); // change mo nalang directory san ejs
        await ejs.renderFile(templatePath, { receiver, reasonOfRejection, nameOfRecipient}, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).json(err);
            } else {
                const mailOptions = mailOptionsMiddleware(receiver, subject, data);

                transporterMiddleware.sendMail(mailOptions, (error, info) => {
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

module.exports = testing;