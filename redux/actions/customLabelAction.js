import { SET_CUSTOM_LABELS, RESET_CUSTOM_LABELS } from '../types'
import { otherLanguage } from '../../utils/selectedLanguage'

export const setCustomLabels = (labels) => (dispatch) => {
    const payload = {
        group1: !otherLanguage ? labels.group1 : labels.local_group1 || labels.group1,
        group2: !otherLanguage ? labels.group2 : labels.local_group2 || labels.group2,
        group3: !otherLanguage ? labels.group3 : labels.local_group3 || labels.group3,
        item: !otherLanguage ? labels.item : labels.local_item || labels.item,
    }
    dispatch({
        type: SET_CUSTOM_LABELS,
        payload,
    })
}

export const resetCustomLabels = () => ({
    type: RESET_CUSTOM_LABELS,
})
