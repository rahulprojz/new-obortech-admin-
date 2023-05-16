const statusCode = require('../../../utils/statusCodes')
const emailSender = require('../../services/sendMail')
const string = require('../../helpers/LanguageHelper')
const { prepareEmailBody } = require('../../helpers/email-helper')
const { getLanguageJson, dynamicLanguageStringChange } = require('../globalHelpers')

const { MAIL_EMAIL_ID } = process.env
const { SITE_URL } = process.env

const sendApprovalEmail = async (emailId, userName, orgName, language) => {
    const languageJson = await getLanguageJson(language)

    const replacements = {
        URL: SITE_URL,
        userName,
        orgName,
        approveRedirectionLink: `${SITE_URL}/participant`,
        hi: languageJson.emailContent.hi,
        linkText: languageJson.emailContent.notSeeApproveOrg,
        approveOrg: languageJson.emailContent.approveOrg,
        approveBtnText: languageJson.emailContent.approveBtnText,
        oborInfo: languageJson.emailContent.oborInfo,
    }
    const htmlToSend = prepareEmailBody('email', 'organization-approval', replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: emailId,
        subject: languageJson.endorsedApprovedSubject,
        html: htmlToSend,
    }
    emailSender.sendMail(message, function (err, info) {
        if (err) {
            console.log({ err })
            throw err
        } else {
            return info
        }
    })
}

const sendOnboardingIssueEmail = async (emailId, userName, orgName, language) => {
    const languageJson = await getLanguageJson(language)

    const replacements = {
        URL: SITE_URL,
        userName,
        orgName,
        onboardingIssue: languageJson.emailContent.onboardingIssue.replace('ORG_NAME', orgName),
        onboardingNotify: languageJson.emailContent.onboardingNotify,
        approveRedirectionLink: `${SITE_URL}/participant`,
        hi: languageJson.emailContent.hi,
        oborInfo: languageJson.emailContent.oborInfo,
    }
    const htmlToSend = prepareEmailBody('email', 'organization-onboarding-issue', replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: emailId,
        subject: languageJson.orgOnboardingIssueSubject,
        html: htmlToSend,
    }
    emailSender.sendMail(message, function (err, info) {
        if (err) {
            console.log({ err })
            throw err
        } else {
            return info
        }
    })
}

const sendOnboardingCancelEmail = async (emailId, userName, orgName, language) => {
    const languageJson = await getLanguageJson(language)

    const replacements = {
        URL: SITE_URL,
        userName,
        org_name: orgName,
        reviewRequestBtn: languageJson.emailContent.reviewRequestBtn,
        onboardingNotifyMessage: languageJson.emailContent.onboardingNotifyMessage.replace('ORG_NAME', orgName),
        viewRequestBtn: languageJson.emailContent.viewRequestBtn,
        viewRequestLink: `${SITE_URL}/participant`,
        hi: languageJson.emailContent.hi,
        oborInfo: languageJson.emailContent.oborInfo,
    }
    const htmlToSend = prepareEmailBody('email', 'organization-onboarding-cancel', replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: emailId,
        subject: languageJson.orgCanceledSubject,
        html: htmlToSend,
    }
    emailSender.sendMail(message, function (err, info) {
        if (err) {
            console.log({ err })
            throw err
        } else {
            return info
        }
    })
}

const sendOnboardingCancelEmailOrg = async (emailId, orgName, language) => {
    const languageJson = await getLanguageJson(language)

    const replacements = {
        URL: SITE_URL,
        orgName,
        oboretchCancelled: languageJson.emailContent.oboretchCancelled.replace('ORG_NAME', orgName),
        reviewRequestBtn: languageJson.emailContent.reviewRequestBtn,
        viewRequestLink: `${SITE_URL}/`,
        hi: languageJson.emailContent.hi,
        oborInfo: languageJson.emailContent.oborInfo,
    }
    const htmlToSend = prepareEmailBody('email', 'organization-onboarding-cancel-org', replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: emailId,
        subject: languageJson.endorsedApprovedSubject,
        html: htmlToSend,
    }
    emailSender.sendMail(message, function (err, info) {
        if (err) {
            console.log({ err })
            throw err
        } else {
            return info
        }
    })
}

const sendNewOrgAddedEmail = async (emailId, fistName, lastName, verificationLink, language) => {
    const languageJson = await getLanguageJson(language)

    const replacements = {
        URL: SITE_URL,
        fistName,
        lastName,
        verificationLink: `${SITE_URL}/add-organization/${verificationLink}`,
        content: `${orgName} ${languageJson.emailContent.invitation}`,
        ctaText: languageJson.emailContent.addOrganization,
        linkText: languageJson.emailContent.notSeeAddOrg,
        hi: languageJson.emailContent.hi,
        oborInfo: languageJson.emailContent.oborInfo,
    }
    const htmlToSend = prepareEmailBody('email', 'organization-invitation', replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: emailId,
        subject: languageJson.newOrgAddedSubject,
        html: htmlToSend,
    }
    emailSender.sendMail(message, function (err, info) {
        if (err) {
            console.log({ err })
            throw err
        } else {
            return info
        }
    })
}

