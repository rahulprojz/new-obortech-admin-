
import string from '../../utils/LanguageTranslation'

const ALL = { value: null, label: string.event.allGroup2 }

const reducerTruckNamesSelector = (state, action) => {
    switch (action.type) {
        case 'initialize':
            if (action.payload.available && action.payload.available.length > 0) {
                action.payload.available.unshift(ALL)
            }
            return { selected: ALL, available: action.payload.available }
        case 'onSelect':
            return { ...state, selected: action.payload.selected }
        case 'updateAvailable':
            action.payload.available.unshift(ALL)
            return { ...state, available: action.payload.available }

        case 'reset':
            return { ...state, selected: ALL }
        default:
            return state
            break
    }
}

export default reducerTruckNamesSelector
