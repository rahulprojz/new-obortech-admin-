import string from '../../utils/LanguageTranslation'
const ALL = { value: null, label: string.event.allGroup1 }
// const ALL = { value: null, label: string.all }

const reducerContainerNamesSelectorWatchAll = (state, action) => {
    switch (action.type) {
        case 'initialize':
            if (action.payload.available && action.payload.available.length > 0) {
                action.payload.available.unshift(ALL)
            }
            return { selected: ALL, available: action.payload.available }
        case 'changeTitle':
            state.available[0] = { value: null, label: action.payload }
            if (state.selected?.value === null) {
                state.selected = { value: null, label: action.payload }
            }
            return { ...state }
        case 'onSelect':
            return { ...state, selected: action.payload.selected || ALL }
        case 'updateAvailable':
            action.payload.available.unshift(ALL)
            return { ...state, available: action.payload.available }
        case 'reset':
            return { ...state, selected: ALL }
        default:
            return state
    }
}

export default reducerContainerNamesSelectorWatchAll
