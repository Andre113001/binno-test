const mailOptionsMiddleware = (receiver, subject, content) => ({
    from: 'startwithbinno@gmail.com',
    to: receiver, // This should be a valid email address
    subject: subject,
    html: content,
    headers: {
        'Content-Type': 'text/html',
    },
});

module.exports = mailOptionsMiddleware;
