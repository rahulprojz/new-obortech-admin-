// Load dependencies
const nodemailer = require('nodemailer')

// configure mailer
const emailSender = nodemailer.createTransport({
    host: process.env.MAIL_HOST_NAME,
    port: process.env.MAIL_PORT_NO,
    secure: process.env.MAIL_SECURE,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
})

module.exports = emailSender
