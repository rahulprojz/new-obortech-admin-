import { POST_EMAIL_VERIFY_REQUEST, POST_EMAIL_VERIFY_SUCCESS, POST_EMAIL_VERIFY_FAILURE } from "../types";

const initialState = {
    loading: false,
    payload: null,
    error: null
}

export const emailVerificationReducer = (state = initialState, { payload, type }) => {
    switch(type) {
        case POST_EMAIL_VERIFY_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case POST_EMAIL_VERIFY_SUCCESS: {
            return {
                ...state,
                loading: false,
                payload: payload,
                error: null
            }
        }
        case POST_EMAIL_VERIFY_FAILURE: {
            return {
                ...state,
                loading: false,
                payload: null,
                error: payload
            }
        }
        default:
            return state;
    }
}