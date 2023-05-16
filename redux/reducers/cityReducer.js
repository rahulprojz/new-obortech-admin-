import { 
    FETCH_CITIES_REQUEST, 
    FETCH_CITIES_SUCCESS, 
    FETCH_CITIES_FAILURE, 
    FETCH_CITY_BY_ID_REQUEST,
    FETCH_CITY_BY_ID_SUCCESS,
    FETCH_CITY_BY_ID_FAILURE
} from "../types";

const initialState = {
    loading: false,
    payload: null,
    city: null,
    error: null
}

export const cityReducer = (state = initialState, { payload, type }) => {
    switch(type) {
        case FETCH_CITIES_REQUEST: {
            return {
                ...state,
                loading: true,
            }
        }
        case FETCH_CITIES_SUCCESS: {
            return {
                ...state,
                loading: false,
                payload: payload,
                error: null
            }
        }
        case FETCH_CITIES_FAILURE: {
            return {
                ...state,
                loading: false,
                payload: null,
                error: payload
            }
        }
        case FETCH_CITY_BY_ID_REQUEST: {
            return {
                ...state,
                loading: true,

            }
        }
        case FETCH_CITY_BY_ID_SUCCESS: {
            return {
                ...state,
                loading: false,
                city: payload,
                error: null
            }
        }
        case FETCH_CITY_BY_ID_FAILURE: {
            return {
                ...state,
                loading: false,
                city: null,
                error: payload
            }
        }
        default:
            return state;
    }
}