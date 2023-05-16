import { uniqBy } from 'lodash'
import { groupBy } from './globalFunc'
import { alertEventsArr } from './commonHelper'

const generateFilterEvents = (EventsList, categoryEvents) => {
    const filteredList = []
    EventsList.map((eventObj) => {
        const eventList = []
        eventObj?.val?.map((event) => {
            const eventObj = categoryEvents.find((categoryEvent) => categoryEvent.uniqId == event?.event_id)
            const isSystemEvent = alertEventsArr.includes(event?.event_id)
            if (eventObj && !isSystemEvent) {
                eventList.push({ ...event, project_event: { ...event, event: eventObj } })
            }
        })
        if (eventList.length) {
            const values = uniqBy(eventList, (el) => el._id)
            filteredList.push({ key: eventObj.key, val: values })
        }
    })

    // we need this list to remove the continues fetch api call
    const filterEventValues = filteredList.map((list) => list.val)
    const filterEventArray = [].concat.apply([], filterEventValues)

    return filterEventArray
}

const setNewData = (eventLabelType, categoryEvents, timeSelectorFilter) => {
    const allEventsArr = []
    if (eventLabelType != '' && timeSelectorFilter != '' && timeSelectorFilter != 'undefined') {
        eventLabelType.forEach((values, keys) => {
            const nameList = values.map((ev, i) => {
                return ev
            })
            allEventsArr.push({ key: keys, val: nameList })
        })
        return generateFilterEvents(allEventsArr, categoryEvents)
    }
}

export const getGroupedData = (projectEvents, groupfilter, categoryEvents) => {
    let response
    if (groupfilter == 'day') {
        response = groupBy(projectEvents, (ev) => ev.createdAt, 'MMM Do YYYY', 'day')
    } else if (groupfilter == 'week') {
        response = groupBy(projectEvents, (ev) => ev.createdAt, 'MMM Do YYYY', 'week')
    } else {
        response = groupBy(projectEvents, (ev) => ev.createdAt, 'MMMM, YYYY', 'month')
    }
    // eventLabelType = response
    return setNewData(response, categoryEvents)
}
