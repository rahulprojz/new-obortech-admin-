// Load dependencies
const { getLanguageJson } = require('../utils/globalHelpers')
const { prepareEmailHtml } = require('../helpers/email-helper')
const emailSender = require('../services/sendMail')

// Load MySQL Models
const db = require('../models')

const { Op } = db.Sequelize
const User = db.users
const Organization = db.organizations
const ApprovedBy = db.approved_by
const ProjectUser = db.project_users
const UserTitle = db.user_titles
const Project = db.projects

const { MAIL_EMAIL_ID, SITE_URL, ROLE_CEO, LOCAL_COUNTRY_CODE } = process.env

async function sendUserApprovalInvite(user, rejectType) {
    try {
        const { organization_id } = user
        const organization = await Organization.findOne({
            where: { id: organization_id, isDeleted: 0 },
            attributes: ['name'],
        })
        const orgData = JSON.parse(JSON.stringify(organization))
        const data = await ApprovedBy.findAll({
            where: { organization_id },
            attributes: ['approved_by'],
            include: [
                {
                    model: Organization,
                    attributes: ['id'],
                    as: 'approver',
                    required: true,
                    where: { isDeleted: 0 },
                    include: [
                        {
                            model: User,
                            where: { role_id: ROLE_CEO, isDeleted: 0 },
                            attributes: ['id', 'email', 'country_id'],
                        },
                    ],
                },
            ],
        })
        const approvers = data && !!data.length ? JSON.parse(JSON.stringify(data)) : []
        if (approvers && !approvers.length) return
        for (const approver of approvers) {
            const approvedUser = (approver.approver && approver.approver.users && approver.approver.users[0]) || {}

            const projectUser = await ProjectUser.findOne({
                include: [
                    {
                        model: Project,
                        where: { isDraft: { [Op.ne]: 1 }, archived: false },
                        attributes: ['id', 'name'],
                    },
                ],
                where: { user_id: approvedUser.id },
            })

            if (!projectUser) return

            const lang = LOCAL_COUNTRY_CODE == approvedUser.country_id ? 'mn' : 'en'
            const languageJson = await getLanguageJson(lang)
            const isOrganizationReject = rejectType == 'organization'

            if (approvedUser.id && approvedUser.email) {
                const replacements = {
                    designation: 'CEO',
                    orgName: orgData.name,
                    URL: SITE_URL,
                    VerifiedUserProfileChanged: isOrganizationReject ? languageJson.emailContent.VerifiedOrgInfoChanged : languageJson.emailContent.VerifiedUserProfileChanged,
                    yourVerifiedUser: isOrganizationReject ? languageJson.emailContent.yourVerifiedOrganization : languageJson.emailContent.yourVerifiedUser,
                    changedProfileInfo: isOrganizationReject ? languageJson.emailContent.changedOrgInfo : languageJson.emailContent.changedProfileInfo,
                    rejectVerificationAndRequest: isOrganizationReject ? languageJson.emailContent.rejectOrgVerificationAndRequest : languageJson.emailContent.rejectVerificationAndRequest,
                    clickHere: languageJson.emailContent.clickHere,
                    linkText: languageJson.emailContent.notSeeYes,
                    yes: languageJson.event.acceptyes.toUpperCase(),
                    rejectApprovalLink: `${SITE_URL}/event/${projectUser.project_id}?isRejectApproval=true&uid=${user.id}&ruid=${approvedUser.id}&rejectType=${rejectType}`,
                    oborInfo: languageJson.emailContent.oborInfo,
                }
                const message = {
                    from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
                    subject: languageJson.endorsedApprovedSubject,
                    html: prepareEmailHtml('organization-profile-approval', replacements),
                }
                message.to = approvedUser.email
                emailSender.sendMail(message)
            }
        }
    } catch (error) {
        console.log('sendUserApprovalInvite-error', error)
    }
}

async function sendUserUpdationInviteToCeo(user) {
    try {
        const { organization_id, language, title_id, username } = user
        const updatingUserOrg = await Organization.findOne({
            where: { id: organization_id, isDeleted: 0 },
            attributes: ['name'],
        })
        const receiverUser = await User.findOne({
            attributes: ['email'],
            where: { organization_id, role_id: parseInt(ROLE_CEO), isDeleted: 0 },
        })
        const languageJson = await getLanguageJson(language)
        const { name } = await UserTitle.findByPk(title_id)
        const replacements = {
            username,
            userTitle: name,
            VerifiedUserProfileChanged: languageJson.emailContent.VerifiedUserProfileChanged,
            yourVerifiedUser: languageJson.emailContent.yourVerifiedUser,
            changedProfileInfo: languageJson.emailContent.changedProfileInfo,
            reviewUpdatedInfo: languageJson.emailContent.reviewUpdatedInfo,
            clickHere: languageJson.emailContent.clickHere,
            linkText: languageJson.emailContent.notSeeYes,
            yes: languageJson.event.acceptyes.toUpperCase(),
            orgName: updatingUserOrg.name,
            URL: SITE_URL,
            approvalLink: `${SITE_URL}/participant?isUserApproval=true`,
            oborInfo: languageJson.emailContent.oborInfo,
        }
        const message = {
            from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
            subject: languageJson.endorsedApprovedSubject,
            html: prepareEmailHtml('user-profile-approval', replacements),
        }
        if (receiverUser && receiverUser.email) {
            message.to = receiverUser.email
            emailSender.sendMail(message)
        }
    } catch (error) {
        console.log('sendUserUpdationInviteToCeo-error', error)
    }
}

