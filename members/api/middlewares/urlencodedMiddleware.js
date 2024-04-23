const express = require('express');

const urlencodedMiddleware = express.urlencoded({ extended: false, limit: '50mb' });

module.exports = urlencodedMiddleware;