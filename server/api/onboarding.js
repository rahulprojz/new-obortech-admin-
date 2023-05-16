// Load dependencies
const express = require('express')
const multipart = require('connect-multiparty')
const md5 = require('md5')
const statusCode = require('../../utils/statusCodes')
const networkHooks = require('../hooks/network-hooks')
const cipher = require('../../utils/encrypt')
const emailSender = require('../services/sendMail')
const { prepareEmailBody } = require('../helpers/email-helper')
const db = require('../models')
const string = require('../helpers/LanguageHelper')
const { getLanguageJson } = require('../utils/globalHelpers')
const { sendWelcomeEmail } = require('../utils/emailHelpers')

const User = db.users
const Invitation = db.invitation

const UserGithubDetails = db.user_github_details
const router = express.Router()
const multipartMiddleware = multipart({ maxFieldsSize: 300000000 })

// EMAIL & OTHER CONFIGURATIONS
const { CIPHER_SALT } = process.env
const { MAIL_EMAIL_ID } = process.env
const { SITE_URL } = process.env

// Check for existing email
router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body
        const existingUser = await User.findOne({
            attributes: ['id'],
            where: { email, isDeleted: 0 },
        })

        if (existingUser) {
            res.status(200).json({ code: 400 })
        } else {
            res.status(200).json({ code: 200 })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Check for existing mobile
router.post('/check-mobile', async (req, res) => {
    try {
        const { mobile, country_code } = req.body
        const existingUser = await User.findOne({
            attributes: ['id'],
            where: { mobile, country_code, isDeleted: 0 },
        })

        if (existingUser) {
            res.status(200).json({ code: 400 })
        } else {
            res.status(200).json({ code: 200 })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Check for existing unique_id
router.post('/check-unique-id', async (req, res) => {
    try {
        const { unique_id } = req.body
        const existingUser = await User.findOne({
            attributes: ['id'],
            where: { unique_id, isDeleted: 0 },
        })

        if (existingUser) {
            res.status(200).json({ code: 400 })
        } else {
            res.status(200).json({ code: 200 })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add User
router.post('/addUser', async (req, res) => {
    try {
        const orgUsers = await User.findAll({
            where: {
                organization_id: req.body.org_id,
                isDeleted: 0,
            },
        })
        let user_role = process.env.ROLE_CEO
        if (orgUsers.length > 0) {
            user_role = process.env.ROLE_USER
        }

        const userData = await User.create({
            organization_id: req.body.org_id,
            role_id: user_role,
            registration_number: req.body.registration_number || null,
            email: req.body.email,
            country_code: req.body.country_code,
            mobile: req.body.mobile,
            title_id: req.body.title_id,
            first_name: req.body.first_name,
            local_first_name: req.body.local_first_name || '',
            local_last_name: req.body.local_last_name || '',
            last_name: req.body.last_name,
            password: md5(req.body.password),
            username: req.body.username,
            unique_id: req.body.uniq_id,
            status: 1,
            is_mvs_verified: !!req.body.is_mvs_verified,
            language: req.body.language,
            country_id: req.body.country_id,
            state_id: req.body.state_id,
            city_id: req.body.city_id,
            added_to_network: 0,
        })
        if (userData.id && req.body.githubUsername && req.body.githubToken) {
            await UserGithubDetails.create({ user_id: userData.id, username: req.body.githubUsername, token: req.body.githubToken, status: '' })
        }

        if (req.body.email) {
            await Invitation.destroy({ where: { email: req.body.email } })
            await sendWelcomeEmail(req.body.email, req.body.language)
        }

        if (userData) {
            res.status(200).json({
                code: statusCode.successData.code,
                data: {
                    userData,
                    message: string.apiResponses.orgCreateAndUserLinked,
                },
                message: statusCode.successData.message,
            })
        } else {
            res.status(400).json({
                code: statusCode.emptyData.code,
                data: {
                    message: string.apiResponses.FailToOrgCreateAndUserLink,
                },
                message: statusCode.emptyData.message,
            })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// send mail api
router.post('/verify/email', async (req, res) => {
    const { emailId, mobile, numVerified, country_code, invitedBy, language } = req.body
    const code = JSON.stringify({
        id: emailId,
        mobile,
        numVerified,
        idVerified: true,
        country_code,
        invitedBy,
        language,
    })

    const languageJson = await getLanguageJson(language)

    // To create a cipher
    const encoder = cipher(CIPHER_SALT)
    const verificationLink = `${SITE_URL}/login?email=${encoder(code)}`
    const replacements = {
        verificationLink,
        email: emailId,
        URL: SITE_URL,
        verifyEmailToActivateAccount: languageJson.emailContent.verifyEmailToActivateAccount,
        confirmEmail: languageJson.emailContent.confirmEmail,
        copyPasteLink: languageJson.emailContent.copyPasteLink,
        oborInfo: languageJson.emailContent.oborInfo,
    }
    const htmlToSend = prepareEmailBody('email', 'activate-your-account', replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: emailId,
        subject: languageJson.emailVerificationSubject,
        html: htmlToSend,
    }

    emailSender.sendMail(message, function (err, info) {
        if (err) {
            res.status(200).json({ code: 201, message: statusCode.notFound.message, data: err })
        } else {
            res.status(200).json({ code: 200, message: statusCode.successData.message, data: info })
        }
    })
})

// Upload document on IPFS Network
router.post('/upload-document', async (req, res) => {
    try {
        const updateReq = await networkHooks.useAdminUser(req)
        const response = await networkHooks.uploadDocument('document/add', updateReq)
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Create onboarding request
router.post('/create-onboarding-request', async (req, res) => {
    try {
        const updateReq = await networkHooks.useAdminUser(req)
        const response = await networkHooks.callNetworkApi('orgOnboarding/create-onboarding-request', 'POST', updateReq.body)
        res.json(response)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

module.exports = router
