import { FETCH_UNSEENCOUNT } from '../types'

const initState = {
    orgs: [],
}

export const unSeenCountReducer = (state = initState, { payload, type }) => {
    switch (type) {
        case FETCH_UNSEENCOUNT:
            return {
                ...state,
                count: payload,
            }
        default:
            return state
    }
}
