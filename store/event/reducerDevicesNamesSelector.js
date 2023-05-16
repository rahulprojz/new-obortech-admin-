import string from '../../utils/LanguageTranslation'
const ALL = { value: null, label: string.event.allDevice }

const reducerDeviceNamesSelector = (state, action) => {
    switch (action.type) {
        case 'initialize':
            if (!action.payload.available.some((item) => item.label.includes('No Device'))) {
                if (action.payload.available && action.payload.available.length > 0) {
                    action.payload.available.unshift(ALL)
                }
                return { selected: ALL, available: action.payload.available }
            } else {
                return { selected: null, available: [] }
            }
        case 'onSelect':
            return { ...state, selected: action.payload.selected }
        case 'updateAvailable': {
            if (!action.payload.available.some((item) => item.label.includes('No Device'))) {
                action.payload.available.unshift(ALL)
                return { ...state, available: action.payload.available }
            } else {
                return { selected: null, available: [] }
            }
        }
        case 'reset':
            return { ...state, selected: ALL }
        default: {
            return state
        }
    }
}

export default reducerDeviceNamesSelector
