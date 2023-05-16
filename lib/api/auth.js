import sendRequest from './sendRequest'
import sendRequestWithFile from './sendRequestWithFile'
const BASE_PATH = '/api/v1/auth'

export const login = (data) =>
    sendRequest(`${BASE_PATH}/login`, {
        body: JSON.stringify(data),
    })

export const notification = (data) =>
    sendRequest(`${BASE_PATH}/notifications`, {
        body: JSON.stringify(data),
    })

export const markNotificationAsRead = (data) =>
    sendRequest(`${BASE_PATH}/marknotificationasread`, {
        body: JSON.stringify(data),
    })

export const forgotpassword = (data) =>
    sendRequest(`${BASE_PATH}/forgotpassword`, {
        body: JSON.stringify(data),
    })

export const resetpassword = (data) =>
    sendRequest(`${BASE_PATH}/resetpassword`, {
        body: JSON.stringify(data),
    })

export const fetchProfile = ({ slug }) =>
    sendRequest(`${BASE_PATH}/profile/${slug}`, {
        method: 'GET',
    })

export const saveProfile = (data) =>
    sendRequest(`${BASE_PATH}/profile`, {
        body: JSON.stringify(data),
    })

export const uploadImage = (data) =>
    sendRequestWithFile(`${BASE_PATH}/uploadimage`, {
        body: data,
    })

export const sendOtpApi = (data) =>
    sendRequest(`${BASE_PATH}/sendotp`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

export const verifyOtpApi = (data) =>
    sendRequest(`${BASE_PATH}/verifyotp`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

export const sendEmailOtp = (data) =>
    sendRequest(`${BASE_PATH}/send-email-otp`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

export const verifyEmailOtp = (data) =>
    sendRequest(`${BASE_PATH}/verify-email`, {
        method: 'POST',
        body: JSON.stringify(data),
    })

export const checkUserNameIsAvailable = (data) =>
    sendRequest(`${BASE_PATH}/user-isvalid`, {
        body: JSON.stringify(data),
    })

export const validateEmail = (email) =>
    sendRequest(`${BASE_PATH}/validate-email/${email}`, {
        method: 'GET',
    })

export const sendOtp = (data) =>
    sendRequest(`${BASE_PATH}/send-otp`, {
        body: JSON.stringify(data),
    })

export const setNewPassword = (data) =>
    sendRequest(`${BASE_PATH}/set-new-password`, {
        body: JSON.stringify(data),
    })

export const removeUserSession = (data) =>
    sendRequest(`${BASE_PATH}/remove-user-session`, {
        body: JSON.stringify(data),
    })

export const refreshAccessToken = (data) =>
    sendRequest(`${BASE_PATH}/refresh-token`, {
        body: JSON.stringify(data),
    })

export const getchGeoLocation = () =>
    sendRequest(`${BASE_PATH}/geo-location`, {
        method: 'GET',
    })
