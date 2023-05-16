const reducerOnboardingFields = (state, action) => {
    switch (action.type) {
        case 'updateOrgInfo':
            return { ...state, ...action.payload }
        case 'updateOrgDoc':
            return { ...state, ...action.payload }
            break

        default:
            return state
            break
    }
}

export default reducerOnboardingFields
