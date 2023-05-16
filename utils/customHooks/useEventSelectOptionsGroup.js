import useReactSelectOptionObj from './useReactSelectOptionObj'

/**
 * This extracts the Array from the property and get the proper option require select.
 * @param {string} propertyFor the needed option
 * @param {string} innerObj
 * @param {string} label
 * @returns Array
 */
const useEventSelectOptionsGroup = (projSelection, propertyFor) => {
    let innerObj = ''
    let label = ''
    let optionLabel = ''
    switch (propertyFor) {
        case 'selection_groups':
            innerObj = 'group'
            label = 'groupID'
            break
        case 'selection_trucks':
            innerObj = 'truck'
            label = 'truckID'
            break
        case 'selection_containers':
            innerObj = 'container'
            label = 'containerID'
            break
        case 'selection_items':
            innerObj = 'item'
            label = 'itemID'
            break
        case 'selection_devices':
            innerObj = 'device'
            label = 'tag'
            optionLabel = 'deviceID'
            break
        default:
            break
    }
    if (projSelection && Array.isArray(projSelection)) {
        const groups = projSelection.flatMap((proj) => {
            return proj[propertyFor]?.map((grp) => grp[innerObj])
        })
        return useReactSelectOptionObj(groups, label, optionLabel)
    }
    return []
}

export default useEventSelectOptionsGroup
