import { CLEAR_ONBOARDING_ORG_USER_SIGNUP_STATE, POST_ONBOARDING_ORG_USER_SIGNUP_REQUEST, POST_ONBOARDING_ORG_USER_SIGNUP_SUCCESS, POST_ONBOARDING_ORG_USER_SIGNUP_FAILURE, VERIFY_EMAIL, ORGANIZATION_NAME_EXISTS, USERNAME_EXISTS, ERROR_RESPONSE } from "../types";

const initialState = {
    loading: false,
    payload: null,
    error: null
}

export const siginupReducer = (state = initialState, { payload, type }) => {
    switch(type) {
        case POST_ONBOARDING_ORG_USER_SIGNUP_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case POST_ONBOARDING_ORG_USER_SIGNUP_SUCCESS: {
            return {
                ...state,
                loading: false,
                payload: payload,
                error: null
            }
        }
        case POST_ONBOARDING_ORG_USER_SIGNUP_FAILURE: {
            return {
                ...state,
                loading: false,
                payload: null,
                error: payload
            }
        }
        case CLEAR_ONBOARDING_ORG_USER_SIGNUP_STATE: {
            return {
                ...state,
                loading: false,
                payload: null,
                error: null
            }
        }
        case ORGANIZATION_NAME_EXISTS: {
            return {
                ...state,
                payload: {
                    ...state.payload,
                    nameExists: payload.data.nameExists
                }
            }
        }
        case USERNAME_EXISTS: {
            return {
                ...state,
                payload: {
                    ...state.payload,
                    usernameExists: payload.data.usernameExists
                }
            }
        }
        case ERROR_RESPONSE: {
            return {
                ...state,
                error: payload
            }
        }
        default:
            return state;
    }
}