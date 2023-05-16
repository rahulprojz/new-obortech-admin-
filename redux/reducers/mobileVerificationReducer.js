import { POST_MOBILE_OTP_REQUEST, POST_MOBILE_OTP_SUCCESS, POST_MOBILE_OTP_FAILURE } from "../types";

const initialState = {
    loading: false,
    payload: null,
    error: null
}

export const mobileVerificationReducer = (state = initialState, { payload, type }) => {
    switch(type) {
        case POST_MOBILE_OTP_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case POST_MOBILE_OTP_SUCCESS: {
            return {
                ...state,
                loading: false,
                payload: payload,
                error: null
            }
        }
        case POST_MOBILE_OTP_FAILURE: {
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