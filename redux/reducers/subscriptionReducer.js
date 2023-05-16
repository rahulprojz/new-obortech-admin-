import { CHECK_SUBSCRIPTION, SUBSCRIPTION_CLOSED, SUBSCRIPTION_DETAILS } from '../types'

const initialState = {
    subscriptionPlan: '',
    planExpireIn: null,
    subscriptionDetails: {
        subscriptionInfo: null,
        counts: null,
    },
    error: {
        message: '',
        title: '',
        show: false,
    },
}

export const subscriptionReducer = (state = initialState, { payload, type }) => {
    switch (type) {
        case CHECK_SUBSCRIPTION: {
            return {
                ...state,
                ...payload,
            }
        }
        case SUBSCRIPTION_CLOSED: {
            return {
            ...state,
                error: payload,
            }
        }
        case SUBSCRIPTION_DETAILS: {
            return {
                ...state,
                subscriptionDetails: payload,
            }
        }
        default:
            return state
    }
}
