import { getAllTypesApi } from "../../lib/api/user_type";
import { FETCH_USER_TYPES_REQUEST, FETCH_USER_TYPES_SUCCESS, FETCH_USER_TYPES_FAILURE } from "../types";

const fetchUserTypesRequest = () => {
    return {
      type: FETCH_USER_TYPES_REQUEST
    }
}

const fetchUserTypesSuccess = data => {
    return {
      type: FETCH_USER_TYPES_SUCCESS,
      payload: data
    }
}

const fetchUserTypesFailure = data => {
    return {
      type: FETCH_USER_TYPES_FAILURE,
      payload: data
    }
}

export const getAllTypes = () => async dispatch => {
    try {
        dispatch(fetchUserTypesRequest())
        const response = await getAllTypesApi();
        if(response.code === 200) {
            dispatch(fetchUserTypesSuccess(response.data))
        } else {
            dispatch(fetchUserTypesFailure(response.data))
        }
    } catch (err) {
        dispatch(fetchUserTypesFailure({ exception: err }))
    }
}
