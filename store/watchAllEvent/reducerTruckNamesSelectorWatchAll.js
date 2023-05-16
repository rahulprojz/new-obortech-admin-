import string from '../../utils/LanguageTranslation'
const ALL = { value: null, label: string.event.allGroup2 }
// const ALL = { value: null, label: string.all }

const reducerTruckNamesSelectorWatchAll = (state, action) => {
    switch (action.type) {
        case 'initialize': {
            if (action.payload.available && action.payload.available.length > 0) {
                action.payload.available.unshift(ALL)
            }
            const available = action.payload.available.filter((a) => a.value != 1)
            return { selected: ALL, available }
        }
        case 'onSelect':
            return { ...state, selected: action.payload.selected || ALL }
        case 'updateAvailable': {
            action.payload.available.unshift(ALL)

            const available = action.payload.available.filter((a) => a.value != 1)
            return { ...state, available: available }
        }
        case 'reset':
            return { ...state, selected: ALL }
        default:
            return state
    }
}

export default reducerTruckNamesSelectorWatchAll
