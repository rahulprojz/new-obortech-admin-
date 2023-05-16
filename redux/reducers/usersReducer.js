import { 
    FETCH_USERS_REQUEST, 
    FETCH_USERS_SUCCESS, 
    FETCH_USERS_FAILURE,
    DELETE_USER_REQUEST, 
    DELETE_USER_SUCCESS, 
    DELETE_USER_FAILURE,
    APPROVE_USER_REQUEST, 
    APPROVE_USER_SUCCESS, 
    APPROVE_USER_FAILURE } from "../types";

const initialState = {
    loading: false,
    payload: { users: null, user: null, message: "" },
    error: null,
}

export const usersReducer = (state = initialState, { payload, type }) => {
    switch(type) {
        case FETCH_USERS_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case FETCH_USERS_SUCCESS: {
            return {
                ...state,
                loading: false,
                payload: { ...state.payload, users: payload },
                error: null
            }
        }
        case FETCH_USERS_FAILURE: {
            return {
                ...state,
                loading: false,
                payload: null,
                error: payload
            }
        }
        case DELETE_USER_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case DELETE_USER_SUCCESS: {
            return {
                ...state,
                loading: false,
                // payload: state.payload.filter(user => payload.id !== user.id),
                message: payload.message,
                error: null,
            }
        }
        case DELETE_USER_FAILURE: {
            return {
                ...state,
                loading: false,
                payload: null,
                error: payload,
                message: payload.message,
            }
        }
        case APPROVE_USER_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case APPROVE_USER_SUCCESS: {
            return {
                ...state,
                loading: false,
                message: payload.message,
                error: null,
            }
        }
        case APPROVE_USER_FAILURE: {
            return {
                ...state,
                loading: false,
                error: payload,
                message: payload.message,
            }
        }
        default:
            return state;
    }
}