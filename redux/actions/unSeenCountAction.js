import { FETCH_UNSEENCOUNT } from '../types'
import { fetchUnseenEvents } from '../../lib/api/project-event'

export const fetchUnSeenCountAction = (projectId, userId) => async (dispatch) => {
    const unseenEvents = await fetchUnseenEvents({
        project_id: parseInt(projectId),
        user_id: parseInt(userId),
    })
    dispatch({ type: FETCH_UNSEENCOUNT, payload: unseenEvents.count })
}
