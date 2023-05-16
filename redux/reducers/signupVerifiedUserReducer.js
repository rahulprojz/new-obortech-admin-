import { POST_SIGNUP_VERIFIED_USER_REQUEST, POST_SIGNUP_VERIFIED_USER_SUCCESS, POST_SIGNUP_VERIFIED_USER_FAILURE, CLEAR_SIGNUP_VERIFIED_USER_STATE } from "../types";

const initialState = {
    loading: false,
    payload: null,
    error: null
}

export const signupVerifiedUser = (state = initialState, { payload, type }) => {
    switch(type) {
        case POST_SIGNUP_VERIFIED_USER_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case POST_SIGNUP_VERIFIED_USER_SUCCESS: {
            return {
                ...state,
                loading: false,
                payload: payload,
                error: null
            }
        }
        case POST_SIGNUP_VERIFIED_USER_FAILURE: {
            return {
                ...state,
                loading: false,
                payload: null,
                error: payload
            }
        }
        case CLEAR_SIGNUP_VERIFIED_USER_STATE: {
            return {
                loading: false,
                payload: null,
                error: null
            }
        }
        default:
            return state;
    }
}