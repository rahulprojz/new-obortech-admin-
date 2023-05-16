import { CLEAR_ONBOARDING_ORG_USER_SIGNUP_STATE, POST_ONBOARDING_ORG_USER_SIGNUP_REQUEST, POST_ONBOARDING_ORG_USER_SIGNUP_SUCCESS, POST_ONBOARDING_ORG_USER_SIGNUP_FAILURE, VERIFY_EMAIL, ORGANIZATION_NAME_EXISTS, USERNAME_EXISTS, ERROR_RESPONSE } from '../types'
import { registerUser, existsByNameApi, existsByUsernameApi } from '../../lib/api/signup'

const completeOnboardingSignupRequest = () => {
    return {
        type: POST_ONBOARDING_ORG_USER_SIGNUP_REQUEST,
    }
}

const completeOnboardingSignupSuccess = (data) => {
    return {
        type: POST_ONBOARDING_ORG_USER_SIGNUP_SUCCESS,
        payload: data,
    }
}

const completeOnboardingSignupFailure = (data) => {
    return {
        type: POST_ONBOARDING_ORG_USER_SIGNUP_FAILURE,
        payload: data,
    }
}

export const completeOnobarding = (data) => async (dispatch) => {
    try {
        dispatch(completeOnboardingSignupRequest())
        const response = await registerUser(data)
        if (response.code === 200) {
            dispatch(completeOnboardingSignupSuccess(response.data))
        } else {
            dispatch(completeOnboardingSignupFailure(response.data))
        }
    } catch (err) {
        dispatch(completeOnboardingSignupFailure({ exception: err }))
    }
}

export const clearOnboardingSignupState = () => (dispatch) => {
    dispatch({ type: CLEAR_ONBOARDING_ORG_USER_SIGNUP_STATE })
}

export const existsByName = (name) => async (dispatch) => {
    const data = await existsByNameApi(name)
    dispatch({
        type: ORGANIZATION_NAME_EXISTS,
        payload: data,
    })
}

export const existsByUsername = (username) => async (dispatch) => {
    try {
        const data = await existsByUsernameApi(username)
        dispatch({
            type: USERNAME_EXISTS,
            payload: data,
        })
    } catch (err) {
        dispatch({
            type: ERROR_RESPONSE,
            payload: { data, exception: err.response.data },
        })
    }
}
