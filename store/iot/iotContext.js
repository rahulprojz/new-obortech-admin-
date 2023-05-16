import { createContext, useEffect, useReducer, useState } from 'react'
import _ from 'lodash'
import { useSelector } from 'react-redux'
import useEventSelectOptionsGroup from '../../utils/customHooks/useEventSelectOptionsGroup'
import reducerContainerNamesSelector from '../event/reducerContainerNamesSelector'
import reducerGroupNamesSelector from './reducerGroupNamesSelector'
import reducerItemsNamesSelector from '../event/reducerItemsNamesSelector'
import reducerTruckNamesSelector from './reducerTruckNamesSelector'
import reducerDevicesNamesSelector from '../event/reducerDevicesNamesSelector'
import { getCustomLabels } from '../../redux/selectors/customLabelSelector'
import { dynamicLanguageStringChange } from '../../utils/globalFunc'
import string from '../../utils/LanguageTranslation'

const IotContext = createContext({
    labels: {},
    groupNames: {},
    dispatchGroupNames: () => { },
    truckNames: {},
    dispatchTruckNames: () => { },
    containersName: {},
    dispatchContainersName: () => { },
    itemsNames: {},
    dispatchItemsNames: () => { },
    devicesNames: {},
    dispatchDevicesNames: () => { },
    filterProjectSelection: () => { },
    updateAllStateAvailable: () => { },
    clearAllSelections: () => { },
    filterParentsDependancy: () => { },
    lastItemUpdatedAt: null,
    datetime: {
        start: null,
        end: null,
        updated: false,
    },
    setDatetime: () => { },
    organization_id: 0,
    setOrganizationId: () => { },
    created_by: 0,
    setCreatedBy: () => { },
    eventoptions: [],
    SetEventoptions: () => { },
    eventId: 0,
    setEventId: () => { },
    searchText: '',
    setSearchText: () => { },
    pdcCategoryList: [],
    setPdcCategoryList: () => { },
    selectedPDCName: '',
    setSelectedPDCName: () => { },
    searchEventId: [],
    setSearchEventId: () => { },
    timeSelectorFilter: '', setTimeSelectorFilter: () => { }
})

