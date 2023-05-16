import { SET_TRACK_ITEM_DETAIL, RESET_TRACK_ITEM_DETAIL, TOGGLE_TRACK_ITEM_MODAL } from '../types'
import { TRACK_ITEM_PAGE } from '../../components/header/Config'

const initialState = {
    isOpenTrackItemModal: false,
    projectId: 0,
    page: TRACK_ITEM_PAGE.EVENTS,
    itemId: 0,
    deviceId: 0,
}

export const publicUserReducer = (state = initialState, { payload, type }) => {
    switch (type) {
        case SET_TRACK_ITEM_DETAIL:
            return {
                ...state,
                ...payload,
            }

        case RESET_TRACK_ITEM_DETAIL:
            return {
                ...state,
                projectId: 0,
                page: TRACK_ITEM_PAGE.EVENTS,
                itemId: 0,
                deviceId: 0,
            }

        case TOGGLE_TRACK_ITEM_MODAL:
            return {
                ...state,
                isOpenTrackItemModal: !state.isOpenTrackItemModal,
            }

        default:
            return state
    }
}
