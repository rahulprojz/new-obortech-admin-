import useReactSelectOptionObj from './useReactSelectOptionObj'

/**
 * This extracts the Array from the property and get the proper option require select.
 * @param {string} propertyFor the needed option
 * @param {string} innerObj
 * @param {string} label
 * @returns Array
 */
const useWatchAllEventSelectOptionsGroup = (project, propertyFor, type = 'allProject') => {
    let innerObj = ''
    let label = ''
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
        case 'selection_project':
            label = 'name'
            break
        default:
            break
    }
    if (type == 'allProject') {
        if (project && Array.isArray(project)) {
            let groups = project.flatMap((proj) => {
                return proj.project_selections.flatMap((projectSelect) => {
                    return projectSelect[propertyFor].map((grp) => {
                        return grp[innerObj]
                    })
                })
            })
            return useReactSelectOptionObj(groups, label)
        }
    } else if (type == 'selection_project') {
        if (project && Array.isArray(project)) {
            return useReactSelectOptionObj(project, label)
        }
    } else {
        if (project && Array.isArray(project)) {
            let groups = project.flatMap((proj) => {
                return proj.flatMap((projectSelect) => {
                    return projectSelect[propertyFor].map((grp) => {
                        return grp[innerObj]
                    })
                })
            })
            return useReactSelectOptionObj(groups, label)
        }
    }
    return []
}

export default useWatchAllEventSelectOptionsGroup
