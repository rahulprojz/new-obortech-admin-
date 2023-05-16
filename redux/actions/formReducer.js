import {
    FETCH_FORM_REQUEST,
    FETCH_FORM_REQUEST_SUCCESS,
    FETCH_FORM_REQUEST_FAILURE,
    ADD_FORM_REQUEST,
    ADD_FORM_REQUEST_SUCCESS,
    ADD_FORM_REQUEST_FAILURE,
    FETCH_FORM_LIST_REQUEST,
    FETCH_FORM_LIST_REQUEST_SUCCESS,
    FETCH_FORM_LIST_REQUEST_FAILURE,
    UPDATE_FORM_REQUEST,
    UPDATE_FORM_REQUEST_SUCCESS,
    UPDATE_FORM_REQUEST_FAILURE,
} from '../types'

import { addFormData, fetchFormData, fetchFormListByUserIdRequest, updateFormData, deleteFormData } from '../../lib/api/formBuilder'

const fetchFormRequest = () => {
    return {
        type: FETCH_FORM_REQUEST,
    }
}

const fetchFormSuccess = (data) => {
    return {
        type: FETCH_FORM_REQUEST_SUCCESS,
        payload: data,
    }
}

const fetchFormFailure = (data) => {
    return {
        type: FETCH_FORM_REQUEST_FAILURE,
        payload: [],
    }
}

const fetchFormListRequest = () => {
    return {
        type: FETCH_FORM_LIST_REQUEST,
    }
}

const fetchFormListSuccess = (data) => {
    return {
        type: FETCH_FORM_LIST_REQUEST_SUCCESS,
        payload: data,
    }
}

const fetchFormListFailure = (data) => {
    return {
        type: FETCH_FORM_LIST_REQUEST_FAILURE,
        payload: [],
    }
}

const addFormRequest = () => {
    return {
        type: ADD_FORM_REQUEST,
    }
}

const addFormSuccess = (data) => {
    return {
        type: ADD_FORM_REQUEST_SUCCESS,
        payload: data,
    }
}

const addFormFailure = (data) => {
    return {
        type: ADD_FORM_REQUEST_FAILURE,
        payload: [],
    }
}

const updateFormRequest = () => {
    return {
        type: UPDATE_FORM_REQUEST,
    }
}

const updateFormSuccess = (data) => {
    return {
        type: UPDATE_FORM_REQUEST_SUCCESS,
        payload: data,
    }
}

const updateFormFailure = (data) => {
    return {
        type: UPDATE_FORM_REQUEST_FAILURE,
        payload: [],
    }
}

export const getFormListByUserId = (id) => async (dispatch) => {
    try {
        dispatch(fetchFormListRequest())
        const response = await fetchFormListByUserIdRequest(id)
        if (response.code === 200) {
            dispatch(fetchFormListSuccess(response.data))
        } else {
            dispatch(fetchFormListFailure(response))
        }
    } catch (err) {
        console.log(err)
        dispatch(fetchFormListFailure({ exception: err }))
    }
}

export const clearForm = () => (dispatch) => {
    dispatch(fetchFormFailure())
}

export const getFormById = (id) => async (dispatch) => {
    try {
        dispatch(fetchFormRequest())
        const response = await fetchFormData(id)
        if (response) {
            dispatch(fetchFormSuccess(response))
        } else {
            dispatch(fetchFormFailure(response))
        }
    } catch (err) {
        dispatch(fetchFormFailure({ exception: err }))
    }
}

export const addForm = (response) => async (dispatch) => {
    try {
        // dispatch(addFormRequest())
        // const response = await addFormData(data);
        // if (response.code === 200) {
        dispatch(addFormSuccess(response))
        // } else {
        //     dispatch(addFormFailure(response));
        // }
    } catch (err) {
        dispatch(addFormFailure({ exception: err }))
    }
}

export const updateForm = (data) => async (dispatch) => {
    try {
        dispatch(updateFormRequest())
        const response = await updateFormData(data)
        if (response.code === 200) {
            dispatch(updateFormSuccess(response))
        } else {
            dispatch(updateFormFailure(response))
        }
    } catch (err) {
        dispatch(updateFormFailure({ exception: err }))
    }
}

export const deleteForm = (data, callback) => async (dispatch) => {
    try {
        const response = await deleteFormData(data)
        if (response) {
            callback(true)
        } else {
            callback(false)
        }
    } catch (err) {
        callback(false)
    }
}
