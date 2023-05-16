import { FETCH_COUNTRIES_REQUEST, FETCH_COUNTRIES_SUCCESS, FETCH_COUNTRIES_FAILURE, FETCH_COUNTRY_BY_CODE_REQUEST, FETCH_COUNTRY_BY_CODE_SUCCESS, FETCH_COUNTRY_BY_CODE_FAILURE  } from "../types";

const initialState = {
    loading: false,
    payload: null,
    country: null,
    error: null
}

export const countryReducer = (state = initialState, { payload, type }) => {
    switch(type) {
        case FETCH_COUNTRIES_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case FETCH_COUNTRIES_SUCCESS: {
            return {
                ...state,
                loading: false,
                payload: payload,
                error: null
            }
        }
        case FETCH_COUNTRIES_FAILURE: {
            return {
                ...state,
                loading: false,
                payload: null,
                error: payload
            }
        }
        case FETCH_COUNTRY_BY_CODE_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case FETCH_COUNTRY_BY_CODE_SUCCESS: {
            return {
                ...state,
                loading: false,
                country: payload,
                error: null
            }
        }
        case FETCH_COUNTRY_BY_CODE_FAILURE: {
            return {
                ...state,
                loading: false,
                country: null,
                error: payload
            }
        }
        default:
            return state;
    }
}