async function sendApprovalRejectionEmail(user, { organization, receiverId, appoverUserId, rejectType }) {
    try {
        const receiverUser = await User.findOne({
            attributes: ['id', 'email', 'organization_id', 'country_id'],
            where: { id: receiverId, isDeleted: 0 },
        })

        const approverUser = await User.findOne({
            attributes: ['email', 'organization_id', 'country_id'],
            where: { id: appoverUserId, isDeleted: 0 },
        })

        if (!receiverUser || !receiverUser.email) return
        const lang = LOCAL_COUNTRY_CODE == receiverUser.country_id ? 'mn' : 'en'
        const languageJson = await getLanguageJson(lang)

        const projectUser = await ProjectUser.findOne({
            include: [
                {
                    model: Project,
                    where: { isDraft: { [Op.ne]: 1 }, archived: false },
                    attributes: ['id', 'name'],
                },
            ],
            where: { user_id: receiverId },
        })

        if (!projectUser) return
        await ApprovedBy.update({ isVerified: false }, { where: { organization_id: receiverUser.organization_id, approved_by: approverUser.organization_id } })
        const isApproveAvailable = await ApprovedBy.count({
            where: { organization_id: receiverUser.organization_id, isVerified: true },
        })
        // If 100% Rejection then update organization's isApproved status
        if (receiverUser && !isApproveAvailable) {
            let where = { id: receiverUser.id }
            if (rejectType == 'organization') {
                where = { organization_id: receiverUser.organization_id, isDeleted: 0 }
                await Organization.update({ isApproved: false }, { where: { id: receiverUser.organization_id, isDeleted: 0 } })
            }
            await User.update({ isApproved: false, status: false }, { where })
        }

        const replacements = {
            organization,
            URL: SITE_URL,
            profileLink: `${SITE_URL}/event/${projectUser.project_id}?isShareProfile=true&uid=${user.id}&ruid=${receiverId}`,
            verificationRejected: languageJson.emailContent.verificationRejected,
            requestNewProfile: languageJson.emailContent.requestNewProfile,
            newProfileTo: languageJson.emailContent.newProfileTo,
            forReverification: languageJson.emailContent.forReverification,
            clickHere: languageJson.emailContent.clickHere,
            linkText: languageJson.emailContent.notSeeYes,
            yes: languageJson.event.acceptyes.toUpperCase(),
            oborInfo: languageJson.emailContent.oborInfo,
        }
        const htmlToSend = prepareEmailHtml('organization-approval-rejection', replacements)
        const message = {
            from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
            subject: languageJson.orgApprovalRejectionSubject,
            html: htmlToSend,
        }
        message.to = receiverUser.email
        emailSender.sendMail(message)
    } catch (error) {
        console.log('sendApprovalRejectionEmail-error', error)
    }
}

async function sendProfileEmail(user, { organization, receiverId }) {
    try {
        const { language } = user
        const receiverUser = await User.findOne({
            attributes: ['email', 'organization_id'],
            where: { id: receiverId, isDeleted: 0 },
        })
        const isInvitedOrg = await Organization.findOne({
            where: { invited_by: receiverUser.organization_id, id: user.organization_id, isDeleted: 0 },
        })
        if (!receiverUser || !receiverUser.email) return
        const languageJson = await getLanguageJson(language)
        let path = 'user-data-request'
        if (isInvitedOrg) {
            path = 'participant'
        }
        const replacements = {
            organization,
            URL: SITE_URL,
            profileLink: `${SITE_URL}/${path}?isShareProfile=true`,
            userSharedProfileToYou: `${languageJson.userDataRequest.user} ${languageJson.emailContent.sharedProfileToYou}`,
            sharedProfileToYou: languageJson.emailContent.sharedProfileToYou,
            tenDaysToSeeIt: languageJson.emailContent.tenDaysToSeeIt,
            seeTheProfile: languageJson.emailContent.seeTheProfile,
            clickHere: languageJson.emailContent.clickHere,
            linkText: languageJson.emailContent.notSeeSeeTheProfile,
            yes: languageJson.event.acceptyes.toUpperCase(),
            oborInfo: languageJson.emailContent.oborInfo,
        }
        const htmlToSend = prepareEmailHtml('share-organization-profile', replacements)
        const message = {
            from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
            subject: languageJson.shareUserProfileSubject,
            html: htmlToSend,
        }
        message.to = receiverUser.email
        emailSender.sendMail(message)
    } catch (error) {
        console.log('sendProfileEmail-error', error)
    }
}

module.exports = { sendUserApprovalInvite, sendUserUpdationInviteToCeo, sendApprovalRejectionEmail, sendProfileEmail }