export const IotContextProvider = (props) => {
    const labels = useSelector(getCustomLabels)

    const [groupNames, dispatchGroupNames] = useReducer(reducerGroupNamesSelector, { available: [{ label: `${dynamicLanguageStringChange(string.event.allGroup3, labels)}`, value: null }] })
    const [truckNames, dispatchTruckNames] = useReducer(reducerTruckNamesSelector, { available: [{ label: `${dynamicLanguageStringChange(string.event.allGroup2, labels)}`, value: null }] })
    const [containersName, dispatchContainersName] = useReducer(reducerContainerNamesSelector, { available: [{ label: `${dynamicLanguageStringChange(string.event.allGroup1, labels)}`, value: null }] })
    const [itemsNames, dispatchItemsNames] = useReducer(reducerItemsNamesSelector, { available: [{ label: `${dynamicLanguageStringChange(string.event.allItem, labels)}`, value: null }] })
    const [devicesNames, dispatchDevicesNames] = useReducer(reducerDevicesNamesSelector, {})
    const [lastItemUpdatedAt, setLastItemUpdatedAt] = useState(null)

    const [datetime, setDatetime] = useState({
        start: null,
        end: null,
        updated: false,
    })
    const [organization_id, setOrganizationId] = useState(0)
    const [created_by, setCreatedBy] = useState(0)
    const [eventoptions, SetEventoptions] = useState([])
    const [eventId, setEventId] = useState(0)
    const [searchText, setSearchText] = useState('')
    const [pdcCategoryList, setPdcCategoryList] = useState([])
    const [selectedPDCName, setSelectedPDCName] = useState()
    const [searchEventId, setSearchEventId] = useState([])
    const [timeSelectorFilter, setTimeSelectorFilter] = useState('')



    const updateList = {
        truck: [{ key: 'selection_groups', function: dispatchGroupNames, value: truckNames }],
        container: [
            { key: 'selection_groups', function: dispatchGroupNames, value: containersName },
            { key: 'selection_trucks', function: dispatchTruckNames, value: containersName },
        ],
        item: [
            { key: 'selection_groups', function: dispatchGroupNames, value: itemsNames },
            { key: 'selection_trucks', function: dispatchTruckNames, value: itemsNames },
            { key: 'selection_containers', function: dispatchContainersName, value: itemsNames },
        ],
        device: [
            { key: 'selection_groups', function: dispatchGroupNames, value: devicesNames },
            { key: 'selection_trucks', function: dispatchTruckNames, value: devicesNames },
            { key: 'selection_containers', function: dispatchContainersName, value: devicesNames },
            { key: 'selection_items', function: dispatchItemsNames, value: devicesNames },
        ],
    }
    const filterProjectSelection = (elem) => {
        try {
            const rules = [true]
            if (itemsNames?.selected?.value) {
                rules.push(`${elem.selection_items[0]?.item_id}_${elem.selection_items[0]?.selection_id}` == itemsNames.selected.value)
            }

            if (devicesNames?.selected?.value) {
                rules.push(elem.selection_devices?.find((device) => `${device.device_id}_${device.selection_id}` == devicesNames.selected.value))
            }

            if (containersName?.selected?.value) {
                rules.push(`${elem.selection_containers[0]?.container_id}_${elem.selection_containers[0]?.selection_id}` == containersName.selected.value)
            }

            if (truckNames?.selected?.value) {
                rules.push(`${elem.selection_trucks[0]?.truck_id}_${elem.selection_trucks[0]?.selection_id}` == truckNames.selected.value)
            }

            if (groupNames?.selected?.value) {
                rules.push(`${elem.selection_groups[0]?.group_id}_${elem.selection_groups[0]?.selection_id}` == groupNames?.selected?.value)
            }
            return _.every(rules)
        } catch (err) {
            console.log(err)
        }
    }

    const filterTruck = (projectSelection, selectionFilter) => {
        const selectionTruckFilter = projectSelection.filter((selection) => {
            if (groupNames?.selected?.value) return selection.selection_groups[0]?.group_id == selectionFilter[0].selection_groups[0]?.group_id
            return true
        })
        dispatchTruckNames({ type: 'updateAvailable', payload: { available: useEventSelectOptionsGroup(selectionTruckFilter, 'selection_trucks') } })
    }

    const filterContainer = (projectSelection, selectionFilter) => {
        const selectionContainerFilter = projectSelection.filter((selection) => {
            if (truckNames?.selected?.value) return selection.selection_trucks[0]?.truck_id == selectionFilter[0].selection_trucks[0]?.truck_id
            if (groupNames?.selected?.value) return selection.selection_groups[0]?.group_id == selectionFilter[0].selection_groups[0]?.group_id
            return true
        })
        dispatchContainersName({ type: 'updateAvailable', payload: { available: useEventSelectOptionsGroup(selectionContainerFilter, 'selection_containers') } })
    }

    const filterItem = (projectSelection, selectionFilter) => {
        const selectionItemFilter = projectSelection.filter((selection) => {
            if (containersName?.selected?.value) return selection.selection_containers[0]?.container_id == selectionFilter[0].selection_containers[0]?.container_id
            if (truckNames?.selected?.value) return selection.selection_trucks[0]?.truck_id == selectionFilter[0].selection_trucks[0]?.truck_id
            if (groupNames?.selected?.value) return selection.selection_groups[0]?.group_id == selectionFilter[0].selection_groups[0]?.group_id
            return true
        })
        dispatchItemsNames({ type: 'updateAvailable', payload: { available: useEventSelectOptionsGroup(selectionItemFilter, 'selection_items') } })
    }

    const filterDevice = (projectSelection, selectionFilter) => {
        const selectionDeviceFilter = projectSelection.filter((selection) => {
            if (itemsNames?.selected?.value) return selection.selection_items[0]?.item_id == selectionFilter[0].selection_items[0]?.item_id
            if (containersName?.selected?.value) return selection.selection_containers[0]?.container_id == selectionFilter[0].selection_containers[0]?.container_id
            if (truckNames?.selected?.value) return selection.selection_trucks[0]?.truck_id == selectionFilter[0].selection_trucks[0]?.truck_id
            if (groupNames?.selected?.value) return selection.selection_groups[0]?.group_id == selectionFilter[0].selection_groups[0]?.group_id
            return true
        })
        dispatchDevicesNames({ type: 'updateAvailable', payload: { available: useEventSelectOptionsGroup(selectionDeviceFilter, 'selection_devices') } })
    }

    const filterParentsDependancy = (projectSelection, selectionFilter) => {
        try {
            filterTruck(projectSelection, selectionFilter)
            filterContainer(projectSelection, selectionFilter)
            filterItem(projectSelection, selectionFilter)
            filterDevice(projectSelection, selectionFilter)
        } catch (err) {
            console.log(err)
        }
    }

    const updateAllStateAvailable = (selectionFiltration, exclude) => {
        if (exclude !== 'device') dispatchDevicesNames({ type: 'updateAvailable', payload: { available: useEventSelectOptionsGroup(selectionFiltration, 'selection_devices') } })
        if (updateList[exclude]) {
            updateList[exclude].map((list) => {
                if (list.value?.selected?.value) list.function({ type: 'onSelect', payload: { selected: useEventSelectOptionsGroup(selectionFiltration, list.key)[0] } })
            })
        }
    }

    const clearAllSelections = (exclude) => {
        if (exclude !== 'group') dispatchGroupNames({ type: 'reset' })
        if (exclude !== 'truck') dispatchTruckNames({ type: 'reset' })
        if (exclude !== 'container') dispatchContainersName({ type: 'reset' })
        if (exclude !== 'item') dispatchItemsNames({ type: 'reset' })
        if (exclude !== 'device') dispatchDevicesNames({ type: 'reset' })
    }

    const context = {
        labels,
        groupNames,
        selectedGroup: (groupNames.selected && groupNames.selected.value) || null,
        dispatchGroupNames,
        truckNames,
        selectedTruck: (truckNames.selected && truckNames.selected.value) || null,
        dispatchTruckNames,
        containersName,
        selectedContainer: (containersName.selected && containersName.selected.value) || null,
        dispatchContainersName,
        itemsNames,
        selectedItem: (itemsNames.selected && itemsNames.selected.value) || null,
        dispatchDevicesNames,
        devicesNames,
        selectedDevice: (devicesNames.selected && devicesNames.selected.value) || null,
        dispatchItemsNames,
        filterProjectSelection,
        clearAllSelections,
        filterParentsDependancy,
        updateAllStateAvailable,
        lastItemUpdatedAt,
        setLastItemUpdatedAt,
        datetime,
        setDatetime,
        organization_id,
        setOrganizationId,
        created_by,
        setCreatedBy,
        eventoptions,
        SetEventoptions,
        eventId,
        setEventId,
        searchText,
        setSearchText,
        pdcCategoryList,
        setPdcCategoryList,
        selectedPDCName,
        setSelectedPDCName,
        searchEventId,
        setSearchEventId,
        timeSelectorFilter,
        setTimeSelectorFilter
    }
    return <IotContext.Provider value={context}>{props.children}</IotContext.Provider>
}

export default IotContext
