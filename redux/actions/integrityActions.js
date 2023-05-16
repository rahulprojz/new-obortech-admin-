import { INTEGRITY_SUBMIT_EVENTS_ERRORS } from '../types'

export const updateSubmitEventErrors = (data) => {
    return {
        type: INTEGRITY_SUBMIT_EVENTS_ERRORS,
        payload: data,
    }
}
