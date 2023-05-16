import { FETCH_ORANIZATION } from '../types'

const initState = {
    orgs: [],
}

export const organizationReducer = (state = initState, { payload, type }) => {
    switch (type) {
        case FETCH_ORANIZATION:
            return {
                ...state,
                orgs: payload,
            }
        default:
            return state
    }
}
