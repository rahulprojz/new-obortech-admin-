const fs = require('fs')
const path = require('path')
const handlebars = require('handlebars')
const emailSender = require('../services/sendMail')
const { getLanguageJson } = require('../utils/globalHelpers')
const db = require('../models')

const User = db.users

const { MAIL_EMAIL_ID } = process.env
const { SITE_URL } = process.env

// Send email when account is approved
const sendApprovalEmail = async (emailId, language, username = false, transactionPassword = null) => {
    const languageJson = await getLanguageJson(language)

    const replacements = {
        URL: SITE_URL,
        welcome: languageJson.emailContent.welcome,
        accountApproved: languageJson.emailContent.accountApproved,
        linkText: languageJson.emailContent.notSeeLog,
        loginHere: languageJson.emailContent.loginHere,
        hi: languageJson.emailContent.hi,
        oborInfo: languageJson.emailContent.oborInfo,
        yourUsername: languageJson.emailContent.yourUsername,
        username,
        yourTransactionPassword: languageJson.emailContent.yourTransactionPassword,
        transactionPassword,
    }
    const htmlToSend = prepareEmailBody('email', 'account-is-approved', replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: emailId,
        subject: languageJson.accountActicationSubject,
        html: htmlToSend,
    }

    emailSender.sendMail(message, function (err, info) {
        if (err) {
            console.log(err)
            return false
        }
    })

    return true
}

const sendViewProfileEmail = async (emailId, language, username, rUsername) => {
    const languageJson = await getLanguageJson(language)

    const replacements = {
        URL: SITE_URL,
        user_message: languageJson.emailContent.userViewMessage,
        user: username,
        receiverUser: rUsername,
        oborInfo: languageJson.emailContent.oborInfo,
        hi: languageJson.emailContent.hi,
    }
    const htmlToSend = prepareEmailBody('email', 'user-profile-view-mail', replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: emailId,
        subject: languageJson.kycViewedSubject,
        html: htmlToSend,
    }

    emailSender.sendMail(message, function (err, info) {
        if (err) {
            console.log(err)
            return false
        }
    })

    return true
}

// Send notification when user profile data is updated
const sendProfileUpdateNotification = async (user_id, language) => {
    const languageJson = await getLanguageJson(language)

    // user
    const user = await User.findOne({
        where: { id: user_id, isDeleted: 0 },
        raw: true,
    })
    if (!user) return false

    // org admin
    const admin = await User.findOne({
        where: {
            organization_id: user.organization_id,
            role_id: process.env.ROLE_ADMIN,
            isDeleted: 0,
        },
        raw: true,
    })
    if (!admin) return false

    const replacements = {
        URL: SITE_URL,
        userName: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        mobile: user.mobile,
        adminUserName: admin.username,
        belowProfileDetails: languageJson.emailContent.belowProfileDetails,
        firstNameTxt: languageJson.emailContent.firstName,
        lastNameTxt: languageJson.emailContent.lastName,
        emailTxt: languageJson.emailContent.email,
        userNameTxt: languageJson.emailContent.username,
        mobileTxt: languageJson.emailContent.mobile,
        hi: languageJson.emailContent.hi,
        oborInfo: languageJson.emailContent.oborInfo,
    }

    // send email to user
    const htmlToSend = prepareEmailBody('email', 'user-profile-updation-to-admin', replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: admin.email,
        subject: languageJson.profileUpdatedSubject,
        html: htmlToSend,
    }
    emailSender.sendMail(message)
}

/**
 * This function will prepare the HTML body of the email for all
 * types of emails and notifications
 *
 * @param string fileName
 * @param object replacements
 * @param string type
 * @returns email HTML body
 */
const prepareEmailBody = (type, fileName, replacements) => {
    const filePath = path.join(__dirname, `../../static/templates/email-html/${fileName}.html`)
    const source = fs.readFileSync(filePath, 'utf-8').toString()
    const template = handlebars.compile(source)
    const emailHtml = template(replacements)

    const emailTemplate = path.join(__dirname, `../../static/templates/email-html/${type}-template.html`)
    const emailTemplateSrc = fs.readFileSync(emailTemplate, 'utf-8').toString()
    const emailTemplateCompiled = handlebars.compile(emailTemplateSrc)
    const tempVars = {
        EMAIL_HTML: emailHtml,
        URL: replacements.URL,
        oborInfo: replacements.oborInfo,
        notiInfo: replacements.notiInfo,
        allRightsReserve: replacements.allRightsReserve,
    }
    return emailTemplateCompiled(tempVars)
}

const prepareEmailHtml = (fileName, replacements) => {
    const filePath = path.join(__dirname, `../../static/templates/email-html/${fileName}.html`)
    const source = fs.readFileSync(filePath, 'utf-8').toString()
    const template = handlebars.compile(source)
    return template(replacements)
}

exports.prepareEmailBody = prepareEmailBody
exports.sendApprovalEmail = sendApprovalEmail
exports.sendProfileUpdateNotification = sendProfileUpdateNotification
exports.prepareEmailHtml = prepareEmailHtml
exports.sendViewProfileEmail = sendViewProfileEmail
