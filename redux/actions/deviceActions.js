import { DEVICE_DETAILS } from '../types'
import { fetchDetails } from '../../lib/api/device-contracts'

export const deviceDetails = (id) => async (dispatch) => {
    try {
        const response = await fetchDetails(id)
        if (response) {
            dispatch({
                type: DEVICE_DETAILS,
                payload: response,
            })
        }
    } catch (err) {
        console.log({ err })
    }
}
