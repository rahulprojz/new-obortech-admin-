import { FETCH_FORM_REQUEST, FETCH_FORM_REQUEST_SUCCESS, FETCH_FORM_REQUEST_FAILURE, FETCH_FORM_LIST_REQUEST, FETCH_FORM_LIST_REQUEST_FAILURE, FETCH_FORM_LIST_REQUEST_SUCCESS, ADD_FORM_REQUEST_SUCCESS } from '../types'

const initialState = {
    form: [],
    loading: false,
    formList: [],
}

const updateFormList = (state, payload) => {
    const formList = state.formList
    formList.push(payload)
    return {
        ...state,
        formList,
    }
}

export const formReducer = (state = initialState, { payload, type }) => {
    switch (type) {
        case FETCH_FORM_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case FETCH_FORM_REQUEST_SUCCESS: {
            return {
                ...state,
                loading: false,
                form: payload,
            }
        }
        case ADD_FORM_REQUEST_SUCCESS: {
            return updateFormList(state, payload)
        }
        case FETCH_FORM_REQUEST_FAILURE: {
            return {
                ...state,
                loading: false,
                form: [],
            }
        }

        case FETCH_FORM_LIST_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case FETCH_FORM_LIST_REQUEST_SUCCESS: {
            return {
                ...state,
                loading: false,
                formList: payload,
            }
        }
        case FETCH_FORM_LIST_REQUEST_FAILURE: {
            return {
                ...state,
                loading: false,
                formList: [],
            }
        }

        default:
            return state
    }
}
