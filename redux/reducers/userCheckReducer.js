import { POST_USER_EXISTS_REQUEST, POST_USER_EXISTS_SUCCESS, POST_USER_EXISTS_FAILURE, CLEAR_USER_EXISTS_STATE } from "../types";

const initialState = {
    loading: false,
    payload: null,
    error: null
}

export const userCheckReducer = (state = initialState, { payload, type }) => {
    switch(type) {
        case POST_USER_EXISTS_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case POST_USER_EXISTS_SUCCESS: {
            return {
                ...state,
                loading: false,
                payload: payload,
                error: null
            }
        }
        case POST_USER_EXISTS_FAILURE: {
            return {
                ...state,
                loading: false,
                payload: null,
                error: payload
            }
        }
        case CLEAR_USER_EXISTS_STATE: {
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