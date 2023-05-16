const moment = require('moment-timezone')
const { getDistance } = require('geolib')

const getLocalTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
    const timezoneOffset = new Date().getTimezoneOffset()
    return moment(date, 'YYYY-MM-DD HH:mm:ss').add(-timezoneOffset, 'minutes').format(format)
}

const _momentDate = (date = new Date()) => {
    return moment(date)
}

const _momentGetDiff = (startDate = new Date(), endDate, limit) => {
    return _momentDate(startDate).diff(_momentDate(endDate), limit)
}

const getLocationArray = (borderInfo) => {
    const activeRoadTrip = []
    try {
        if (borderInfo && borderInfo.length > 0) {
            const roadArr = []
            try {
                borderInfo.map((info, i) => {
                    const tripsArr = []
                    if (info.station.inside.length > 0) {
                        info.station.inside.map((ins, idx) => {
                            let status_class = 'active'
                            const inside = ins || {}
                            const borderInTime = getLocalTime(inside.createdAt)
                            let borderOutTime = ''
                            const outSideObj = info.station.outside[idx]
                            if (outSideObj && outSideObj.createdAt) {
                                status_class = 'complete'
                                borderOutTime = getLocalTime(outSideObj.createdAt)
                            }

                            const diff_in_mins = _momentGetDiff(borderOutTime || moment().format('YYYY-MM-DD HH:mm:ss'), borderInTime, 'minutes')

                            tripsArr.push({
                                status_class,
                                borderInTime,
                                diff_in_mins,
                                borderOutTime,
                            })
                        })
                        activeRoadTrip[info.station.id] = tripsArr.length - 1
                    }

                    roadArr.push({
                        trips: tripsArr,
                        name: info.station.name,
                        road_id: info.station.id,
                        inside: info.station.inside,
                        outside: info.station.outside,
                    })
                })

                return { activeRoadTrip, roadArr }
            } catch (err) {
                console.log(err)
                return []
            }
        }
    } catch (err) {
        console.log(err)
        return []
    }
}

// Get project trip stats
const getProjectTripStats = (borderInfo, project, locationlogs) => {
    try {
        const { is_completed, completed_date } = project
        let started_datetime = ''
        let last_border_outtime = ''
        let total_distance_covered = 0
        let started_datetime_formatted = 0
        let total_diff_in_days = 0
        let total_diff_in_hours = 0
        let total_diff_in_mins = 0
        if (locationlogs && !locationlogs.length) {
            return {}
        }
        // First location
        const startingPosition = borderInfo[0] && borderInfo[0].station
        const lastLocation = locationlogs && locationlogs[locationlogs.length - 1]

        if (startingPosition && lastLocation) {
            total_distance_covered = getDistance({ latitude: startingPosition.latitude, longitude: startingPosition.longitude }, { latitude: lastLocation.latitude, longitude: lastLocation.longitude })
        }
        total_distance_covered /= 1000
        let timeDiff
        borderInfo.map((info, i) => {
            if (info.station.inside.length <= 0) {
                return false
            }
            const currentDif = _momentGetDiff(moment().format('YYYY-MM-DD HH:mm:ss'), getLocalTime(info.station.inside[0].createdAt), 'hours')
            if (currentDif > timeDiff || !started_datetime) {
                started_datetime = getLocalTime(info.station.inside[0].createdAt)
                timeDiff = currentDif
            }
        })

        // If border out exists, otherwise take current date
        if (borderInfo[borderInfo.length - 1] && borderInfo[borderInfo.length - 1].station.outside.length > 0) {
            borderInfo[borderInfo.length - 1].station.outside.map((out_road, j) => {
                last_border_outtime = getLocalTime(out_road.createdAt)
            })
        } else if (is_completed) {
            last_border_outtime = getLocalTime(completed_date)
        } else {
            last_border_outtime = moment().format('YYYY-MM-DD HH:mm:ss')
        }

        if (last_border_outtime) {
            started_datetime_formatted = started_datetime || ''
            const total_travelled_time = _momentGetDiff(last_border_outtime, started_datetime, 'hours')

            total_diff_in_days = Math.floor(total_travelled_time / 24)
            const diff_in_hours = Math.floor(total_travelled_time - total_diff_in_days * 24)

            total_diff_in_hours = diff_in_hours > 60 ? Math.floor(diff_in_hours / 60) : diff_in_hours
            total_diff_in_mins = _momentGetDiff(last_border_outtime, started_datetime, 'minutes')
            total_diff_in_mins -= total_travelled_time * 60
        }
        const returnArr = {
            started_datetime_formatted,
            total_diff_in_days,
            total_diff_in_hours,
            total_diff_in_mins,
            total_distance_covered,
        }
        return returnArr
    } catch (err) {
        console.error('Err in getProjectTripStats => ', err)
    }
}

exports.getLocationArray = getLocationArray
exports.getProjectTripStats = getProjectTripStats
