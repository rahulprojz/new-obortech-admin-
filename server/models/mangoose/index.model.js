const projectEvents = require('./projectevent.model')
const tempNetworkEvent = require('./tempnetworkevent.model')

const db = {
    project_event: projectEvents,
    temp_network_event: tempNetworkEvent,
}

module.exports = db
