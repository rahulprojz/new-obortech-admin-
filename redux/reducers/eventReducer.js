import { FETCH_EVENTS } from '../types'

const initState = {
    eventList: [],
}

export const EventReducer = (state = initState, { payload, type }) => {
    switch (type) {
        case FETCH_EVENTS:
            return {
                ...state,
                eventList: payload,
            }
        default:
            return state
    }
}
