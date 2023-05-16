const nodeMailer = require('nodemailer')

const logger = './log'

function sendEmail(options) {
    const transporter = nodeMailer.createTransport({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT,
        secure: false,
        auth: {
            user: process.env.MAIL_USERNAME,
            pass: process.env.MAIL_PASSWORD,
        },
    })

    if (process.env.SEND_MAIL) {
        transporter.sendMail(options, (error, info) => {
            logger.log('sendEmail -- ', info)
            logger.error('sendEmail -- ', error)
        })
    }
}

module.exports = sendEmail
