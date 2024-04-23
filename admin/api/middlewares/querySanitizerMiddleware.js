const validator = require('validator');

const querySanitizerMiddleware = (input) => {
    return validator.escape(String(input));
};

module.exports = querySanitizerMiddleware;