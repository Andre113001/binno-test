const crypto = require('crypto');

const generateToken = (length) => {
    const token = crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') // Convert to hexadecimal format
        .slice(0, length); // Trim to desired length

    return token;
};

module.exports = generateToken;