import { TOGGLE_USER_DATA_REQUEST_DIRECT_LINK } from "../types";

const initialState = {
    dataRequestFromEmail: false
}

export const gdprReducer = (state = initialState, { type }) => {
    switch (type) {
        case TOGGLE_USER_DATA_REQUEST_DIRECT_LINK: {
            return {
                ...state,
                dataRequestFromEmail: !state.dataRequestFromEmail,
            }
        }

        default:
            return state;
    }
}