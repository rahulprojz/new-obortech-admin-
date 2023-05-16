import { SET_TRACK_ITEM_DETAIL, RESET_TRACK_ITEM_DETAIL, TOGGLE_TRACK_ITEM_MODAL } from '../types'

export const setTrackItemDetail = (data) => ({
    type: SET_TRACK_ITEM_DETAIL,
    payload: data,
})

export const resetTrackItemDetail = () => ({
    type: RESET_TRACK_ITEM_DETAIL,
})

export const toggleTrackItemModal = () => ({
    type: TOGGLE_TRACK_ITEM_MODAL,
})
