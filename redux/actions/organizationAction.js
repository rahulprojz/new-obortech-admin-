import { FETCH_ORANIZATION } from '../types'
import { fetchOrgs } from '../../lib/api/organization'

export const fetchOrgsAction = () => async (dispatch) => {
    const organizations = await fetchOrgs()
    dispatch({ type: FETCH_ORANIZATION, payload: organizations })
}
