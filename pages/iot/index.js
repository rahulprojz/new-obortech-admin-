import { useEffect, useMemo, useState, useRef, useContext } from 'react'
import { useRouter } from 'next/router'
import { connect } from 'react-redux'
import NProgress from 'nprogress'
import { UncontrolledTooltip } from 'reactstrap'
import dynamic from 'next/dynamic'
import moment from 'moment-timezone'
import { sortBy } from 'lodash'
import { getDistance } from 'geolib'
import { Button } from 'react-bootstrap'
import withAuth from '../../lib/withAuth'
import IotContext, { IotContextProvider } from '../../store/iot/iotContext'
import { useQueryBorderInfo } from '../../lib/api/border-info'
import { fetchProjectSelections, fetchGroups, fetchTrucks, fetchContainers, fetchItems, fetchDevices, startItemTracking } from '../../lib/api/project'
import { fetchUserManualEvents } from '../../lib/api/project-event'
import { _momentGetDiff, getLocalTime, dynamicLanguageStringChange } from '../../utils/globalFunc'
import { useQueryLocationLog, useQueryStatsLog } from '../../lib/api/logs'
import string from '../../utils/LanguageTranslation'
import IotFilters from './IotFilters'
import useEventSelectOptionsGroup from '../../utils/customHooks/useEventSelectOptionsGroup'
import { setCustomLabels } from '../../redux/actions/customLabelAction'
import { getCustomLabels } from '../../redux/selectors/customLabelSelector'
import Checkbox from '../../components/common/form-elements/checkbox'
import Loader from '../../components/common/Loader'
import MiniStats from './MiniStats'
import notify from '../../lib/notifier'

