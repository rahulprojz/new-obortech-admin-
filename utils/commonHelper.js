const sanitizeOrgName = (string) => {
    return string
        ? string
              .toString()
              .replace(/[^a-zA-Z]/g, '')
              .toLowerCase()
        : ''
}

const alertEventsArr = [
    process.env.tempAlertEventId,
    process.env.humidityAlertEventId,
    process.env.sealOpenAlertEventId,
    process.env.sealLockAlertEventId,
    process.env.borderInEventId,
    process.env.borderOutEventid,
    process.env.projectFinishedEventId,
    process.env.attachTamperAlertEventId,
    process.env.detachTamperAlertEventId,
]

module.exports = { sanitizeOrgName, alertEventsArr }
