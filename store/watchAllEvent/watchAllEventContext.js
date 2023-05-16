import { createContext, useReducer, useEffect, useState, useMemo } from 'react'
import _ from 'lodash'
import { useSelector } from 'react-redux'
import useWatchAllEventSelectOptionsGroup from '../../utils/customHooks/useWatchAllEventSelectOptionsGroup'
import reducerContainerNamesSelectorWatchAll from './reducerContainerNamesSelectorWatchAll'
import reducerGroupNamesSelectorWatchAll from './reducerGroupNamesSelectorWatchAll'
import reducerItemsNamesSelectorWatchAll from './reducerItemsNamesSelectorWatchAll'
import reducerProjectNamesSelectorWatchAll from './reducerProjectNamesSelectorWatchAll'
import reducerTruckNamesSelectorWatchAll from './reducerTruckNamesSelectorWatchAll'
import { getCustomLabels } from '../../redux/selectors/customLabelSelector'
import { dynamicLanguageStringChange } from '../../utils/globalFunc'
import string from '../../utils/LanguageTranslation'
const WatchAllEventContext = createContext({})

const advanceSearchOptions = [
    { value: 'eventDateRange', label: string.event.filterByDateRange },
    { value: 'eventOrganization', label: string.event.filterByOrganization },
    { value: 'eventUser', label: string.event.filterByUser },
    { value: 'timelineSeparator', label: string.timelineSelector },
    { value: 'eventAndDocuments', label: string.event.showAllEvents },
    { value: 'allContent', label: string.event.searchFromAllContent },
    { value: 'searchByPDC', label: string.event.searchByPDC },
    { value: 'hideEvents', label: string.event.hideEvents },
    { value: 'clearFilter', label: string.event.clearFilter },
]

