// USERS TYPES:FETCH ALL
export const FETCH_USERS_REQUEST = 'FETCH_USERS_REQUEST'
export const FETCH_USERS_SUCCESS = 'FETCH_USERS_SUCCESS'
export const FETCH_USERS_FAILURE = 'FETCH_USERS_FAILURE'
// USERS TYPES:DELETE ONE
export const DELETE_USER_REQUEST = 'DELETE_USER_REQUEST'
export const DELETE_USER_SUCCESS = 'DELETE_USER_SUCCESS'
export const DELETE_USER_FAILURE = 'DELETE_USER_FAILURE'
// USERS TYPES:APPROVE ONE
export const APPROVE_USER_REQUEST = 'APPROVE_USER_REQUEST'
export const APPROVE_USER_SUCCESS = 'APPROVE_USER_SUCCESS'
export const APPROVE_USER_FAILURE = 'APPROVE_USER_FAILURE'

// SIGNUP ONBOARDING TYPES
export const SIGNUP = 'SIGNUP'
export const SIGNUP_VERIFIED = 'SIGNUP_VERIFIED'

export const CREATE_ORGANIZATION = 'CREATE_ORGANIZATION'
export const ORGANIZATION_NAME_EXISTS = 'ORGANIZATION_NAME_EXISTS'
export const USERNAME_EXISTS = 'USERNAME_EXISTS'
export const GET_USER_ROLES = 'GET_USER_ROLES'
export const VERIFY_EMAIL = 'VERIFY_EMAIL'
export const VERIFY_MOBILE = 'VERIFY_MOBILE'
export const ERROR_RESPONSE = 'ERROR_RESPONSE'

// SIGNUP VERIFIED USER
export const POST_ONBOARDING_ORG_USER_SIGNUP_REQUEST = 'POST_ONBOARDING_ORG_USER_SIGNUP_REQUEST'
export const POST_ONBOARDING_ORG_USER_SIGNUP_SUCCESS = 'POST_ONBOARDING_ORG_USER_SIGNUP_SUCCESS'
export const POST_ONBOARDING_ORG_USER_SIGNUP_FAILURE = 'POST_ONBOARDING_ORG_USER_SIGNUP_FAILURE'
export const CLEAR_ONBOARDING_ORG_USER_SIGNUP_STATE = 'CLEAR_ONBOARDING_ORG_USER_SIGNUP_STATE'

// SIGNUP VERIFIED USER
export const POST_SIGNUP_VERIFIED_USER_REQUEST = 'POST_SIGNUP_VERIFIED_USER_REQUEST'
export const POST_SIGNUP_VERIFIED_USER_SUCCESS = 'POST_SIGNUP_VERIFIED_USER_SUCCESS'
export const POST_SIGNUP_VERIFIED_USER_FAILURE = 'POST_SIGNUP_VERIFIED_USER_FAILURE'
export const CLEAR_SIGNUP_VERIFIED_USER_STATE = 'CLEAR_SIGNUP_VERIFIED_USER_STATE'

// USER CHECKS
export const POST_USER_EXISTS_REQUEST = 'POST_USER_EXISTS_REQUEST'
export const POST_USER_EXISTS_SUCCESS = 'POST_USER_EXISTS_SUCCESS'
export const POST_USER_EXISTS_FAILURE = 'POST_USER_EXISTS_FAILURE'
export const CLEAR_USER_EXISTS_STATE = 'CLEAR_USER_EXISTS_STATE'

// USER TYPES
export const FETCH_USER_TYPES_REQUEST = 'FETCH_USER_TYPES_REQUEST'
export const FETCH_USER_TYPES_SUCCESS = 'FETCH_USER_TYPES_SUCCESS'
export const FETCH_USER_TYPES_FAILURE = 'FETCH_USER_TYPES_FAILURE'

// USER ROLES
export const FETCH_USER_ROLES_REQUEST = 'FETCH_USER_ROLES_REQUEST'
export const FETCH_USER_ROLES_SUCCESS = 'FETCH_USER_ROLES_SUCCESS'
export const FETCH_USER_ROLES_FAILURE = 'FETCH_USER_ROLES_FAILURE'

// COUNTRY
export const FETCH_COUNTRIES_REQUEST = 'FETCH_COUNTRIES_REQUEST'
export const FETCH_COUNTRIES_SUCCESS = 'FETCH_COUNTRIES_SUCCESS'
export const FETCH_COUNTRIES_FAILURE = 'FETCH_COUNTRIES_FAILURE'

export const FETCH_COUNTRY_BY_CODE_REQUEST = 'FETCH_COUNTRY_BY_CODE_REQUEST'
export const FETCH_COUNTRY_BY_CODE_SUCCESS = 'FETCH_COUNTRY_BY_CODE_SUCCESS'
export const FETCH_COUNTRY_BY_CODE_FAILURE = 'FETCH_COUNTRY_BY_CODE_FAILURE'

