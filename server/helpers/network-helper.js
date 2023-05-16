const db = require('../models')
const networkHooks = require('../hooks/network-hooks')
const mdb = require('../models/mangoose/index.model')

const Users = db.users
const Item = db.items
const ProjectEvent = db.project_events
const Organization = db.organizations
const Event = db.events
const Project = db.projects

// Add project
const addProjectToNetwork = async (req, project_id, uniqueId) => {
    try {
        const user = await Users.findOne({ include: [{ model: Organization, where: { isDeleted: 0 } }], where: { id: req.session.passport.user, isDeleted: 0 } })
        if (user) {
            const requestBody = {
                orgName: networkHooks.sanitize(user.organization.blockchain_name),
                userName: user.unique_id.toLowerCase(),
                addProjectReq: {
                    type: 'project',
                    uniqId: uniqueId,
                    added_by_org: user.organization.name.toString(),
                    added_by_user: user.username.toLowerCase().toString(),
                    project_id: project_id.toString(),
                    project_name: req.body.name.toString(),
                    temperature_alert_min: req.body.temperature_alert_min.toString(),
                    temperature_alert_max: req.body.temperature_alert_max.toString(),
                    temperature_alert_interval: req.body.temperature_alert_interval.toString(),
                    temperature_allowed_occurances: req.body.temperature_allowed_occurances.toString(),
                    humidity_alert_min: req.body.humidity_alert_min.toString(),
                    humidity_alert_max: req.body.humidity_alert_max.toString(),
                    humidity_alert_interval: req.body.humidity_alert_interval.toString(),
                    humidity_allowed_occurances: req.body.humidity_allowed_occurances.toString(),
                    ambience_threshold: req.body.ambience_threshold.toString(),
                },
            }
            await networkHooks.callNetworkApi('project', 'POST', requestBody, 'DEFAULT')
        }
    } catch (err) {
        console.log(err)
    }
}

// Add event submission
const addEventSubmission = async (event_json) => {
    try {
        const user = await Users.findOne({ include: [{ model: Organization, attributes: ['blockchain_name'], where: { isDeleted: 0 } }], where: { id: parseInt(event_json.user_id), isDeleted: 0 } })
        const item = await Item.findByPk(parseInt(event_json.item_id))
        if (user) {
            const eventSubmissinObj = await prepareNestedData(user, item, event_json)
            const requestBody = {
                orgName: networkHooks.sanitize(user.organization.blockchain_name),
                userName: user.unique_id.toLowerCase(),
                pdc: event_json.pdc_name,
                eventSubmission: eventSubmissinObj,
            }
            await networkHooks.callNetworkApi('events/submission', 'POST', requestBody, 'AWS')
        }
    } catch (err) {
        console.log(err)
    }
}

// Prepare nested event submission data
const prepareNestedData = async (user, item, event_json) => {
    const eventName = await networkHooks._getEventName(event_json.event_id, event_json.station_id, event_json.flag)
    // const projectEvent = await ProjectEvent.findOne({ event_submission_id: event_json.event_submission_id })
    const MProjectEvent = await mdb.project_event(user.organization.blockchain_name)
    const projectEvent = await MProjectEvent.findOne({ event_submission_id: event_json.event_submission_id })
    const eventSubmissionData = {
        type: 'eventSubmission',
        uniqId: event_json.event_submission_id,
        event_uniq_id: event_json.event_id,
        added_by_org: `${user.organization.blockchain_name}`,
        added_by_user: `${user.username}`.toLowerCase(),
        project_id: `${event_json.project_id}`,
        event_id: `${event_json.event_submission_id}`,
        event_name: `${eventName}`,
        due_date: event_json.due_date && event_json.due_date != 'null' ? `${event_json.due_date}` : `${projectEvent.createdAt}`,
        item_id: `${item.itemID}`,
        visible_to_orgs: event_json.visible_to_users && event_json.visible_to_users.length > 0 ? event_json.visible_to_users.join('|') : '',
    }

    // Add document in case of doucment event
    if (event_json.event_type == 'document') {
        eventSubmissionData.event_doc = {
            file_name: `${event_json.attachment}`,
            file_hash: `${event_json.file_hash}`,
            status: `${event_json.doc_status}`,
        }
    }

    const eventChilds = []
    if (event_json.childrens) {
        const promises = event_json.childrens.map(async (event_json) => {
            const childevnt = await prepareNestedData(user, item, event_json)
            childevnt.parent_id = projectEvent.event_submission_id
            eventChilds.push(childevnt)
        })
        await Promise.all(promises)
    }
    eventSubmissionData.childrens = eventChilds
    return eventSubmissionData
}

// Check user status
const removeMemberFromPDC = async (organization, pdc, memberOrgs, user) => {
    try {
        const requestBody = {
            orgName: networkHooks.sanitize(organization.blockchain_name),
            peerId: process.env.PEER_ID,
            chaincode: process.env.CHAINCODE_NAME,
            pdc,
            memberOrgs,
            userName: user.unique_id,
        }
        const getPDCResponse = await networkHooks._apiLock('removeMemberFromPDC', requestBody)
        if (getPDCResponse.success) {
            return getPDCResponse.data
        }
        return { success: false }
    } catch (err) {
        console.log(err)
        return { success: false }
    }
}

module.exports = {
    addProjectToNetwork,
    addEventSubmission,
    removeMemberFromPDC,
}
