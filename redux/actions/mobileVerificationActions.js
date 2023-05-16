import { POST_MOBILE_OTP_REQUEST, POST_MOBILE_OTP_SUCCESS, POST_MOBILE_OTP_FAILURE } from "../types";
import { sendOtpApi, verifyOtpApi } from "../../lib/api/auth";

const postMobileOtpRequest = () => {
    return {
      type: POST_MOBILE_OTP_REQUEST
    }
}

const postMobileOtpSuccess = data => {
    return {
      type: POST_MOBILE_OTP_SUCCESS,
      payload: data
    }
}

const postMobileOtpFailure = data => {
    return {
      type: POST_MOBILE_OTP_FAILURE,
      payload: data
    }
}

export const sendOtp = data => async dispatch => {
    try {
        dispatch(postMobileOtpRequest())
        const response = await sendOtpApi(data);
        if(response.code === 1){
            dispatch(postMobileOtpSuccess(response))
        }else{
            dispatch(postMobileOtpFailure(response))
        }
    } catch (err) {
        dispatch(postMobileOtpFailure({ exception: err }))
    }
}

export const verifyOtp = data => async dispatch => {
    try {
        dispatch(postMobileOtpRequest())
        const response = await verifyOtpApi(data);
        if(response.code === 1){
            dispatch(postMobileOtpSuccess({...response, verified: true}))
        }else{
            dispatch(postMobileOtpFailure({...response, verified: false}))
        }
    } catch (err) {
        dispatch(postMobileOtpFailure({ exception: err }))
    }
}
