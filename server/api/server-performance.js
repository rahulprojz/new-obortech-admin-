const { alertForAdmin, adminEmails } = require('../../utils/alertHelpers')
const express = require('express')
const basicAuth = require('express-basic-auth')
const { prepareEmailBody } = require('../helpers/email-helper')
const db = require('../models')
const emailSender = require('../services/sendMail')
const string = require('../helpers/LanguageHelper')
const statusCode = require('../../utils/statusCodes')
const { getLanguageJson } = require('../utils/globalHelpers')

const { MAIL_EMAIL_ID, SITE_URL } = process.env
const serverPerformance = db.server_performance
const router = express.Router()

function myAuthorizer(username, password) {
    const userMatches = basicAuth.safeCompare(username, process.env.BASIC_AUTH_USERNAME || 'admin')
    const passwordMatches = basicAuth.safeCompare(password, process.env.BASIC_AUTH_PASSWORD || 'adminPassword')
    return userMatches && passwordMatches
}

router.post('/add-email', async (req, res) => {
    const { emails } = req.body

    if (!Array.isArray(emails)) {
        res.json({ error: string.statusResponses.serverPerformance })
    }

    const emailArray = []
    emails.map((email) => emailArray.push({ email }))

    serverPerformance
        .bulkCreate(emailArray, { returning: true })
        .then((data) => {
            res.json(data)
        })
        .catch((err) => {
            res.json({ error: err.message || err.toString() })
        })
})

router.use(basicAuth({ authorizer: myAuthorizer }))

router.post('/alert-email', async (req, res) => {
    try {
        const { alerts } = req.body
        const emails = await serverPerformance.findAll({
            attributes: ['email'],
        })
        const languageJson = await getLanguageJson('en')
        const emailList = emails.map(({ email }) => email)

        alerts.forEach((alertData) => {
            const replacements = {
                URL: SITE_URL,
                alert: alertData.labels.alertname,
                description: alertData.annotations.description,
                isResolved: alertData.status === 'resolved',
                resolvedTime: languageJson.emailContent.resolvedTime,
                resolved: languageJson.emailContent.resolved,
                oborInfo: languageJson.emailContent.oborInfo,
            }
            const shouldGoToAdmin = alertForAdmin.find((alert) => alert === replacements.alert)
            const htmlToSend = prepareEmailBody('email', 'server-alerts-mailv2', replacements)
            const message = {
                from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
                to: 'cclalertemails@gmail.com',
                bcc: shouldGoToAdmin ? adminEmails : emailList,
                subject: `Incident - ${alertData.status === 'resolved' ? 'Resolved ' : `${alertData.annotations ? alertData.annotations.summary : ''}`} on ${SITE_URL}`,
                html: htmlToSend,
            }
            emailSender.sendMail(message)
        })

        res.status(statusCode.successData.code).json({
            code: statusCode.successData.code,
            message: statusCode.successData.message,
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
