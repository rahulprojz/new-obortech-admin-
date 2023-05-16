import { FETCH_EVENTS } from '../types'
import { fetchEvents } from '../../lib/api/event'

export const fetchEventsAction = () => async (dispatch) => {
    const systemEvents = await fetchEvents()
    dispatch({ type: FETCH_EVENTS, payload: systemEvents })
}
