import { TOGGLE_IS_WATCH_ALL } from "../types";

const initialState = {
    isWatchAll: false
}

export const watchAllReducer = (state = initialState, { type }) => {
    switch (type) {
        case TOGGLE_IS_WATCH_ALL: {
            return {
                ...state,
                isWatchAll: !state.isWatchAll,
            }
        }
        default:
            return state;
    }
}