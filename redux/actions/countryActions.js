import { FETCH_COUNTRIES_REQUEST, FETCH_COUNTRIES_SUCCESS, FETCH_COUNTRIES_FAILURE, FETCH_COUNTRY_BY_CODE_REQUEST, FETCH_COUNTRY_BY_CODE_SUCCESS, FETCH_COUNTRY_BY_CODE_FAILURE  } from "../types";

import { getAllCountriesApi, getCountryByIdApi } from "../../lib/api/country";

const fetchCountriesRequest = () => {
    return {
      type: FETCH_COUNTRIES_REQUEST
    }
}
  
const fetchCountriesSuccess = data => {
    return {
      type: FETCH_COUNTRIES_SUCCESS,
      payload: data
    }
}
  
const fetchCountriesFailure = data => {
    return {
      type: FETCH_COUNTRIES_FAILURE,
      payload: data
    }
}

const fetchCountryByIdRequest = () => {
    return {
      type: FETCH_COUNTRY_BY_CODE_REQUEST
    }
}
  
const fetchCountryByIdSuccess = data => {
    return {
      type: FETCH_COUNTRY_BY_CODE_SUCCESS,
      payload: data
    }
}
  
const fetchCountryByIdFailure = data => {
    return {
      type: FETCH_COUNTRY_BY_CODE_FAILURE,
      payload: data
    }
}

export const getAllCountries = () => async dispatch => {
    try {
        dispatch(fetchCountriesRequest())
        const response = await getAllCountriesApi();
        if(response.code === 200){
            dispatch(fetchCountriesSuccess(response.data))
        }else{
            dispatch(fetchCountriesFailure(response.data))
        }
    } catch (err) {
        dispatch(fetchCountriesFailure({ exception: err }))
    }
}

export const getCountryById = (id) => async dispatch => {
    try {
        dispatch(fetchCountryByIdRequest())
        const response = await getCountryByIdApi(id);
        if(response.code === 200){
            dispatch(fetchCountryByIdSuccess(response.data))
        }else{
            dispatch(fetchCountryByIdFailure(response.data))
        }
    } catch (err) {
        dispatch(fetchCountryByIdFailure({ exception: err }))
    }
}