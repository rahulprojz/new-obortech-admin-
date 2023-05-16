import { POST_EMAIL_VERIFY_REQUEST, POST_EMAIL_VERIFY_SUCCESS, POST_EMAIL_VERIFY_FAILURE } from "../types";
import { verifyEmailIdApi } from "../../lib/api/onboarding";

const postEmailVerifyRequest = () => {
    return {
      type: POST_EMAIL_VERIFY_REQUEST
    }
}

const postEmailVerifySuccess = data => {
    return {
      type: POST_EMAIL_VERIFY_SUCCESS,
      payload: data
    }
}

const postEmailVerifyFailure = data => {
    return {
      type: POST_EMAIL_VERIFY_FAILURE,
      payload: data
    }
}

export const verifyEmailId = (data) => async dispatch => {
    try {
        dispatch(postEmailVerifyRequest())
        const response = await verifyEmailIdApi(data)
        if(response.code === 200){
            dispatch(postEmailVerifySuccess(response.data))
        }else{
            dispatch(postEmailVerifyFailure(response.data))
        }
    } catch (err) {
        dispatch(postEmailVerifyFailure({ exception: err }))
    }
}
