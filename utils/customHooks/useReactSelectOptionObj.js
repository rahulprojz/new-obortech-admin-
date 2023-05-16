import { uniqBy, filter } from 'lodash'

/**
 * This function converts provided array into key value
 * @param {Array} selectOption - Array of the Selection Group
 * @param {string} label - Key to fetch Label
 * @returns Array of value and label as object.
 */
const useReactSelectOptionObj = (selectOption, label, optionLabel, value = 'id') => {
    if (Array.isArray(selectOption) && label) {
        return filter(
            uniqBy(
                selectOption.map((option) => {
                    if (option) {
                        return {
                            value: option.selection_id ? `${option[value]}_${option.selection_id}` : option[value],
                            label: option[label] || option[optionLabel],
                        }
                    }
                }),
                'value',
            ),
        )
    }
    return []
}

export default useReactSelectOptionObj