const sendInvitationEmail = async (emailId, firstName, lastName, verificationLink, orgName, type, language) => {
    let templateName = 'organization-invitation'
    if (type === 'user') {
        templateName = 'user-invitation'
    }

    const languageJson = await getLanguageJson(language)
    const replacements = {
        URL: SITE_URL,
        firstName,
        lastName,
        content: `${orgName} ${languageJson.emailContent.invitation}`,
        ctaText: languageJson.emailContent.addOrganization,
        linkText: type === 'user' ? languageJson.emailContent.notSeeSign : languageJson.emailContent.notSeeAddOrg,
        verificationLink: `${SITE_URL}/onboarding?token=${verificationLink}`,
        userInvitation: `${orgName} ${languageJson.emailContent.userInvitation}`,
        signup: languageJson.emailContent.signup,
        hi: languageJson.emailContent.hi,
        oborInfo: languageJson.emailContent.oborInfo,
        oborInfo: languageJson.emailContent.oborInfo,
    }
    const htmlToSend = prepareEmailBody('email', templateName, replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: emailId,
        subject: languageJson.invitationSubject,
        html: htmlToSend,
    }

    emailSender.sendMail(message, function (err, info) {
        if (err) {
            console.log({ err })
            throw err
        } else {
            return info
        }
    })
}

const sendSyncedEmail = async (userData, Organization, res) => {
    const languageJson = await getLanguageJson(userData.language)
    const replacements = {
        first_name: userData.first_name,
        last_name: userData.last_name,
        org_name: Organization.name,
        hi: languageJson.emailContent.hi,
        orgApprovedAndSynced: languageJson.emailContent.orgApprovedAndSynced.replace('ORG_NAME', Organization.name),
        URL: SITE_URL,
        oborInfo: languageJson.emailContent.oborInfo,
    }

    const htmlToSend = prepareEmailBody('email', 'organization-synced', replacements)

    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: userData.email,
        subject: languageJson.approvedEmailSubject,
        html: htmlToSend,
    }

    emailSender.sendMail(message, function (err, info) {
        if (err) {
            res.status(statusCode.notFound.code).json({
                code: statusCode.notFound.code,
                message: statusCode.notFound.message,
                data: err,
            })
        } else {
            // res.status(statusCode.successData.code).json({
            //     code: statusCode.successData.code,
            //     message: statusCode.successData.message,
            //     data: info,
            // })
        }
    })
}

const sendWelcomeEmail = async (emailId, language) => {
    const languageJson = await getLanguageJson(language)

    const replacements = {
        URL: SITE_URL,
        hi: languageJson.emailContent.hi,
        thanksForRegistration: languageJson.emailContent.thanksForRegistration,
        accountUnderReview: languageJson.emailContent.accountUnderReview,
        approveNotify: languageJson.emailContent.approveNotify,
        oborInfo: languageJson.emailContent.oborInfo,
    }
    const htmlToSend = prepareEmailBody('email', 'welcome-to-onboard', replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: emailId,
        subject: languageJson.welcomeOnboardSubject,
        html: htmlToSend,
    }

    emailSender.sendMail(message, function (err, info) {
        if (err) {
            res.status(statusCode.notFound.code).json({
                code: statusCode.notFound.code,
                message: statusCode.notFound.message,
                data: err,
            })
        } else {
            res.status(statusCode.successData.code).json({
                code: statusCode.successData.code,
                message: statusCode.successData.message,
                data: info,
            })
        }
    })
}

const sendBlockchainRequestEmail = async (orgName) => {
    const languageJson = await getLanguageJson('en')
    let server = 'LOCAL'
    if (process.env.SITE_URL == 'https://qa-login.obortech.io') {
        server = 'QA'
    } else if (process.env.SITE_URL == 'https://st-login.obortech.io') {
        server = 'UAT'
    } else if (process.env.SITE_URL == 'https://uat-login.obortech.io') {
        server = 'UAT'
    } else if (process.env.SITE_URL == 'https://login.obortech.io') {
        server = 'LIVE'
    }
    const replacements = {
        URL: SITE_URL,
        userName: 'Admin',
        orgName,
        orgNameTxt: 'Name: ',
        serverTxt: 'Server: ',
        server,
        hi: languageJson.emailContent.hi,
        addBlockchain: 'Kindly add below Org into the blockchain network.',
        oborInfo: languageJson.emailContent.oborInfo,
    }
    const htmlToSend = prepareEmailBody('email', 'organization-blockchain-request', replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: ['gary@chaincodeconsulting.com', 'hansraj@chaincodeconsulting.com'],
        subject: 'Request to add into the blockchain network',
        html: htmlToSend,
    }
    emailSender.sendMail(message, function (err, info) {
        if (err) {
            console.log({ err })
            throw err
        } else {
            return info
        }
    })
}

