import { 
    FETCH_CITIES_REQUEST, 
    FETCH_CITIES_SUCCESS, 
    FETCH_CITIES_FAILURE, 
    FETCH_CITY_BY_ID_REQUEST,
    FETCH_CITY_BY_ID_SUCCESS,
    FETCH_CITY_BY_ID_FAILURE
} from "../types";
import { getAllCitiesApi, getCityByIdApi } from "../../lib/api/city";

const fetchCitiesRequest = () => {
    return {
      type: FETCH_CITIES_REQUEST
    }
}
  
const fetchCitiesSuccess = data => {
    return {
      type: FETCH_CITIES_SUCCESS,
      payload: data
    }
}

const fetchCitiesFailure = data => {
    return {
      type: FETCH_CITIES_FAILURE,
      payload: data
    }
}

const fetchCityByIdRequest = () => {
    return {
      type: FETCH_CITY_BY_ID_REQUEST
    }
}
  
const fetchCityByIdSuccess = data => {
    return {
      type: FETCH_CITY_BY_ID_SUCCESS,
      payload: data
    }
}

const fetchCityByIdFailure = data => {
    return {
      type: FETCH_CITY_BY_ID_FAILURE,
      payload: data
    }
}

export const getAllCities = code => async dispatch => {
    try {
        dispatch(fetchCitiesRequest())
        const response = await getAllCitiesApi(code);
        if(response.code === 200){
            dispatch(fetchCitiesSuccess(response.data))
        }else{
            dispatch(fetchCitiesFailure(response.data))
        }
    } catch (err) {
        dispatch(fetchCitiesFailure({ exception: err }))
    }
}

export const getCityById = (id) => async dispatch => {
    try {
        dispatch(fetchCityByIdRequest())
        const response = await getCityByIdApi(id);
        if(response.code === 200){
            dispatch(fetchCityByIdSuccess(response.data))
        }else{
            dispatch(fetchCityByIdFailure(response.data))
        }
    } catch (err) {
        dispatch(fetchCityByIdFailure({ exception: err }))
    }
}