// CITY
export const FETCH_CITIES_REQUEST = 'FETCH_CITIES_REQUEST'
export const FETCH_CITIES_SUCCESS = 'FETCH_CITIES_SUCCESS'
export const FETCH_CITIES_FAILURE = 'FETCH_CITIES_FAILURE'

export const FETCH_CITY_BY_ID_REQUEST = 'FETCH_CITY_BY_ID_REQUEST'
export const FETCH_CITY_BY_ID_SUCCESS = 'FETCH_CITY_BY_ID_SUCCESS'
export const FETCH_CITY_BY_ID_FAILURE = 'FETCH_CITY_BY_ID_FAILURE'

// MOBILE VERIFICATIONS
export const POST_MOBILE_OTP_REQUEST = 'POST_MOBILE_OTP_REQUEST'
export const POST_MOBILE_OTP_SUCCESS = 'POST_MOBILE_OTP_SUCCESS'
export const POST_MOBILE_OTP_FAILURE = 'POST_MOBILE_OTP_FAILURE'

// EMAIL VERIFICATIONS
export const POST_EMAIL_VERIFY_REQUEST = 'POST_EMAIL_VERIFY_REQUEST'
export const POST_EMAIL_VERIFY_SUCCESS = 'POST_EMAIL_VERIFY_SUCCESS'
export const POST_EMAIL_VERIFY_FAILURE = 'POST_EMAIL_VERIFY_FAILURE'

// USER TITLES
export const FETCH_USER_TITLES_REQUEST = 'FETCH_USER_TITLES_REQUEST'
export const FETCH_USER_TITLES_SUCCESS = 'FETCH_USER_TITLES_SUCCESS'
export const FETCH_USER_TITLES_FAILURE = 'FETCH_USER_TITLES_FAILURE'

// FORM
export const FETCH_FORM_REQUEST = 'FETCH_FORM_REQUEST'
export const FETCH_FORM_REQUEST_SUCCESS = 'FETCH_FORM_REQUEST_SUCCESS'
export const FETCH_FORM_REQUEST_FAILURE = 'FETCH_FORM_REQUEST_FAILURE'
export const FETCH_FORM_LIST_REQUEST = 'FETCH_FORM_LIST_REQUEST'
export const FETCH_FORM_LIST_REQUEST_SUCCESS = 'FETCH_FORM_LIST_REQUEST_SUCCESS'
export const FETCH_FORM_LIST_REQUEST_FAILURE = 'FETCH_FORM_LIST_REQUEST_FAILURE'
export const ADD_FORM_REQUEST = 'ADD_FORM_REQUEST'
export const ADD_FORM_REQUEST_SUCCESS = 'ADD_FORM_REQUEST_SUCCESS'
export const ADD_FORM_REQUEST_FAILURE = 'ADD_FORM_REQUEST_FAILURE'
export const UPDATE_FORM_REQUEST = 'UPDATE_FORM_REQUEST'
export const UPDATE_FORM_REQUEST_SUCCESS = 'UPDATE_FORM_REQUEST_SUCCESS'
export const UPDATE_FORM_REQUEST_FAILURE = 'UPDATE_FORM_REQUEST_FAILURE'

// GENERAL DATA PROTECTION REGULATION - GDPR
export const TOGGLE_USER_DATA_REQUEST_DIRECT_LINK = 'TOGGLE_USER_DATA_REQUEST_DIRECT_LINK'

// To see all projects event
export const TOGGLE_IS_WATCH_ALL = 'TOGGLE_IS_WATCH_ALL'

// SIDEBAR MENU
export const SET_SIDEBAR_MENU_LIST = 'SET_SIDEBAR_MENU_LIST'
export const REMOVE_PROJECT_FROM_MENU_LIST = 'REMOVE_PROJECT_FROM_MENU_LIST'

// Events
export const FETCH_EVENTS = 'FETCH_EVENTS'

// Organization
export const FETCH_ORANIZATION = 'FETCH_ORANIZATION'

// Unseen Counts
export const FETCH_UNSEENCOUNT = 'FETCH_UNSEENCOUNT'

// Custom Labels
export const SET_CUSTOM_LABELS = 'SET_CUSTOM_LABELS'
export const RESET_CUSTOM_LABELS = 'RESET_CUSTOM_LABELS'

// Public User
export const SET_TRACK_ITEM_DETAIL = 'SET_TRACK_ITEM_DETAIL'
export const RESET_TRACK_ITEM_DETAIL = 'RESET_TRACK_ITEM_DETAIL'
export const TOGGLE_TRACK_ITEM_MODAL = 'TOGGLE_TRACK_ITEM_MODAL'

// Integrity checks
export const INTEGRITY_SUBMIT_EVENTS_ERRORS = 'INTEGRITY_SUBMIT_EVENTS_ERRORS'

export const DEVICE_DETAILS = 'DEVICE_DETAILS'

// Subscription
export const CHECK_SUBSCRIPTION = 'CHECK_SUBSCRIPTION'
export const SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED'
export const SUBSCRIPTION_CLOSED = 'SUBSCRIPTION_CLOSED'
export const SUBSCRIPTION_DETAILS = 'SUBSCRIPTION_DETAILS'