const DynamicMap = dynamic(
    () => {
        return import('../../components/dashboard/dashboardMap')
    },
    { ssr: false },
)
let interval = null
const IndexPage = (props) => {
    const router = useRouter()
    const refs = useRef({
        deviceLabel: {},
        itemLabel: {},
        containerLabel: {},
        truckLabel: {},
        groupLabel: {},
        alertLabel: {},
    })

    let { project_id } = router.query || props
    if (!project_id) {
        project_id = props.project_id
    }
    const [state, setState] = useState({
        devicesList: [],
        user: props.user || {},
        borderInfoArr: [],
        projectTripStats: {},
        format: 'YYYY-MM-DD HH:mm:ss',
        activeRoadTrip: {},
        mapMarker: null,
        startMarker: null,
        stations: [],
        endMarker: null,
        // polylines: [],
        isStart: null,
        selectedVals: {},
        projectItemDevices: [],
        projectItems: [],
        projectContainers: [],
        projectGroups: [],
        projectTrucks: [],
        selectedDevice: null,
        selectedContainer: null,
        selectedGroup: null,
        selection_id: null,
        slideLeft: 0,
        selectedTruck: null,
        selectedContainerValue: '',
        selectedGroupValue: '',
        selectedTruckValue: '',
        selectedItemValue: '',
        selectedSelection: null,
        latestStats: { latestTemp: 0, latestHum: 0, sealingOpenCount: 0 },
        hum_alert: 0,
        temp_alert: 0,
        alertArr: [],
        filteredProjectItems: [],
        locationLogs: [],
        gmtTimeZone: `GMT ${moment.tz(moment.tz.guess()).format('Z')}`,
        loader: false,
        isStartButtonDisabled: false,
        selections: [],
    })
    const [routeDatas, setRouteDatas] = useState({
        stations: [],
        startMarker: {
            name: '',
            radius: '',
            pos: '',
        },
        endMarker: {
            name: '',
            radius: '',
            pos: '',
        },
        polylines: [],
        mapMarker: [],
    })
    const [alert, setAlert] = useState({ sealingChecked: true, temperatureChecked: true, humidityChecked: true, tamperChecked: true })
    const [selected, setSelected] = useState({
        selectedGroup: null,
        selectedTruck: null,
        selectedContainer: null,
        selectedItem: null,
        selectedDevice: null,
    })
    const [project, setProject] = useState({})
    const { labels } = props
    const body = {
        container: selected.selectedContainer,
        container_id: selected.selectedContainer,
        item_id: state.selectedItemValue?.item_id || null,
        project_id,
        project: project_id,
        device_id: selected.selectedDevice || null,
    }
    const { data: borderInfo, refetch: borderInfoRefetch } = useQueryBorderInfo(body)
    const { data: locLogs, refetch: locationLogRefetch } = useQueryLocationLog(body)
    const { data: latestStatsLog, refetch: statsLogRefetch } = useQueryStatsLog(body)
    const { groupNames, truckNames, containersName, itemsNames, devicesNames, dispatchContainersName, dispatchItemsNames, dispatchDevicesNames, dispatchTruckNames, dispatchGroupNames, clearAllSelections, filterProjectSelection, updateAllStateAvailable, filterParentsDependancy } =
        useContext(IotContext)

    useEffect(() => {
        if (project_id) {
            if (interval) clearTimeout(interval)
            interval = setTimeout(() => {
                borderInfoRefetch()
                locationLogRefetch()
                statsLogRefetch()
            }, 300)
        }
    }, [selected, project_id])

    const [selections, setSelections] = useState({
        groups: [],
        trucks: [],
        containers: [],
        items: [],
        devices: [],
    })

    const [projectSelections, setProjectSelections] = useState([])
    const updateState = (newState) =>
        setState((preState) => ({
            ...preState,
            ...newState,
        }))

    const updateRouteDatas = (newState) =>
        setRouteDatas((preState) => ({
            ...preState,
            ...newState,
        }))

    const updateSelectedSelection = (newState) =>
        setSelected((preState) => ({
            ...preState,
            ...newState,
        }))

    const updateSelection = (newState) =>
        setSelections((preState) => ({
            ...preState,
            ...newState,
        }))

    const goInit = async () => {
        NProgress.done()
        updateState({ loader: true })
        try {
            window.localStorage.setItem(`${props.user.id}-project_id`, project_id)
            const projectDetails = await fetchProjectSelections({ project_id })
            if (projectDetails.custom_labels) props.setCustomLabelsData(JSON.parse(projectDetails.custom_labels))
            setProject(projectDetails)
        } catch (err) {
            console.error(err)
            NProgress.done()
            updateState({ Loader: false })
        }
    }

    useEffect(() => {
        goInit()
    }, [])

    useEffect(() => {
        dispatchGroupNames({
            type: 'updateAvailable',
            payload: { available: useEventSelectOptionsGroup(projectSelections, 'selection_groups') },
        })
        dispatchTruckNames({
            type: 'updateAvailable',
            payload: { available: useEventSelectOptionsGroup(projectSelections, 'selection_trucks') },
        })
        dispatchContainersName({
            type: 'updateAvailable',
            payload: { available: useEventSelectOptionsGroup(projectSelections, 'selection_containers') },
        })
        dispatchItemsNames({
            type: 'updateAvailable',
            payload: { available: useEventSelectOptionsGroup(projectSelections, 'selection_items') },
        })
        dispatchDevicesNames({
            type: 'updateAvailable',
            payload: { available: useEventSelectOptionsGroup(projectSelections, 'selection_devices') },
        })
        const selectionData = window.localStorage.getItem(`${project_id}_selection`)
        if (selectionData) {
            const selectionFilter = JSON.parse(selectionData)
            if (selectionFilter.group && groupNames?.available?.some((avail) => avail.value?.includes(selectionFilter.group.value))) {
                dispatchGroupNames({ type: 'onSelect', payload: { selected: groupNames?.available?.find((avail) => avail.value?.includes(selectionFilter.group.value)) } })
            }
            if (selectionFilter.truck && truckNames?.available?.some((avail) => avail.value?.includes(selectionFilter.truck.value))) {
                dispatchTruckNames({ type: 'onSelect', payload: { selected: truckNames?.available?.find((avail) => avail.value?.includes(selectionFilter.truck.value)) } })
            }
            if (selectionFilter.container && containersName?.available?.some((avail) => avail.value?.includes(selectionFilter.container.value))) {
                dispatchContainersName({ type: 'onSelect', payload: { selected: containersName?.available?.find((avail) => avail.value?.includes(selectionFilter.container.value)) } })
            }
            if (selectionFilter.item && itemsNames?.available?.some((avail) => avail.value?.includes(selectionFilter.item.value))) {
                dispatchItemsNames({ type: 'onSelect', payload: { selected: itemsNames?.available?.find((avail) => avail.value?.includes(selectionFilter.item.value)) } })
            }
            if (devicesNames?.available?.find((avail) => avail.value?.includes(devicesNames.selected?.value))) {
                dispatchDevicesNames({ type: 'onSelect', payload: { selected: devicesNames?.available?.find((avail) => avail.value?.includes(devicesNames.selected?.value)) } })
            }
        }
    }, [projectSelections, selected.selectedItem])

    const _fetchProjectGroups = async () => {
        try {
            const groupsResponse = await fetchGroups({
                project_id,
                sealingChecked: alert.sealingChecked,
                temperatureChecked: alert.temperatureChecked,
                humidityChecked: alert.humidityChecked,
                tamperChecked: alert.tamperChecked,
            })
            const sortedGroups = sortBy(groupsResponse.groups, ['selection_id'])
            updateSelection({
                groups: sortedGroups,
            })
            updateState({
                groups: sortedGroups,
                selections: groupsResponse.selections,
            })

            const trucks = await _fetchTrucks('truck', null, groupsResponse.selections)

            const containers = await _fetchContainers('container', null, trucks[0]?.selection_id, groupsResponse.selections)

            const items = await _fetchItems('item', null, groupsResponse.selections)

            const devices = await _fetchItemDevies(null, groupsResponse.selections, items)

            await _prepareDropdown({ groups: sortedGroups, trucks, containers, items, devices })
            updateSelectedSelection({
                selectedGroup: groupNames.selected?.value || null,
                selectedTruck: truckNames.selected?.value || null,
                selectedContainer: containersName.selected?.value || null,
                selectedItem: itemsNames.selected?.value || null,
                selectedDevice: devicesNames.selected?.value || null,
            })

            updateState({
                loader: false,
            })

            await _fetchBorderInfo(null, null)
        } catch (err) {
            console.error(err)
        }
    }

    // Handle checkout click
    const _handleCheck = (alert_selection) => {
        if (alert_selection == 'sealing') {
            setAlert({ ...alert, ...{ sealingChecked: !alert.sealingChecked } })
        }
        if (alert_selection == 'temp') {
            setAlert({ ...alert, ...{ temperatureChecked: !alert.temperatureChecked } })
        }
        if (alert_selection == 'hum') {
            setAlert({ ...alert, ...{ humidityChecked: !alert.humidityChecked } })
        }
        if (alert_selection == 'tamper') {
            setAlert({ ...alert, ...{ tamperChecked: !alert.tamperChecked } })
        }
    }

    const _prepareDropdown = async ({ groups, trucks, containers, items, devices }) => {
        try {
            const tempSelectionArray = []
            // Groups
            if (Array.isArray(groups)) {
                groups.map((group, i) => {
                    let groupLabel = group.group?.groupID == 'No Group 3' ? dynamicLanguageStringChange(string.noGroup3, labels) : group.group?.groupID

                    if (group.alert > 0) {
                        groupLabel = `${groupLabel} <span class='alertclassProject'>(${group.alert})</span>`
                    }
                    group.group.groupID = groupLabel
                    group.group.selection_id = group.selection_id
                    if (!tempSelectionArray[group.selection_id]) {
                        tempSelectionArray[group.selection_id] = {}
                    }
                    tempSelectionArray[group.selection_id].selection_groups = [group]
                })
            }

            // Trucks
            if (Array.isArray(trucks)) {
                trucks.map((truck, i) => {
                    if (!truck.truck) return false
                    let truckLabel = truck.truck.truckID == 'No Group 2' ? dynamicLanguageStringChange(string.noGroup2, labels) : truck.truck.truckID
                    if (truck.alert > 0) {
                        truckLabel = `${truckLabel} <span class='alertclassProject'>(${truck.alert})</span>`
                    }
                    truck.truck.truckID = truckLabel
                    truck.truck.selection_id = truck.selection_id
                    tempSelectionArray[truck.selection_id].selection_trucks = [truck]
                })
            }

            // Containers
            if (Array.isArray(containers)) {
                containers.map((container, i) => {
                    if (container.alert > 0) {
                        container.container.containerID = `${container.container.containerID} <span class='alertclassProject'>(${container.alert})</span>`
                    }
                    container.container.selection_id = container.selection_id
                    tempSelectionArray[container.selection_id].selection_containers = [container]
                })
            }

            // Items
            if (Array.isArray(items)) {
                items.map((item, i) => {
                    if (item.alert > 0) {
                        item.item.itemID = `${item.item.itemID} <span class='alertclassProject'>(${item.alert})</span>`
                    }
                    item.item.selection_id = item.selection_id
                    tempSelectionArray[item.selection_id].selection_items = [item]
                    tempSelectionArray[item.selection_id].selection_devices = []
                })
            }

            // Devices
            if (Array.isArray(devices)) {
                devices.map((device) => {
                    if (device.alert > 0) {
                        if (device.device?.tag) {
                            device.device.tag = `${device.device?.tag} <span class='alertclassProject'>(${device.alert})</span>`
                        } else {
                            device.device.deviceID = `${device.device?.deviceID} <span class='alertclassProject'>(${device.alert})</span>`
                        }
                    }
                    device.device.selection_id = device.selection_id
                    if (!Array.isArray(tempSelectionArray[device.selection_id].selection_devices)) {
                        tempSelectionArray[device.selection_id].selection_devices = []
                    }
                    tempSelectionArray[device.selection_id].selection_devices.push(device)
                })
            }
            const array = tempSelectionArray.filter((data) => data)
            let selection_array = array.filter((selection) => selection?.selection_devices?.length)
            if (state.user.role_id != process.env.ROLE_ADMIN && state.user.role_id != process.env.ROLE_PUBLIC_USER) {
                const userManualEvents = await fetchUserManualEvents({ user_id: parseInt(state.user.id), project_id: parseInt(project_id) })
                const tempProjectSelections = selection_array
                const projectData = tempProjectSelections?.filter((projSelection) => {
                    return userManualEvents.some((e) => e.item_id == projSelection?.selection_items[0]?.item_id)
                })
                selection_array = projectData || []
            }
            setProjectSelections(selection_array)
        } catch (err) {
            console.error(err)
        }
    }

    useMemo(() => {
        // Fetch Project Details and Prepare Item, Container, Truck and Group dropdown accordingly
        _fetchProjectGroups()
    }, [alert.sealingChecked, alert.temperatureChecked, alert.humidityChecked, alert.tamperChecked])

    // Fetch trucks
    const _fetchTrucks = async (elm_type, elm_id, selectionArray = null) => {
        const selections = selectionArray || state.selections
        const trucks = await fetchTrucks({
            elm_type,
            elm_id,
            project_id,
            sealingChecked: alert.sealingChecked,
            temperatureChecked: alert.temperatureChecked,
            humidityChecked: alert.humidityChecked,
            tamperChecked: alert.tamperChecked,
            selections,
        })
        updateState({ trucks: sortBy(trucks, ['selection_id']) })
        updateSelection({ trucks: sortBy(trucks, ['selection_id']) })
        return sortBy(trucks, ['selection_id'])
    }

    // Fetch containers
    const _fetchContainers = async (elm_type, elm_id, selection_id = null, selectionArray = null) => {
        updateState({ containers: [] })
        const selections = selectionArray || state.selections

        const containers = await fetchContainers({
            elm_type,
            elm_id,
            selection_id,
            project_id,
            sealingChecked: alert.sealingChecked,
            temperatureChecked: alert.temperatureChecked,
            humidityChecked: alert.humidityChecked,
            tamperChecked: alert.tamperChecked,
            selections,
        })

        updateState({ containers: sortBy(containers, ['selection_id']) })
        updateSelection({ containers: sortBy(containers, ['selection_id']) })
        return sortBy(containers, ['selection_id'])
    }

    // Fetch items
    const _fetchItems = async (elm_type, elm_id, selectionArray = null) => {
        const selections = selectionArray || state.selections

        const items = await fetchItems({
            elm_type,
            elm_id,
            project_id,
            sealingChecked: alert.sealingChecked,
            temperatureChecked: alert.temperatureChecked,
            humidityChecked: alert.humidityChecked,
            tamperChecked: alert.tamperChecked,
            selections,
        })

        updateState({ items: sortBy(items, ['selection_id']) })
        updateSelection({ items: sortBy(items, ['selection_id']) })
        return sortBy(items, ['selection_id'])
    }

    // Fetch Devices
    const _fetchItemDevies = async (elm_id, selectionArray = null, itemsArray = null) => {
        const devices = []
        const selection = selectionArray || state.selections
        const req = {
            elm_id,
            item_id: elm_id,
            project_id,
            sealingChecked: alert.sealingChecked,
            temperatureChecked: alert.temperatureChecked,
            humidityChecked: alert.humidityChecked,
            tamperChecked: alert.tamperChecked,
            selections: selection,
        }
        const projectDevices = await fetchDevices(req)
        if (projectDevices.length) {
            projectDevices.map((device) => devices.push(device))
        }
        const items = itemsArray || selections.items
        const selectedItem = items?.find((item) => item.item_id == elm_id)
        updateState({ devices })
        updateSelection({ devices })
        updateSelectedSelection({ selectedItem })

        return devices
    }

    const _fetchBorderInfo = async (device_id = 0, containerId = null) => {
        NProgress.start()

        $('[data-toggle="tooltip"]').tooltip()
        NProgress.done()
    }

    const _fetchLocationLogs = async () => {
        try {
            if (locLogs?.code === 1) {
                updateState({ mapData: locLogs.data })
                if (locLogs.data) {
                    const { stations, locationlogs } = locLogs.data
                    let markerObj = {}
                    let markerLine = {}
                    if (stations.length > 0) {
                        markerObj = {
                            stations,
                            startMarker: {
                                name: stations[0]?.station.name,
                                radius: stations[0]?.station.radius,
                                pos: [stations[0]?.station.latitude, stations[0]?.station.longitude],
                            },
                            endMarker: {
                                name: stations[stations.length - 1]?.station.name,
                                radius: stations[stations.length - 1]?.station.radius,
                                pos: [stations[stations.length - 1]?.station.latitude, stations[stations.length - 1]?.station.longitude],
                            },
                        }
                    }
                    if (locationlogs.length > 0) {
                        const arr = []
                        locationlogs.map((loc, idx) => {
                            let obj = {}
                            ;(obj.fromLat = loc.latitude), (obj.fromLong = loc.longitude), (obj.toLat = locationlogs[idx + 1]?.latitude), (obj.toLong = locationlogs[idx + 1]?.longitude)
                            arr.push(obj)
                            obj = {}
                        })
                        markerLine = {
                            polylines: arr,
                            mapMarker: [locationlogs[locationlogs.length - 1]?.latitude, locationlogs[locationlogs.length - 1]?.longitude],
                        }
                    }else{
                        markerLine={
                            polylines:[],
                        }
                    }

                    updateRouteDatas({
                        ...markerObj,
                        ...markerLine,
                    })
                }
            }
        } catch (err) {
            console.error('Err in _fetchLocationLogs => ', err)
        }
    }

    useEffect(() => {
        _fetchLocationLogs()
    }, [locLogs])

    const filterOtherSelection = async (filter) => {
        if (projectSelections && projectSelections.length > 0) {
            const selectionFiltration = projectSelections.filter(filterProjectSelection)
            if (selectionFiltration.length) filterParentsDependancy(projectSelections, selectionFiltration)
            if (groupNames.selected && filter == 'group') {
                updateAllStateAvailable(selectionFiltration, filter)
                if (selectionFiltration.length) filterParentsDependancy(projectSelections, selectionFiltration)
                updateState({ selectedGroupValue: groupNames.selected.value })
            } else if (truckNames.selected && filter == 'truck') {
                updateAllStateAvailable(selectionFiltration, filter)
                if (truckNames.selected.value == null && groupNames.selected) {
                    dispatchTruckNames({ type: 'updateAvailable', payload: { available: useEventSelectOptionsGroup(projectSelections, 'selection_trucks') } })
                }
                updateState({ selectedTruckValue: truckNames.selected.value })
            } else if (containersName.selected && filter == 'container') {
                updateAllStateAvailable(selectionFiltration, filter)
                if (containersName.selected.value == null && (groupNames.selected || truckNames.selected)) {
                    dispatchContainersName({ type: 'updateAvailable', payload: { available: useEventSelectOptionsGroup(projectSelections, 'selection_containers') } })
                }
                updateSelectedSelection({ selectedContainer: containersName.selected.value?.toString().split('_')[0] || null })
                updateState({ selectedContainerValue: containersName.selected.value })
            } else if (itemsNames.selected && filter == 'item') {
                updateAllStateAvailable(selectionFiltration, filter)
                if (itemsNames.selected.value) {
                    const projectSelectionIndex = projectSelections.findIndex((projSelection) => `${projSelection.selection_items[0].item_id}_${projSelection.selection_items[0].selection_id}` == itemsNames.selected.value)
                    if (projectSelectionIndex > -1) updateState({ selectedItemValue: projectSelections[projectSelectionIndex].selection_items[0] })
                } else {
                    updateState({ selectedItemValue: itemsNames.selected.value })
                }
                await _fetchBorderInfo()
            } else if (devicesNames.selected && filter == 'device') {
                updateAllStateAvailable(selectionFiltration, filter)
                updateSelectedSelection({ selectedDevice: devicesNames.selected.value?.toString().split('_')[0] || null })
                await _fetchBorderInfo(devicesNames.selected.value)
            }
        }
    }

    // Array normalization
    const normalizeRoadArr = (borderInfo) => {
        try {
            updateState({
                activeRoadTrip: borderInfo.activeRoadTrip || [],
            })
            return borderInfo.roadArr
        } catch (err) {
            console.error('Err in normalizeRoadArr => ', err)
        }
    }

    // Show/hide trip info
    const toggleTripInfo = (road_id, idx) => {
        updateState({
            activeRoadTrip: {
                ...state.activeRoadTrip,
                [road_id]: idx,
            },
        })
    }

    const startItemTrack = async () => {
        updateState({ isStartButtonDisabled: true })
        const itemData = await startItemTracking({ project_id, item_id: state.selectedItemValue?.item_id, device_id: selected.selectedDevice })
        updateState({ selectedItemValue: itemData?.updatedItem, isStartButtonDisabled: false })
        await _fetchBorderInfo()
        notify(string.item.iotStarted)
    }

    const moveTimeline = (side) => {
        const el = document.getElementById('steps-timeline')
        updateState({ slideLeft: side == 'right' ? (el.scrollLeft += 100) : state.slideLeft >= 100 ? (el.scrollLeft -= 100) : (el.scrollLeft -= state.slideLeft) })
    }

    const border = useMemo(() => normalizeRoadArr(borderInfo), [borderInfo])

    const _renderBorderItem = (info, idx) => {
        const { name, trips, road_id, outside, inside } = info
        const { activeRoadTrip } = state

        let borderOutTime = moment().format('YYYY-MM-DD HH:mm:ss')
        if (outside && outside[activeRoadTrip[road_id]]?.createdAt) {
            borderOutTime = getLocalTime(outside[activeRoadTrip[road_id]]?.createdAt)
        }
        let timeCounter = 0
        if (trips?.length > 0) {
            const border_in_time = getLocalTime(inside[activeRoadTrip[road_id]]?.createdAt)
            const mins = trips[activeRoadTrip[road_id]]?.diff_in_mins
            const days = _momentGetDiff(borderOutTime, border_in_time, 'days')
            const hours = Math.floor(_momentGetDiff(borderOutTime, border_in_time, 'hours') - _momentGetDiff(borderOutTime, border_in_time, 'days') * 24)

            if (mins <= 60) {
                timeCounter = <span>{mins} m</span>
            }
            if (mins > 60 && hours < 24 && days <= 0) {
                timeCounter = <span>{hours} h</span>
            }
            if (days > 0) {
                timeCounter = (
                    <span>
                        {days} d <br /> {hours} h
                    </span>
                )
            }
        }
        // const tooltipString
        return (
            <div id={`station-${road_id}`} className='col-xs-3 bs-wizard-step' key={idx}>
                {trips?.length > 1 && (
                    <div className='in-out-state'>
                        {trips.map((it, idx) => {
                            return <span key={idx} className={`trip-dots ${activeRoadTrip[road_id] === idx ? 'active' : ''}`} onClick={() => toggleTripInfo(road_id, idx)} />
                        })}
                    </div>
                )}

                <div className='progress'>
                    <div className='progress-bar' />
                </div>

                {trips?.length > 0 ? (
                    <>
                        <a className={`bs-wizard-dot trip-2 show-trip ${trips[activeRoadTrip[road_id]]?.status_class}`} id={`Tooltip-${road_id}_${activeRoadTrip[road_id]}`}>
                            <span>{timeCounter}</span>
                        </a>
                        <UncontrolledTooltip placement='right' style={{ height: 46 }} target={`Tooltip-${road_id}_${activeRoadTrip[road_id]}`}>
                            <strong>{string.borderIn}</strong>
                            <span>{trips[activeRoadTrip[road_id]]?.borderInTime}</span>
                            <br />
                            <strong>{string.borderOut}</strong>
                            <span>{trips[activeRoadTrip[road_id]]?.borderOutTime}</span>
                        </UncontrolledTooltip>
                    </>
                ) : (
                    <a className='bs-wizard-dot trip-2 show-trip disabled' data-toggle='tooltip' data-placement='right' id='hints' data-html='true' data-title={state[`trip-str-${road_id}-0`]}>
                        <span title=''>0</span>
                    </a>
                )}
                <div className='bs-wizard-info text-center'>{name}</div>
            </div>
        )
    }

    const sortedLabelRefs = Object.values(refs.current).sort((a, b) => b?.clientWidth - a?.clientWidth)
    const labelWidth = sortedLabelRefs.length > 0 && sortedLabelRefs[0]?.clientWidth
    // Check if user is public user
    const isPublicUser = props.user && props.user?.role_id == process.env.ROLE_PUBLIC_USER
    const timelineElement = document.getElementById('steps-timeline')
    const showBtn = timelineElement?.scrollWidth > timelineElement?.clientWidth
    const latestStats = latestStatsLog.data
    const temp_alert = devicesNames.selected?.value == null ? 0 : latestStats?.temp_alert_count
    const hum_alert = devicesNames.selected?.value == null ? 0 : latestStats?.hum_alert_count
    const { selectedDevice } = selected
    const { slideLeft, selectedItemValue, isStartButtonDisabled, borderInfoArr, gmtTimeZone } = state
    const { polylines, stations, startMarker, endMarker, mapMarker } = routeDatas

    const { total_diff_in_days, total_diff_in_hours, total_diff_in_mins, total_distance_covered, started_datetime_formatted } = borderInfo?.projectTripStats || {}

    const getTotalDuration = () => {
        let totalDuration = ''
        if (total_diff_in_days || total_diff_in_hours || total_diff_in_mins) {
            totalDuration = `${total_diff_in_days || '0'} ${total_diff_in_days <= 1 ? 'day' : 'days'}, ${total_diff_in_hours || '0'} hours, ${total_diff_in_mins || '0'} minutes`
        }
        return totalDuration
    }

    return (
        <div className='container-fluid'>
            {/* Content Row */}
            <div className='row d-flex step-wrapper'>
                <div className='steps col-xl-9 p-0'>
                    <div className='row align-items-baseline'>
                        {showBtn && (
                            <button disabled={slideLeft == 0} className='navigation-arrow' onClick={() => moveTimeline('left')}>
                                <i className='fas fa-chevron-left' />
                            </button>
                        )}
                        <div className='bs-wizard p-0 mx-4 col-10' id='steps-timeline'>
                            {border &&
                                border.length > 0 &&
                                border.map((info, i) => {
                                    return _renderBorderItem(info, i)
                                })}
                            {borderInfoArr}
                        </div>
                        {showBtn && (
                            <button disabled={timelineElement?.scrollWidth - slideLeft < timelineElement?.clientWidth} className='navigation-arrow' onClick={() => moveTimeline('right')}>
                                <i className='fas fa-chevron-right' />
                            </button>
                        )}
                    </div>
                </div>
                <div className='steps-total col-xl-3 pt-4'>
                    <div>
                        <p>
                            <strong>{string.totalDuration}</strong> {selectedItemValue?.start_date_time && getTotalDuration()}
                        </p>
                        <p>
                            <strong>{string.traveledKM}</strong> {selectedItemValue?.start_date_time && started_datetime_formatted && !!total_distance_covered ? `${parseFloat(total_distance_covered).toFixed(2)} ${string.km}` : ''}
                        </p>
                        <p>
                            <strong>{string.started}</strong> {selectedItemValue?.start_date_time ? `${getLocalTime(selectedItemValue?.start_date_time)} ${gmtTimeZone}` : ''}
                        </p>
                    </div>
                    {/* {!project.is_completed && devicesNames.selected?.value != null && (
                        <Button
                            variant='outline-dark'
                            disabled={isStartButtonDisabled || selectedItemValue?.is_start}
                            className='mt-2 rounded px-4 py-1 start-button text-capitalize'
                            style={!selectedItemValue?.is_start && props.user?.role_id == process.env.ROLE_PUBLIC_USER ? { cursor: 'not-allowed' } : {}}
                            onClick={() => props.user?.role_id != process.env.ROLE_PUBLIC_USER && startItemTrack()}
                        >
                            {string.project.startBtn}
                        </Button>
                    )} */}
                </div>
            </div>
            <div className='row d-flex map-content position-relative mb-5'>
                {state.loader && <Loader />}
                <div className='col-lg-5 pl-0'>
                    <form action='' method=''>
                        <IotFilters labelWidth={labelWidth} isPublicUser={isPublicUser} labels={labels} refs={refs} projectSelections={projectSelections} filterOtherSelection={filterOtherSelection} project_id={project_id} />
                        <div className='form-group d-flex'>
                            <label ref={(ref) => (refs.current.alertLabel = ref)} className='col-form-label flex-shrink-0 p-2' style={{ minWidth: labelWidth }}>
                                {string.showAlerts}:
                            </label>
                            <div className='tem-type pl-0'>
                                <span>
                                    <Checkbox checked={alert.sealingChecked} type='checkbox' disabled={isPublicUser} onChange={() => {}} onClick={() => _handleCheck('sealing')} /> {string.chart.Sealing}
                                </span>
                                <span>
                                    <Checkbox checked={alert.temperatureChecked} type='checkbox' disabled={isPublicUser} onChange={() => {}} onClick={() => _handleCheck('temp')} /> {string.chart.Temperature}
                                </span>
                                <span>
                                    <Checkbox checked={alert.humidityChecked} type='checkbox' disabled={isPublicUser} onChange={() => {}} onClick={() => _handleCheck('hum')} /> {string.chart.Humidity}
                                </span>
                                <span>
                                    <Checkbox checked={alert.tamperChecked} type='checkbox' disabled={isPublicUser} onChange={() => {}} onClick={() => _handleCheck('tamper')} /> {string.chart.tamper}
                                </span>
                            </div>
                        </div>
                    </form>
                    {/* //form */}
                    <MiniStats isPublicUser={isPublicUser} project_id={project_id} selectedItemValue={selectedItemValue?.item_id} selectedDeviceValue={selectedDevice} latestStats={latestStats} hum_alert={hum_alert} temp_alert={temp_alert} />
                </div>
                <div className='col-lg-7 pr-0'>
                    <div className='map-wrapper'>{borderInfo?.projectroad && <DynamicMap mapMarker={mapMarker} polylines={polylines} startMarker={startMarker} endMarker={endMarker} stations={borderInfo?.projectroad} />}</div>
                </div>
            </div>
        </div>
    )
}

function mapStateToProps(state) {
    return { labels: getCustomLabels(state) }
}

function mapDispatchToProps(dispatch) {
    return {
        // dispatching custom labels
        setCustomLabelsData: (payload) => dispatch(setCustomLabels(payload)),
    }
}

const IotPage = (props) => (
    <IotContextProvider>
        <IndexPage {...props} />
    </IotContextProvider>
)

export default withAuth(connect(mapStateToProps, mapDispatchToProps)(IotPage), { loginRequired: true })
