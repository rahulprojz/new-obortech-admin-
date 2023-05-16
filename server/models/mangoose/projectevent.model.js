const mongoose = require('mongoose')
const { getConnectedDB } = require('../../helpers/vault-helper')

const { Schema } = mongoose

const projectEventSchema = Schema(
    {
        _id: Schema.Types.ObjectId,
        seq: { type: 'Number', default: 0 },
        id: { type: 'Number', default: null },
        event_name: { type: String, default: '' },
        local_event_name: { type: String, default: '' },
        projectName: { type: String, default: '' },
        groupName: { type: String, default: '' },
        truckName: { type: String, default: '' },
        containerName: { type: String, default: '' },
        itemName: { type: String, default: '' },
        deviceName: { type: String, default: '' },
        deviceTag: { type: String, default: '' },
        event_category_id: { type: 'Number', default: null },
        project_id: { type: 'Number', default: null },
        group_id: { type: 'Number', default: null },
        truck_id: { type: 'Number', default: null },
        item_id: { type: 'Number', default: null },
        container_id: { type: 'Number', default: null },
        device_id: { type: 'Number', default: null },
        road_id: { type: 'Number', default: null },
        work_id: { type: 'Number', default: null },
        form_id: { type: 'Number', default: null },
        event_submission_id: { type: String, default: '' },
        pdc_id: { type: String, default: '' },
        event_id: { type: String, default: '' },
        event_type: { type: String, default: '' },
        attachment: { type: String, default: '' },
        attachment_type: { type: 'Number', default: 1 },
        current_temp: { type: 'Number', default: 0 },
        current_hum: { type: 'Number', default: 0 },
        file_hash: { type: String, default: '' },
        image_url: { type: String, default: '' },
        isActive: { type: 'Number', default: 0 },
        document_deadline: { type: 'Number', default: 1 },
        location: { type: String, default: '' },
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        isAssetEvent: { type: Boolean, default: false },
        isAddedInBlockchain: { type: 'Number', default: 0 },
        due_date: { type: Date, default: null },
        has_sub_events: { type: 'Number', default: 0 },
        createdAt: { type: Date, default: new Date() },
        updatedAt: { type: Date, default: new Date() },
        integrity_status: { type: 'Number', default: null },
        integrity_error: { type: String, default: null },
        integrity_checked_at: { type: Date, default: null },
        tx_id: { type: String, default: null },
        transaction_id: { type: 'Number', default: null },
        is_child_event: { type: Boolean, default: null },
        isPublicEvent: { type: Boolean, default: false },
        stationName: { type: String, default: '' },
        isIotEventOn: { type: Boolean, default: false },
        isIotEventOff: { type: Boolean, default: false },
        isExpired: { type: Boolean, default: false },
        viewUsers: [
            {
                user_id: { type: 'Number', default: null },
                created_by: { type: 'Number', default: null },
                organization_id: { type: 'Number', default: null },
                viewed: { type: Boolean, default: false },
                // is_parent_event: { type: Boolean, default: false },
            },
        ],
        acceptUsers: [
            {
                organization_id: { type: 'Number', default: null },
                user_id: { type: 'Number', default: null },
                accepted: { type: Boolean, default: false },
                rejected: { type: Boolean, default: false },
            },
        ],
        projectEventAnswer: [
            {
                user_id: { type: 'Number', default: null },
                form_id: { type: 'Number', default: null },
                answers: { type: String, default: '' },
                form_data: { type: String, default: null },
                createdAt: { type: Date, default: new Date() },
                updatedAt: { type: Date, default: new Date() },
            },
        ],
        comments: [
            {
                _id: Schema.Types.ObjectId,
                user_id: { type: 'Number', default: null },
                comment: { type: String, default: '' },
                createdAt: { type: Date, default: new Date() },
                updatedAt: { type: Date, default: new Date() },
            },
        ],
        commentStatus: [
            {
                user_id: { type: 'Number', default: null },
                is_viewed: Boolean,
                createdAt: { type: Date, default: new Date() },
                updatedAt: { type: Date, default: new Date() },
            },
        ],
        documentSeenUsers: { type: Array, default: [] },
    },
    { timestamps: true },
)

const ProjectEvent = async (orgName) => {
    const mongoDB = await getConnectedDB(orgName)
    return mongoDB.model('project_events', projectEventSchema)
}

module.exports = ProjectEvent
