import { FETCH_USER_ROLES_REQUEST, FETCH_USER_ROLES_SUCCESS, FETCH_USER_ROLES_FAILURE } from "../types";

const initialState = {
    loading: false,
    payload: null,
    error: null
}

export const roleReducer = (state = initialState, { payload, type }) => {
    switch(type) {
        case FETCH_USER_ROLES_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case FETCH_USER_ROLES_SUCCESS: {
            return {
                ...state,
                loading: false,
                payload: payload,
                error: null
            }
        }
        case FETCH_USER_ROLES_FAILURE: {
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