const sendDelOrgApprovalEmail = async (user, module_id, sendEmailTo, orgName) => {
    const languageJson = await getLanguageJson('en')
    let templateName = 'delete-organization-approval-mail'
    const replacements = {
        URL: SITE_URL,
        hi: languageJson.emailContent.hi,
        userName: `${user.first_name} ${user.last_name}`,
        approveOrg: `${languageJson.emailContent.wantsToDeleteOrg} "${orgName} ". ${languageJson.emailContent.clickToApprove}`,
        approveRedirectionLink: `${SITE_URL}/participant?orgId=${module_id}`,
        approveBtnText: languageJson.approveOrg,
        linkText: languageJson.emailContent.notSeeApproveOrg,
        oborInfo: languageJson.emailContent.oborInfo,
    }
    const htmlToSend = prepareEmailBody('email', templateName, replacements)

    const message = {
        from: `${MAIL_EMAIL_ID}`,
        to: sendEmailTo,
        subject: languageJson.delOrgApprovedEmailSubject,
        html: htmlToSend,
    }
    emailSender.sendMail(message, function (err, info) {
        if (err) {
            console.log({ err: `Error: ${err.message}` })
            throw err
        } else {
            return info
        }
    })
}

const sendGitHubAccessEmail = async (emailId, firstName, lastName, hostOrgName, type, language, proposal_name) => {
    let templateName = 'github-access-notification'
    const languageJson = await getLanguageJson(language)
    let email_content
    let email_subject
    let org_label

    switch (type) {
        case 'INVITATION':
            email_content = languageJson.emailContent.gitHubInvitation
            email_subject = languageJson.gitHubInvitationSubject
            org_label = languageJson.emailContent.gitHubHostOrgLabel
            break

        case 'REQUESTED':
            email_content = languageJson.emailContent.gitHubInvitationRequested
            email_subject = languageJson.gitHubRequestSubject
            org_label = languageJson.emailContent.gitHubOrgLabel
            break

        case 'REJECTED':
            email_content = languageJson.emailContent.gitHubRequestRejected
            email_subject = languageJson.gitHubRejectSubject
            org_label = languageJson.emailContent.gitHubHostOrgLabel
            break

        default:
            break
    }

    const replacements = {
        URL: SITE_URL,
        firstName,
        lastName,
        content: email_content,
        proposalNameLabel: languageJson.emailContent.gitHubProposalName,
        proposalName: proposal_name,
        hostOrg: hostOrgName,
        gitHubOrgLabel: org_label,
        ctaText: languageJson.emailContent.gitHubCTA,
        linkText: languageJson.emailContent.notSeeGitHubCTA,
        smartContractsLink: `${SITE_URL}/smart-contracts`,
        hi: languageJson.emailContent.hi,
        oborInfo: languageJson.emailContent.oborInfo,
    }
    const htmlToSend = prepareEmailBody('email', templateName, replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: emailId,
        subject: email_subject,
        html: htmlToSend,
    }

    emailSender.sendMail(message, function (err, info) {
        if (err) {
            console.log({ err })
            throw err
        } else {
            return info
        }
    })
}

const sendPdcRequestEmail = async (emailContent) => {
    const languageJson = await getLanguageJson('en')
    const { user, name, type } = emailContent
    const replacements = {
        URL: SITE_URL,
        userName: user.username,
        pdcRequestContent: dynamicLanguageStringChange(type ? string.emailContent.projectPdcReqApproved : string.emailContent.pdcReqApproved, { name }),
        hi: languageJson.emailContent.hi,
        oborInfo: languageJson.emailContent.oborInfo,
    }
    const htmlToSend = prepareEmailBody('email', 'pdc-request-mail', replacements)
    const message = {
        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
        to: user.email,
        subject: type ? string.emailContent.ProjectStatusChanged : string.emailContent.PDCStatusChanged,
        html: htmlToSend,
    }
    emailSender.sendMail(message, function (err, info) {
        if (err) {
            console.log({ err })
            throw err
        } else {
            return info
        }
    })
}

module.exports = {
    sendApprovalEmail,
    sendOnboardingIssueEmail,
    sendOnboardingCancelEmail,
    sendOnboardingCancelEmailOrg,
    sendNewOrgAddedEmail,
    sendInvitationEmail,
    sendWelcomeEmail,
    sendSyncedEmail,
    sendBlockchainRequestEmail,
    sendDelOrgApprovalEmail,
    sendGitHubAccessEmail,
    sendPdcRequestEmail,
}
