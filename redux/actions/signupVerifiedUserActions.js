import { POST_SIGNUP_VERIFIED_USER_REQUEST, POST_SIGNUP_VERIFIED_USER_SUCCESS, POST_SIGNUP_VERIFIED_USER_FAILURE, CLEAR_SIGNUP_VERIFIED_USER_STATE } from '../types'
import { POST_USER_EXISTS_REQUEST, POST_USER_EXISTS_SUCCESS, POST_USER_EXISTS_FAILURE, CLEAR_USER_EXISTS_STATE } from '../types'

import { checkEmail } from '../../lib/api/onboarding'

const signupVerifedUserRequest = () => {
    return {
        type: POST_USER_EXISTS_REQUEST,
    }
}

const signupVerifedUserSuccess = (data) => {
    return {
        type: POST_USER_EXISTS_SUCCESS,
        payload: data,
    }
}

const signupVerifedUserFailure = (data) => {
    return {
        type: POST_USER_EXISTS_FAILURE,
        payload: data,
    }
}

export const signupVerifedUser = (data) => async (dispatch) => {
    try {
        dispatch(signupVerifedUserRequest())
        const response = await checkEmail(data)
        if (response.code === 200) {
            dispatch(signupVerifedUserSuccess(response.data))
        } else {
            dispatch(signupVerifedUserFailure(response.data))
        }
    } catch (err) {
        dispatch(signupVerifedUserFailure({ exception: err }))
    }
}

export const clearUserExistsState = () => (dispatch) => {
    dispatch({ type: CLEAR_USER_EXISTS_STATE })
}
