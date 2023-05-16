
import string from '../../utils/LanguageTranslation'

const ALL = { value: null, label: string.event.allGroup2 }

const reducerTruckNamesSelector = (state, action) => {
    switch (action.type) {
        case 'initialize':
            if (!action.payload.available.some((item) => item.label.includes('No Group 2'))) {
                if (action.payload.available && action.payload.available.length > 0) {
                    action.payload.available.unshift(ALL)
                }
                return { selected: ALL, available: action.payload.available }
            } else {
                return { selected: null, available: [] }
            }
        case 'onSelect':
            return { ...state, selected: action.payload.selected }
        case 'updateAvailable':
            action.payload.available.unshift(ALL)
            const available = action.payload.available.filter((a) => a.value != 1 || a.label != "No Group 2")
            return { ...state, available }

        case 'reset':
            return { ...state, selected: ALL }
        default:
            return state
            break
    }
}

export default reducerTruckNamesSelector
