import { _momentGetDiff, getLocalTime, dynamicLanguageStringChange, _momentGetNormalFormat } from '../../utils/globalFunc'

const _fetchLocationLogs = async (locLogs) => {
    console.log({locLogs})
    try {
        if (locLogs?.code === 1) {
            // updateState({ mapData: locLogs.data })
            if (locLogs.data) {
                const { stations, locationlogs } = locLogs.data
                let markerObj = {}
                let markerLine = {}
                if (stations.length > 0) {
                    markerObj = {
                        stations,
                        startMarker: {
                            name: stations[0]?.station.name,
                            radius: stations[0]?.station.radius,
                            pos: [stations[0]?.station.latitude, stations[0]?.station.longitude],
                        },
                        endMarker: {
                            name: stations[stations.length - 1]?.station.name,
                            radius: stations[stations.length - 1]?.station.radius,
                            pos: [stations[stations.length - 1]?.station.latitude, stations[stations.length - 1]?.station.longitude],
                        },
                    }
                }
                if (locationlogs.length > 0) {
                    const arr = []
                    locationlogs.map((loc, idx) => {
                        let obj = {}
                        ;(obj.fromLat = loc.latitude), (obj.fromLong = loc.longitude), (obj.toLat = locationlogs[idx + 1]?.latitude), (obj.toLong = locationlogs[idx + 1]?.longitude)
                        arr.push(obj)
                        obj = {}
                    })
                    markerLine = {
                        polylines: arr,
                        mapMarker: [locationlogs[locationlogs.length - 1]?.latitude, locationlogs[locationlogs.length - 1]?.longitude],
                    }
                }
                console.log({markerObj})
                return { markerObj, markerLine }
            }
        }
    } catch (err) {
        console.error('Err in _fetchLocationLogs => ', err)
    }
}

const normalizeRoadArr = (borderInfo,activeRoadTrip) => {
    if (borderInfo?.length > 0) {
        const roadArr = []
        try {
            borderInfo.map((info, i) => {
                const tripsArr = []
                if (info.road.inside.length > 0) {
                    info.road.inside.map((ins, idx) => {
                        let status_class = 'active'

                        const borderInTime = getLocalTime(ins?.createdAt)
                        let borderOutTime = ''
                        if (info.road.outside[idx]?.createdAt) {
                            status_class = 'complete'
                            borderOutTime = getLocalTime(info.road.outside[idx]?.createdAt)
                        }

                        const diff_in_mins = _momentGetDiff(borderOutTime || moment().format('YYYY-MM-DD HH:mm:ss'), borderInTime, 'minutes')

                        tripsArr.push({
                            status_class,
                            borderInTime,
                            diff_in_mins,
                            borderOutTime,
                        })
                    })
                    activeRoadTrip[info.road.id] = tripsArr.length - 1
                }

                roadArr.push({
                    trips: tripsArr,
                    name: info.road.name,
                    road_id: info.road.id,
                    inside: info.road.inside,
                    outside: info.road.outside,
                })
            })
            return {roadArr,activeRoadTrip}
        } catch (err) {
            console.error('Err in normalizeRoadArr => ', err)
        }
    }
}


export { _fetchLocationLogs,normalizeRoadArr }
