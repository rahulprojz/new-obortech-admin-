import { POST_USER_EXISTS_REQUEST, POST_USER_EXISTS_SUCCESS, POST_USER_EXISTS_FAILURE, CLEAR_USER_EXISTS_STATE } from "../types";
import { verifyUserExistsApi } from "../../lib/api/onboarding"

const verifyUserExistsRequest = () => {
    return {
      type: POST_USER_EXISTS_REQUEST
    }
}

const verifyUserExistsSuccess = data => {
    return {
      type: POST_USER_EXISTS_SUCCESS,
      payload: data
    }
}

const verifyUserExistsFailure = data => {
    return {
      type: POST_USER_EXISTS_FAILURE,
      payload: data
    }
}

export const verifyUserExists = data => async dispatch => {
    try {
        dispatch(verifyUserExistsRequest())
        const response = await verifyUserExistsApi(data);
        if(response.code === 200){
            dispatch(verifyUserExistsSuccess(response.data))
        }else{
            dispatch(verifyUserExistsFailure(response.data))
        }
    } catch (err) {
        dispatch(verifyUserExistsFailure({ exception: err }))
    }
}

export const clearUserExistsState = () => dispatch => {
    dispatch({ type: CLEAR_USER_EXISTS_STATE })
}
