// Load dependencies
const express = require('express')
const _ = require('lodash')
const emailSender = require('../services/sendMail')
const string = require('../helpers/LanguageHelper')
const { prepareEmailBody } = require('../helpers/email-helper')
const networkHelper = require('../helpers/network-helper')
const { getLanguageJson } = require('../utils/globalHelpers')
const db = require('../models')
const networkHooks = require('../hooks/network-hooks')

const ProjectPdcCategory = db.project_pdc_categories
const PdcOrganization = db.pdc_organizations
const PdcOrgs = db.pdc_orgs
const PdcParticipants = db.pdc_participants
const ProjectParticipantCategory = db.project_participant_categories
const OrganizationCategories = db.organization_categories
const PdcSelection = db.pdc_selections
const User = db.users
const Events = db.events
const Projects = db.projects
const Organization = db.organizations
const PdcRequests = db.pdc_request
const PdcOrgApprovals = db.pdc_org_approvals

const ProjectPdcCategoryEvent = db.project_pdc_category_events
const { Op } = db.Sequelize
const { sequelize } = db

const { MAIL_EMAIL_ID } = process.env
const { SITE_URL } = process.env

// Define global variables
const router = express.Router()

router.use((req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: string.statusResponses.unAuthoried })
        return
    }
    next()
})

