import { FETCH_USER_TITLES_REQUEST, FETCH_USER_TITLES_SUCCESS, FETCH_USER_TITLES_FAILURE } from "../types";

const initialState = {
    loading: false,
    payload: null,
    error: null
}

export const userTitleReducer = (state = initialState, { payload, type }) => {
    switch(type) {
        case FETCH_USER_TITLES_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case FETCH_USER_TITLES_SUCCESS: {
            return {
                ...state,
                loading: false,
                payload: payload,
                error: null
            }
        }
        case FETCH_USER_TITLES_FAILURE: {
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