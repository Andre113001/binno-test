const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'startwithbinno@gmail.com',
        pass: 'ksclipkoympevnpk'
    },
});

module.exports = transporter;