export const WatchAllEventContextProvider = (props) => {
    const labels = useSelector(getCustomLabels)
    const [projectNames, dispatchProjectNames] = useReducer(reducerProjectNamesSelectorWatchAll, {})
    const [groupNames, dispatchGroupNames] = useReducer(reducerGroupNamesSelectorWatchAll, { labels, available: [{ label: `${dynamicLanguageStringChange(string.event.allGroup3, labels)}`, value: null }] })
    const [truckNames, dispatchTruckNames] = useReducer(reducerTruckNamesSelectorWatchAll, { labels, available: [{ label: `${dynamicLanguageStringChange(string.event.allGroup2, labels)}`, value: null }] })
    const [containersName, dispatchContainersName] = useReducer(reducerContainerNamesSelectorWatchAll, { labels, available: [{ label: `${dynamicLanguageStringChange(string.event.allGroup1, labels)}`, value: null }] })
    const [itemsNames, dispatchItemsNames] = useReducer(reducerItemsNamesSelectorWatchAll, { labels, available: [{ label: `${dynamicLanguageStringChange(string.event.allItem, labels)}`, value: null }] })
    const [advanceFilterSelection, setAdvanceFilterSelection] = useState(advanceSearchOptions[1])

    const updateList = {
        group: [{ key: 'selection_project', function: dispatchProjectNames, value: groupNames }],
        truck: [
            { key: 'selection_project', function: dispatchProjectNames, value: truckNames },
            { key: 'selection_groups', function: dispatchGroupNames, value: truckNames },
        ],
        container: [
            { key: 'selection_project', function: dispatchProjectNames, value: containersName },
            { key: 'selection_groups', function: dispatchGroupNames, value: containersName },
            { key: 'selection_trucks', function: dispatchTruckNames, value: containersName },
        ],
        item: [
            { key: 'selection_project', function: dispatchProjectNames, value: itemsNames },
            { key: 'selection_groups', function: dispatchGroupNames, value: itemsNames },
            { key: 'selection_trucks', function: dispatchTruckNames, value: itemsNames },
            { key: 'selection_containers', function: dispatchContainersName, value: itemsNames },
        ],
    }

    const filterProjectSelection = (elem) => {
        const rules = [true]

        if (itemsNames?.selected?.value) {
            rules.push(elem.selection_items[0]?.item_id == itemsNames.selected.value)
        }
        if (containersName?.selected?.value) {
            rules.push(elem.selection_containers[0]?.container_id == containersName.selected.value)
        }
        if (truckNames?.selected?.value) {
            rules.push(elem.selection_trucks[0]?.truck_id == truckNames.selected.value)
        }
        if (groupNames?.selected?.value) {
            rules.push(elem.selection_groups[0]?.group_id == groupNames.selected.value)
        }
        if (projectNames.selected.value) {
            rules.push(elem.project_id == projectNames.selected.value)
        }
        return _.every(rules)
    }

    /**
     * Filter Removes No Group Options from the Groups
     */
    const filterNoGroup = (groupsArray) => {
        if (groupsArray.length > 0) {
            return groupsArray.filter((group) => group?.label !== 'No Group 3')
        }
        return groupsArray
    }

    /**
     * Filter Removes No Truck Options from the Trucks
     */
    const filterNoTruck = (trucksArray) => {
        if (trucksArray.length > 0) {
            return trucksArray.filter((truck) => truck?.label !== 'No Group 2')
        }
        return trucksArray
    }

    const filterGroup = (project, selectionFilter) => {
        const selections = selectionFilter.filter((s) => s && s.length)
        const selectionGroupFilter = project.map((proj) =>
            proj.project_selections.filter((selection) => {
                if (projectNames?.selected?.value) return selection.project_id == _.get(selections, '0.0.project_id')
                if (groupNames?.selected?.value) return selection.project_id == _.get(selections, '0.0.project_id') || _.get(selection, 'selection_groups.0.group_id') == _.get(selections, '0.0.selection_groups.0.group_id') // FOR No Group 3
                return true
            }),
        )

        dispatchGroupNames({
            type: 'updateAvailable',
            payload: { available: useWatchAllEventSelectOptionsGroup(selectionGroupFilter, 'selection_groups', 'selectionsOnly') },
        })
    }
    const filterTruck = (project, selectionFilter) => {
        const selections = selectionFilter.filter((s) => s && s.length)
        const selectionTruckFilter = project.map((proj) =>
            proj.project_selections.filter((selection) => {
                if (groupNames?.selected?.value) {
                    return _.get(selection, 'selection_groups.0.group_id') == _.get(selections, '0.0.selection_groups.0.group_id') && selection.project_id == _.get(selections, '0.0.project_id')
                }
                if (projectNames?.selected?.value) return selection.project_id == _.get(selections, '0.0.project_id')
                return true
            }),
        )
        dispatchTruckNames({
            type: 'updateAvailable',
            payload: { available: useWatchAllEventSelectOptionsGroup(selectionTruckFilter, 'selection_trucks', 'selectionsOnly') },
        })
    }

    const filterContainer = (project, selectionFilter) => {
        const selections = selectionFilter.filter((s) => s && s.length)
        const selectionContainerFilter = project.map((proj) =>
            proj.project_selections.filter((selection) => {
                // For No group and No truck
                if (truckNames?.selected?.value === 1 || groupNames?.selected?.value === 1) {
                    return _.get(selection, 'selection_trucks.0.truck_id') == _.get(selections, '0.0.selection_trucks.0.truck_id') && _.get(selection, 'selection_groups.0.group_id') == _.get(selections, '0.0.selection_groups.0.group_id') && selection.project_id == _.get(selections, '0.0.project_id')
                }
                if (truckNames?.selected?.value) return _.get(selection, 'selection_trucks.0.truck_id') == _.get(selections, '0.0.selection_trucks.0.truck_id')
                if (groupNames?.selected?.value) return _.get(selection, 'selection_groups.0.group_id') == _.get(selections, '0.0.selection_groups.0.group_id')
                if (projectNames?.selected?.value) return selection.project_id == _.get(selections, '0.0.project_id')
                return true
            }),
        )
        dispatchContainersName({
            type: 'updateAvailable',
            payload: { available: useWatchAllEventSelectOptionsGroup(selectionContainerFilter, 'selection_containers', 'selectionsOnly') },
        })
    }
    const filterItem = (project, selectionFilter) => {
        const selections = selectionFilter.filter((s) => s && s.length)
        const selectionItemFilter = project.map((proj) =>
            proj.project_selections.filter((selection) => {
                if (containersName?.selected?.value) return _.get(selection, 'selection_containers.0.container_id') == _.get(selections, '0.0.selection_containers.0.container_id')
                if (truckNames?.selected?.value) return _.get(selection, 'selection_trucks.0.truck_id') == _.get(selections, '0.0.selection_trucks.0.truck_id')
                if (groupNames?.selected?.value) return _.get(selection, 'selection_groups.0.group_id') == _.get(selections, '0.0.selection_groups.0.group_id')
                if (projectNames?.selected?.value) return selection.project_id == _.get(selections, '0.0.project_id')
                return true
            }),
        )
        dispatchItemsNames({
            type: 'updateAvailable',
            payload: { available: useWatchAllEventSelectOptionsGroup(selectionItemFilter, 'selection_items', 'selectionsOnly') },
        })
    }

    const filterParentDepandencies = (project, selectionFilter) => {
        filterGroup(project, selectionFilter)
        filterTruck(project, selectionFilter)
        filterContainer(project, selectionFilter)
        filterItem(project, selectionFilter)
    }

    const selectedProject = useMemo(() => {
        if (projectNames && Array.isArray(projectNames.selected)) {
            return projectNames.selected[0].value
        } else if (projectNames && !Array.isArray(projectNames.selected) && typeof projectNames.selected === 'object') {
            return projectNames.selected.value
        }
        return null
    }, [JSON.stringify(projectNames)])

    const updateAllStateAvailable = (selectionFiltration, exclude, project) => {
        if (updateList[exclude]) {
            updateList[exclude].map((list) => {
                if (list.value?.selected?.value) {
                    if (list.key == 'selection_project') {
                        const selectedProject = selectionFiltration.filter((proj) => proj[0]?.project_id)
                        const selectedproj = project?.filter((p) => p.id == _.get(selectedProject, '0.0.project_id')).map((p) => ({ label: p.name, value: p.id }))[0]
                        list.function({ type: 'onSelect', payload: { selected: selectedproj } })
                    } else list.function({ type: 'onSelect', payload: { selected: useWatchAllEventSelectOptionsGroup(selectionFiltration, list.key, 'selectionsOnly')[0] } })
                }
            })
        }
    }

    const clearAllSelections = (exclude) => {
        if (exclude !== 'project') dispatchProjectNames({ type: 'reset' })
        if (exclude !== 'group') dispatchGroupNames({ type: 'reset' })
        if (exclude !== 'truck') dispatchTruckNames({ type: 'reset' })
        if (exclude !== 'container') dispatchContainersName({ type: 'reset' })
        if (exclude !== 'item') dispatchItemsNames({ type: 'reset' })
    }
    const isSelected =
        (groupNames.selected && groupNames.selected.value) || (truckNames.selected && truckNames.selected.value) || (containersName.selected && containersName.selected.value) || (itemsNames.selected && itemsNames.selected.value) || (projectNames.selected && projectNames.selected.value)
    const context = {
        groupNames,
        labels,
        isSelected,
        dispatchGroupNames,
        selectedGroup: (groupNames.selected && groupNames.selected.value) || null,
        truckNames,
        dispatchTruckNames,
        selectedTruck: (truckNames.selected && truckNames.selected.value) || null,
        containersName,
        dispatchContainersName,
        selectedContainer: (containersName.selected && containersName.selected.value) || null,
        itemsNames,
        dispatchItemsNames,
        selectedItem: (itemsNames.selected && itemsNames.selected.value) || null,
        projectNames,
        selectedItemValue: itemsNames.selected,
        selectedGroupValue: groupNames.selected,
        selectedTruckValue: truckNames.selected,
        selectedContainerValue: containersName.selected,
        dispatchProjectNames,
        selectedProject,
        filterProjectSelection,
        updateAllStateAvailable,
        clearAllSelections,
        filterParentDepandencies,
        filterNoGroup,
        filterNoTruck,
        advanceFilterSelection,
        advanceSearchOptions,
        setAdvanceFilterSelection,
    }
    return <WatchAllEventContext.Provider value={context}>{props.children}</WatchAllEventContext.Provider>
}

export default WatchAllEventContext
