import { DEVICE_DETAILS } from '../types'

const initialState = {
    deviceCounts: null,
}

export const deviceReducer = (state = initialState, { payload, type }) => {
    switch (type) {
        case DEVICE_DETAILS: {
            return {
                ...state,
                deviceCounts:payload,
            }
        }
        default:
            return state
    }
}