// Add pdc category
router.post('/add', async (req, res) => {
    try {
        const { name, project_category_id, pdc_name, events, orgs, createdBy, userIds, orgList, pdcData } = req.body
        const checkIfDefault = await ProjectPdcCategory.findOne({ where: { project_category_id } })
        const data = {
            name,
            project_category_id,
            user_id: req.user.id,
            pdc_name,
            is_default: !checkIfDefault,
            user_ids: {
                submit: _.uniq(userIds.submit),
                see: _.uniq(userIds.see),
                accept: _.uniq(userIds.accept),
            },
            org_list: orgList,
        }

        ProjectPdcCategory.create(data).then(async (category) => {
            await _savePdcChildrens({
                pdc_category_id: category.id || '',
                pdcData,
                events,
                createdBy,
                orgList,
                currentUser: req.user,
            })
            res.json(true)
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Add pdc category
router.post('/default-pdc', async (req, res) => {
    try {
        const { id, project_category_id } = req.body

        await ProjectPdcCategory.update(
            { is_default: false },
            {
                where: {
                    project_category_id,
                },
            },
        )

        await ProjectPdcCategory.update(
            { is_default: true },
            {
                where: {
                    id,
                },
            },
        )
        res.json(true)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Update pdc category
router.post('/update', async (req, res) => {
    try {
        const { name, events, createdBy, orgList, pdcData, project_category_id, members } = req.body

        if (project_category_id) {
            ProjectPdcCategory.update(
                {
                    name,
                },
                {
                    where: {
                        id: project_category_id,
                    },
                },
            ).then(async (result) => {
                if (result[0]) {
                    // Delete old records
                    await PdcOrganization.destroy({ where: { pdc_category_id: project_category_id } })
                    await ProjectPdcCategoryEvent.destroy({ where: { project_category_id } })
                    await PdcSelection.destroy({ where: { pdc_category_id: project_category_id } })
                    await PdcParticipants.destroy({ where: { pdc_id: project_category_id } })
                    await PdcOrgs.destroy({ where: { pdc_id: project_category_id } })
                    await PdcOrgApprovals.destroy({ where: { pdc_id: project_category_id } })

                    // Creating new records
                    await _savePdcChildrens({
                        pdc_category_id: project_category_id || '',
                        pdcData,
                        events,
                        createdBy: '',
                        orgList,
                        currentUser: req.user,
                    })

                    const projectPDCCategory = await ProjectPdcCategory.findByPk(project_category_id)
                    if (projectPDCCategory.is_active == 1) {
                        await PdcRequests.create({
                            pdc_name: networkHooks.sanitize(projectPDCCategory.pdc_name),
                            members: members,
                            type: 0,
                            email: false,
                            record_id: project_category_id,
                            user_id: projectPDCCategory.user_id,
                        })
                    }

                    res.json(true)
                } else {
                    res.json(false)
                }
            })
        } else {
            res.json(false)
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// get pdc category
router.get('/fetch/:event_id', async (req, res) => {
    try {
        const { event_id } = req.params
        const pdcSelection = await PdcSelection.findOne({
            include: [{ attributes: ['name'], model: ProjectPdcCategory }],
            where: { selection_id: event_id },
        })
        let result = null
        if (pdcSelection) {
            result = await PdcOrganization.findAll({
                where: { pdc_category_id: pdcSelection.pdc_category_id },
            })
        }
        res.json({ result, pdcName: pdcSelection && pdcSelection.project_pdc_category && pdcSelection.project_pdc_category.name ? pdcSelection.project_pdc_category.name : null })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Get orgs by category id
router.get('/fetch-org/:category_id', async (req, res) => {
    try {
        const orgNames = []
        const { category_id } = req.params
        const pdcOrg = await ProjectParticipantCategory.findAll({
            where: { project_category_id: category_id },
        })

        const pCatIds = pdcOrg.map((category) => category.participant_category_id)
        if (pCatIds.length) {
            const orgList = await Organization.findAll({
                where: { category_id: { [Op.in]: pCatIds }, isDeleted: 0 },
            })
            orgList.map(({ name }) => {
                orgNames.push(name.toLowerCase() == process.env.HOST_ORG ? process.env.HOST_MSP : name.toLowerCase())
            })
        }
        res.json(orgNames)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// get pdc data by event and pdc
router.get('/fetch-pdc/:event_id/:pdcName', async (req, res) => {
    try {
        const { event_id, pdcName } = req.params

        const pdcDetails = await ProjectPdcCategory.findOne({
            where: { is_deleting: 0, pdc_name: pdcName },
            include: [{ model: PdcOrganization }, { model: PdcOrgs }, { model: PdcParticipants }, { model: ProjectPdcCategoryEvent, where: { event_id } }],
        })

        res.json(pdcDetails)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

router.get('/fetch-pdc-events/:pdcId', async (req, res) => {
    try {
        const { pdcId } = req.params
        const pdcEventDocuments = await ProjectPdcCategoryEvent.findAll({
            include: [
                {
                    model: Events,
                },
            ],
            where: {
                project_category_id: pdcId,
            },
        })
        res.json(pdcEventDocuments)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// get pdc data by event
router.get('/fetch-pdc-by-event/:event_id', async (req, res) => {
    try {
        const { event_id } = req.params

        const pdcDetails = await ProjectPdcCategory.findAll({
            where: { is_deleting: 0 },
            include: [{ model: PdcOrganization }, { model: PdcOrgs }, { model: PdcParticipants }, { model: ProjectPdcCategoryEvent, include: [{ model: Events }], where: { event_id } }],
        })

        res.json(pdcDetails)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// get event data by pdc
router.get('/fetch-event-by-pdc/:pdc_name', async (req, res) => {
    try {
        const { pdc_name } = req.params

        const pdcDetails = await ProjectPdcCategory.findAll({
            where: { is_deleting: 0, pdc_name },
            include: [{ model: PdcOrganization }, { model: PdcOrgs }, { model: PdcParticipants }, { model: ProjectPdcCategoryEvent }],
        })

        res.json(pdcDetails)
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// get pdc data by project
router.get('/fetch-project-pdc/:project_id', async (req, res) => {
    try {
        const { project_id } = req.params
        const where = { is_deleting: 0, is_active: 1 }
        let response = []
        if (project_id) {
            const projectDetails = await Projects.findOne({
                where: { id: project_id },
            })
            where.project_category_id = projectDetails.project_category_id
            if (projectDetails) {
                response = await ProjectPdcCategory.findAll({
                    where,
                    include: [{ model: ProjectPdcCategoryEvent }],
                })
                return res.json(response)
            }
        } else {
            return res.json({ error: 'project_id is missing' })
        }
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// Approve PDC
router.get('/approve/:org_id/:pdc_category_id', async (req, res) => {
    try {
        const { org_id, pdc_category_id } = req.params
        const whereCondition = {
            where: { pdc_category_id, see_user_id: org_id },
        }

        //Fetch org details
        const organization = await Organization.findOne({ where: { id: org_id, isDeleted: 0 } })
        if (!organization) {
            throw 'Organization not exists for this PDC'
        }

        const projectPdcCategory = await ProjectPdcCategory.findOne({
            where: { id: pdc_category_id },
            include: [
                {
                    model: PdcOrgs,
                    attributes: ['org_id'],
                },
                {
                    model: User,
                    attributes: ['unique_id'],
                },
            ],
        })

        const pdcOrgs = await PdcOrgApprovals.findAll({
            where: { pdc_id: pdc_category_id },
            include: [{ model: Organization, attributes: ['blockchain_name'], where: { isDeleted: 0 } }],
        })

        const filteredOrgList = []
        pdcOrgs.map((pdcOrg) => {
            if (pdcOrg.organization.blockchain_name.toLowerCase() == process.env.HOST_ORG) {
                filteredOrgList.push(process.env.HOST_MSP)
            } else {
                filteredOrgList.push(networkHooks.sanitize(pdcOrg.organization.blockchain_name))
            }
        })

        //If orgs doesn't exists
        if (!filteredOrgList) {
            throw 'Orgs not exists for this PDC'
        }

        //Update PDC category status
        await PdcOrgApprovals.update(
            { is_approved: 1 },
            {
                where: {
                    pdc_id: pdc_category_id,
                    org_id,
                },
            },
        )

        // Flip pdc active flag to true if approved by 50% of orgs
        // In case of 2 orgs, both are required to approve but for all others more than 50% is required
        const approvedOrgs = await PdcOrgApprovals.findAll({
            where: { pdc_id: pdc_category_id },
        })
        const approvedCount = approvedOrgs.filter((pdc) => pdc.is_approved).length
        if (approvedOrgs.length && approvedCount > approvedOrgs.length / 2) {
            // Add PDC request
            await PdcRequests.create({
                pdc_name: networkHooks.sanitize(projectPdcCategory.pdc_name),
                members: filteredOrgList,
                type: 0,
                email: true,
                record_id: pdc_category_id,
                user_id: projectPdcCategory.user_id,
            })
        }

        const result = await PdcOrganization.findOne(whereCondition)
        if (result && result.is_approved === 1) {
            res.json('Already Approved')
        } else {
            await PdcOrganization.update({ is_approved: 1 }, whereCondition)
            res.json('Approved')
        }
    } catch (err) {
        console.log(err)
        res.json({ error: err.message || err.toString() })
    }
})

// delete pdc category
router.delete('/delete-request/:id', async (req, res) => {
    try {
        const { id } = req.params
        ProjectPdcCategory.findOne({
            where: { id },
            attributes: ['name'],
            include: [
                {
                    model: PdcOrgs,
                    attributes: ['org_id'],
                },
            ],
            // include: [{ model: PdcOrganization, attributes: ['see_user_id'] }],
        }).then(async (result) => {
            await ProjectPdcCategory.update({ is_deleting: 1 }, { where: { id } })
            const pdc = JSON.parse(JSON.stringify(result))
            await sendPdcDeleteApprovalEmail(pdc, id)
            res.json(true)
        })
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Is exists pdc category
router.post('/exists', async (req, res) => {
    const { orgs, selectedPdcId } = req.body
    orgs.sort(function (a, b) {
        return a - b
    })
    const orgsString = JSON.stringify(orgs)
    const cond = [{ user_id: req.user.id }]
    if (selectedPdcId) {
        cond.push({ id: { [Op.ne]: selectedPdcId } })
    }
    const list = await ProjectPdcCategory.findAll({
        where: { [Op.and]: cond },
        attributes: ['id'],
    })
    const userPdcList = JSON.parse(JSON.stringify(list))
    const data = await PdcOrganization.findAll({
        group: ['pdc_category_id'],
        attributes: ['pdc_category_id', [sequelize.fn('GROUP_CONCAT', sequelize.col('see_user_id')), 'orgs']],
        where: { pdc_category_id: { [Op.in]: userPdcList.map((pdc) => pdc.id) } },
    })
    const pdcList = JSON.parse(JSON.stringify(data))
    let isExists = false
    let pdcExists = {}
    for (pdc of pdcList) {
        const orgList = pdc.orgs.split(',').map((value) => parseInt(value))
        orgList.sort(function (a, b) {
            return a - b
        })
        if (orgsString === JSON.stringify(orgList)) {
            pdcExists = await ProjectPdcCategory.findOne({ where: { id: pdc.pdc_category_id } })
            isExists = true
            break
        }
    }
    res.json({ isExists, pdcDetail: pdcExists || '' })
})

// approval to delete pdc category
router.get('/approve-to-delete/:organization_id/:id', async (req, res) => {
    try {
        const { id, organization_id } = req.params
        if (id && organization_id) {
            const where = { where: { [Op.and]: [{ pdc_id: id }, { org_id: organization_id }] } }
            const pdcOrg = await PdcOrgApprovals.findOne(where)
            const pdcName = await ProjectPdcCategory.findOne({ where: { id } })
            if (pdcOrg && pdcOrg.is_deleted === 1) {
                res.json('Already Approved')
            } else {
                await PdcOrgApprovals.update({ is_deleted: 1 }, where)
                await PdcOrgApprovals.findAll({ where: { pdc_id: id }, attributes: ['is_deleted'], include: { model: Organization, where: { isDeleted: 0 }, require: true, attributes: ['name'] }, raw: true }).then(async (result) => {
                    if (result && result.length > 0) {
                        const pdcOrgs = JSON.parse(JSON.stringify(result))
                        const orgs = []
                        result.map((org) => {
                            if (!org.organization) {
                                return
                            }
                            orgs.push(org.organization.name.toLowerCase() == process.env.HOST_ORG ? process.env.HOST_MSP : org.organization.name)
                        })

                        const approvedEntries = pdcOrgs.filter((org) => org.is_deleted === 1)
                        const approvedPercent = (approvedEntries.length * 100) / pdcOrgs.length
                        if (approvedPercent > 50) {
                            const organization = await Organization.findOne({
                                attributes: ['blockchain_name'],
                                where: {
                                    id: req.user.organization_id,
                                    isDeleted: 0,
                                },
                                raw: true,
                            })
                            await ProjectPdcCategory.destroy({ where: { id } })
                            await networkHelper.removeMemberFromPDC(organization, pdcName.pdc_name, orgs, req.user)
                        }
                    }
                })
                res.json('Approved')
            }
        } else {
            res.json('Invalid Link')
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

// Check for existing PDC name
router.post('/check-pdc-name', async (req, res) => {
    try {
        const { name, pdc_name, checkPDCName = false } = req.body
        let where = { name }
        if (checkPDCName) {
            where = { pdc_name }
        }
        const existingPDCName = await ProjectPdcCategory.findOne({
            attributes: ['id'],
            where,
        })

        if (existingPDCName) {
            res.status(200).json({ code: 400 })
        } else {
            res.status(200).json({ code: 200 })
        }
    } catch (err) {
        res.json({ error: err.message || err.toString() })
    }
})

const _savePdcChildrens = async ({ pdc_category_id, pdcData, events, createdBy, orgList = [], currentUser }) => {
    const organizations = []
    const participants = []
    const organizationIds = []
    const categoryIds = []

    orgList.organization.map((orgId) => {
        organizationIds.push(orgId)
        organizations.push({
            org_id: orgId,
            pdc_id: pdc_category_id,
        })
    })
    orgList.participants.map((orgId) => {
        categoryIds.push(orgId)
        participants.push({
            participant_id: orgId,
            pdc_id: pdc_category_id,
        })
    })
    const participantOrganizations = await OrganizationCategories.findAll({
        attributes: ['org_id'],
        where: {
            category_id: { [Op.in]: categoryIds },
        },
        raw: true,
    })
    if (pdc_category_id) {
        // Selected organizations
        const orgEntries = []
        const pdcEvents = []
        const projectPdcEvents = []

        const pdata = await pdcData.map(async (pdc) => {
            pdcEvents.push({ selection_id: pdc.id })
            projectPdcEvents.push({
                project_category_id: pdc_category_id,
                is_submit_selected: !!(pdc.userIds.submit && pdc.userIds.submit.length) || 0,
                event_id: pdc.id,
            })
            let { submit, see, accept } = pdc.userIds

            // For who can submit was not selected
            if (!submit || !submit.length) {
                const organizationList = await Organization.findAll({ attributes: ['id'], include: [{ model: User, attributes: [['id', 'user_id']] }], where: { id: { [Op.in]: organizationIds }, isDeleted: 0 } })
                const orgParticipants = await OrganizationCategories.findAll({
                    include: [
                        {
                            attributes: ['id'],
                            model: Organization,
                            include: [{ model: User, attributes: [['id', 'user_id']] }],
                            required: true,
                            where: {
                                sync_status: 2,
                                isApproved: 1,
                                isDeleted: 0,
                            },
                        },
                    ],
                    where: { category_id: { [Op.in]: categoryIds } },
                })
                let userIds = []
                organizationList.map(async (org) => {
                    org.users.map((user) => {
                        userIds.push(user.dataValues.user_id)
                    })
                })
                orgParticipants.map((participant) => {
                    participant.organization.users.map((user) => {
                        userIds.push(user.dataValues.user_id)
                    })
                })
                submit = _.uniq(userIds)
            }

            const ids = _.uniq(submit.concat(submit, see, accept))
            ids.map((id) => {
                orgEntries.push({
                    pdc_category_id,
                    submit_user_id: submit.includes(id) ? id : 0,
                    see_user_id: see.includes(id) ? id : 0,
                    accept_user_id: accept.includes(id) ? id : 0,
                    event_id: pdc.id,
                })
            })
        })
        await Promise.all(pdata)

        const allOrgIds = _.union(
            organizationIds,
            participantOrganizations.map((org) => org.org_id),
        )

        await ProjectPdcCategoryEvent.bulkCreate(projectPdcEvents)

        if (orgList.organization.length) {
            await PdcOrgs.bulkCreate(organizations)
        }
        if (orgList.participants.length) {
            await PdcParticipants.bulkCreate(participants)
        }
        if (orgEntries.length) {
            await PdcOrganization.bulkCreate(orgEntries)
        }
        if (allOrgIds.length) {
            const orgIds = allOrgIds.map((orgId) => ({
                org_id: orgId,
                is_approved: currentUser.organization_id == orgId ? 1 : 0,
                pdc_id: pdc_category_id,
            }))
            await PdcOrgApprovals.bulkCreate(orgIds)
        }

        await PdcSelection.bulkCreate(pdcEvents)

        if (createdBy) {
            await sendPdcApprovalEmail(allOrgIds, pdc_category_id, currentUser)
        }
    }
}

const sendPdcApprovalEmail = async (orgIds, pdc_category_id, currentUser) => {
    try {
        const PDCMembers = await User.findAll({
            where: {
                organization_id: {
                    [Op.in]: orgIds,
                },
                role_id: { [Op.in]: [process.env.ROLE_CEO, process.env.ROLE_SENIOR_MANAGER] },
                isDeleted: 0,
            },
            include: [{ model: Organization, required: true, where: { isDeleted: 0 } }],
        })

        //Fetch current user organization
        const loggedOrg = await Organization.findOne({
            attributes: ['name'],
            where: {
                id: currentUser.organization_id,
                isDeleted: 0,
            },
        })

        if (PDCMembers.length) {
            PDCMembers.forEach(async (user) => {
                //Don't send email to current loggedin user
                if (currentUser.id != user.id) {
                    const { email, organization, language } = user
                    const languageJson = await getLanguageJson(language)

                    if (user && organization && organization.name && organization.id && email) {
                        const replacements = {
                            URL: process.env.SITE_URL,
                            orgName: loggedOrg.name,
                            approvalLink: `${SITE_URL}/participant?org=${organization.id}&pdc=${pdc_category_id}&approval=true`,
                            approvePDC: languageJson.emailContent.approvePDC,
                            linkText: languageJson.emailContent.notSeeApprovePdc,
                            approvePDCBtn: languageJson.emailContent.approvePDCBtn,
                            oborInfo: languageJson.emailContent.oborInfo,
                        }
                        const htmlToSend = prepareEmailBody('email', 'pdc-approval-mail', replacements)
                        const message = {
                            from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
                            to: email,
                            subject: languageJson.pdcCategory.pdcEmailSubject,
                            html: htmlToSend,
                        }
                        emailSender.sendMail(message)
                    }
                }
            })
        }
    } catch (error) {
        throw error
    }
}

const sendPdcDeleteApprovalEmail = async (pdc, pdcId) => {
    try {
        const { name, pdc_orgs } = pdc
        const orgIds = []
        pdc_orgs.forEach((org) => {
            if (org.org_id) {
                orgIds.push(org.org_id)
            }
        })
        const users = await User.findAll({
            where: {
                organization_id: {
                    [Op.in]: orgIds,
                },
                role_id: [process.env.ROLE_SENIOR_MANAGER, process.env.ROLE_CEO],
                isDeleted: 0,
            },
            include: [{ model: Organization, required: true, where: { isDeleted: 0 } }],
        })
        if (users.length) {
            users.forEach(async (user) => {
                const { email, organization, language } = user
                const languageJson = await getLanguageJson(language)

                if (user && organization && organization.name && organization.id && email) {
                    const replacements = {
                        URL: process.env.SITE_URL,
                        orgName: organization.name,
                        pdcName: name,
                        approvalLink: `${SITE_URL}/participant?org=${organization.id}&&pdc=${pdcId}`,
                        wantsToDeletePDC: languageJson.emailContent.wantsToDeletePDC,
                        clickToApprove: languageJson.emailContent.clickToApprove,
                        approve: languageJson.emailContent.approve,
                        linkText: languageJson.emailContent.notSeeApprove,
                        oborInfo: languageJson.emailContent.oborInfo,
                    }
                    const htmlToSend = prepareEmailBody('email', 'delete-pdc-approval-mail', replacements)
                    const message = {
                        from: `${languageJson.compName.toUpperCase()} <${MAIL_EMAIL_ID}>`,
                        to: email,
                        subject: languageJson.pdcCategory.pdcDeleteEmailSubject,
                        html: htmlToSend,
                    }
                    emailSender.sendMail(message)
                }
            })
        }
    } catch (err) {
        console.log('email error ', err)
    }
}

module.exports = router
