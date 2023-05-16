import { getAllTitlesApi } from "../../lib/api/user_title";
import { FETCH_USER_TITLES_REQUEST, FETCH_USER_TITLES_SUCCESS, FETCH_USER_TITLES_FAILURE } from "../types";


const fetchUserTitlesRequest = () => {
    return {
      type: FETCH_USER_TITLES_REQUEST
    }
}
  
const fetchUserTitlesSuccess = data => {
    return {
      type: FETCH_USER_TITLES_SUCCESS,
      payload: data
    }
}
  
const fetchUserTitlesFailure = data => {
    return {
      type: FETCH_USER_TITLES_FAILURE,
      payload: data
    }
}

export const getAllTitles = () => async dispatch => {
    try {
        dispatch(fetchUserTitlesRequest())
        const response = await getAllTitlesApi();
        if(response.code === 200) {
            dispatch(fetchUserTitlesSuccess(response.data))
        } else {
            dispatch(fetchUserTitlesFailure(response.data))
        }
    } catch (err) {
        dispatch(fetchUserTitlesFailure({ exception: err }))
    }
}