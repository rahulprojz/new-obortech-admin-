import { FETCH_USER_TYPES_REQUEST, FETCH_USER_TYPES_SUCCESS, FETCH_USER_TYPES_FAILURE } from "../types";

const initialState = {
    loading: false,
    payload: null,
    error: null
}

export const userTypeReducer = (state = initialState, { payload, type }) => {
    switch(type) {
        case FETCH_USER_TYPES_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case FETCH_USER_TYPES_SUCCESS: {
            return {
                ...state,
                loading: false,
                payload: payload,
                error: null
            }
        }
        case FETCH_USER_TYPES_FAILURE: {
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