import { SET_CUSTOM_LABELS, RESET_CUSTOM_LABELS } from '../types'

const initialState = {
    labels: {
        group3: 'Group 3',
        group2: 'Group 2',
        group1: 'Group 1',
        item: 'Item',
    },
}

export const customLabelReducer = (state = initialState, { type, payload }) => {
    switch (type) {
        case SET_CUSTOM_LABELS: {
            return {
                ...state,
                labels: payload,
            }
        }
        case RESET_CUSTOM_LABELS:
            return initialState
        default:
            return state
    }
}
