import { INTEGRITY_SUBMIT_EVENTS_ERRORS } from '../types'

const initState = {
    submissionEventsError: [],
}

export const IntegrityCheckReducer = (state = initState, { payload, type }) => {
    let currentErrors = state.submissionEventsError
    const errorAlreadyExist = currentErrors.find(({ id }) => id === payload?.id)
    if (errorAlreadyExist) {
        const updatedArray = state.submissionEventsError.filter(({ id }) => id !== payload?.id)
        currentErrors = [...updatedArray, payload]
    } else {
        currentErrors = [...currentErrors, payload]
    }
    switch (type) {
        case INTEGRITY_SUBMIT_EVENTS_ERRORS:
            return {
                ...state,
                submissionEventsError: currentErrors,
            }
        default:
            return state
    }
}
