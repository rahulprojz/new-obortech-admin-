import { FETCH_USER_ROLES_REQUEST, FETCH_USER_ROLES_SUCCESS, FETCH_USER_ROLES_FAILURE } from "../types";
import { getAllRolesApi } from "../../lib/api/role";

const fetchUserRolesRequest = () => {
    return {
      type: FETCH_USER_ROLES_REQUEST
    }
}

const fetchUserRolesSuccess = data => {
    return {
      type: FETCH_USER_ROLES_SUCCESS,
      payload: data
    }
}

const fetchUserRolesFailure = data => {
    return {
      type: FETCH_USER_ROLES_FAILURE,
      payload: data
    }
}

export const getAllRoles = () => async dispatch => {
    try {
        dispatch(fetchUserRolesRequest())
        const response = await getAllRolesApi();
        if(response.code === 200){
            dispatch(fetchUserRolesSuccess(response.data))
        }else{
            dispatch(fetchUserRolesFailure(response.data))
        }
    } catch (err) {
        dispatch(fetchUserRolesFailure({ exception: err }))
    }
}