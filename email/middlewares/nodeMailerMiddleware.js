const transporter = require('./transporterMiddleware');

const nodemailerMiddleware = (req, res, next) => {
    req.transporter = transporter;
    next();
};

module.exports = nodemailerMiddleware;
