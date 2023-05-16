const mongoose = require('mongoose')
const { getConnectedDB } = require('../../helpers/vault-helper')

const { Schema } = mongoose

const tempNetworkEvent = Schema({
    project_event_id: { type: String, default: '' },
    event: { type: String, default: '' },
    createdAt: { type: Date, default: new Date() },
    updatedAt: { type: Date, default: new Date() },
})

const TempNetworkEvent = async (orgName) => {
    const mongoDB = await getConnectedDB(orgName)
    return mongoDB.model('temp_network_events', tempNetworkEvent)
}

module.exports = TempNetworkEvent
