import PropTypes from 'prop-types'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import { useState, useEffect, useContext, useMemo } from 'react'
import { DateRange } from 'react-date-range'
import { _momentDateFormat, getLocalTime } from '../utils/globalFunc'
import LineChart from '../components/analytics/chart'
import string from '../utils/LanguageTranslation'
import 'react-date-range/dist/styles.css' // main style file
import 'react-date-range/dist/theme/default.css' // theme css file
import { fetchProjectDetails, fetchProjectSelections } from '../lib/api/project'
import { fetchUserManualEvents } from '../lib/api/project-event'
import { setCustomLabels } from '../redux/actions/customLabelAction'
import { getCustomLabels } from '../redux/selectors/customLabelSelector'
import Input from '../components/common/form-elements/input/Input'
import EventFilters from '../components/events/miniStatus/EventFilters'
import EventContext from '../store/event/eventContext'
import { Spinner } from 'reactstrap'

const AnalyticsPage = (props) => {
    if (typeof window === 'undefined') {
        return null
    }

    const { user } = props
    const router = useRouter()
    const dispatch = useDispatch()

    let { project_id, item_id, device_id } = router.query

    // if public user
    const isPublicUser = user && user?.role_id == process.env.ROLE_PUBLIC_USER
    const labels = useSelector(getCustomLabels)
    if (isPublicUser) {
        const { projectId, itemId, deviceId } = useSelector((state) => state.publicUser)
        project_id = projectId
        item_id = itemId
        device_id = deviceId
    }

    const [dateRange, setDateRange] = useState([
        {
            startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
            endDate: new Date(),
            key: 'selection',
        },
    ])
    const [dateSelected, setDateSelected] = useState(false)
    const [containerName, setContainerName] = useState('')
    const [open, setOpen] = useState(false)
    const [timeFrameValue, setTimeFrameValue] = useState(null)
    const [format, setFormat] = useState('YYYY-MM-DD')
    const [projectDetails, setProjectDetails] = useState({})
    const [projectData, setProjectData] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [projectSelections, setProjectSelections] = useState({ item_id: null, device_id: null })
    const { selectedGroup, selectedTruck, selectedContainer, selectedItem, selectedDevice, dispatchDevicesNames, dispatchItemsNames } = useContext(EventContext)

    const setFilters = () => {
        const selectionData = window.localStorage.getItem(`${project_id}_selection`)
        if (selectionData) {
            const selectionFilter = JSON.parse(selectionData)
            if (selectionFilter.device) {
                const index = selectionFilter.device.label.indexOf('<span')
                if (index != -1) {
                    selectionFilter.device.label = selectionFilter.device.label.substr(0, index - 1)
                }
                if (selectionFilter.device.value?.toString().includes('_')) {
                    selectionFilter.device.value = parseInt(selectionFilter.device.value.split('_')[0])
                }
                dispatchDevicesNames({ type: 'onSelect', payload: { selected: selectionFilter.device } })
            }
            if (selectionFilter.item) {
                const index = selectionFilter.item.label.indexOf('<span')
                if (index != -1) {
                    selectionFilter.item.label = selectionFilter.item.label.substr(0, index - 1)
                }
                if (selectionFilter.item.value?.toString().includes('_')) {
                    selectionFilter.item.value = parseInt(selectionFilter.item.value.split('_')[0])
                }

                dispatchItemsNames({ type: 'onSelect', payload: { selected: selectionFilter.item } })
            }
        }
    }

    useEffect(() => {
        _fetchProjectDetails(project_id)
    }, [containerName])

    useEffect(() => {
        let selectedItemID = ''
        let selectedDeviceID = ''
        if (selectedDevice) {
            selectedDeviceID = selectedDevice
        }
        if (selectedItem) {
            selectedItemID = selectedItem
        } else {
            // setFilters(projectDetails.project_selections)
            // selectedItemID = window.localStorage.getItem(project_id + '_selected_item_id')
        }
        setProjectSelections({ item_id: selectedItemID, device_id: selectedDeviceID })
    }, [selectedContainer, selectedGroup, selectedTruck, selectedItem, selectedDevice, projectDetails])

    const dateFilterFunction = (project = {}, isDateChange = false) => {
        if (!isDateChange) {
            const date = new Date()
            let currentMonthRange = `${_momentDateFormat(date.setDate(date.getDate() - 30), format)} - ${_momentDateFormat(new Date(), format)}`
            if (project.completed_date) {
                const completedDate = new Date(getLocalTime(project.completed_date) || new Date())
                const dateRangeObj = {
                    startDate: new Date(_momentDateFormat(new Date(getLocalTime(project.completed_date) || new Date()).setDate(completedDate.getDate() - 30), format)),
                    endDate: completedDate,
                    key: 'selection',
                }
                currentMonthRange = `${_momentDateFormat(new Date(getLocalTime(project.completed_date) || new Date()).setDate(completedDate.getDate() - 30), format)} - ${_momentDateFormat(completedDate, format)}`
                setDateRange([dateRangeObj])
            }
            setTimeFrameValue(currentMonthRange)
        }
        if (isDateChange && dateRange[0].startDate && dateRange[0].endDate) {
            const timeFrame = `${_momentDateFormat(dateRange[0].startDate, format)} - ${_momentDateFormat(dateRange[0].endDate, format)}`
            setTimeFrameValue(timeFrame)
        }
    }
    useMemo(() => {
        if (projectDetails?.name) {
            dateFilterFunction(projectDetails, true)
        }
    }, [JSON.stringify(dateRange)])

    const _fetchProjectDetails = async (project_id) => {
        setIsLoading(true)
        const project_details = await fetchProjectDetails({ project_id })
        dateFilterFunction(project_details)
        if (project_details.custom_labels) dispatch(setCustomLabels(JSON.parse(project_details.custom_labels)))

        let project_data = await fetchProjectSelections({ project_id })
        project_data.project_selections = project_data.project_selections.filter((selection) => selection?.selection_devices?.length)
        if (user.role_id != process.env.ROLE_ADMIN && user.role_id != process.env.ROLE_PUBLIC_USER) {
            const userManualEvents = await fetchUserManualEvents({ user_id: parseInt(user.id), project_id: parseInt(project_id) })
            const tempProjectSelections = project_data
            const projectData = tempProjectSelections.project_selections?.filter((projSelection) => {
                return userManualEvents.some((e) => e.item_id == projSelection?.selection_items[0]?.item_id)
            })
            project_data = { ...project_data, project_selections: projectData || [] }
        }
        setProjectData(project_data)

        let containersIdx = 0
        const projectSelection = project_data != null ? project_data.project_selections : projectSelections
        containersIdx = projectSelection.findIndex((selection) => selection.selection_devices[0]?.device?.id == device_id && selection.selection_items[0]?.item?.id == item_id)
        if (containersIdx > -1) {
            setContainerName(project_data[containersIdx]?.selection_containers[0].container.containerID)
        }
        setFilters()
        setProjectDetails({ ...project_data, ...project_details })
        setIsLoading(false)
    }
    return (
        <div className='container-fluid'>
            <div className='row d-flex project-listing'>
                <div className='tab-pane fade show active mt-3 col-md-12' id='all2' role='tabpanel' aria-labelledby='all-containers'>
                    <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter'>
                        <div className='col-md-6 event-mini-stats'>
                            <h4 className='text-dark'>{string.analyticsPageTitle}</h4>
                        </div>
                        <div style={{ zIndex: '1' }} className='analytics-time-input col-md-6 text-right'>
                            <span>{string.timeFrame}:</span>
                            <Input
                                type='text'
                                value={timeFrameValue || ''}
                                onClick={(event) => {
                                    setOpen(!open)
                                }}
                                readOnly
                            />
                            {open ? (
                                <div style={{ position: 'absolute', top: '100%', right: '0%' }}>
                                    <DateRange
                                        editableDateInputs
                                        onChange={(item) => {
                                            setDateRange([item.selection])
                                            if (dateSelected) {
                                                setOpen(!open)
                                            }
                                            setDateSelected(!dateSelected)
                                        }}
                                        moveRangeOnFirstSelection={false}
                                        ranges={dateRange}
                                    />
                                </div>
                            ) : (
                                ''
                            )}
                        </div>
                    </div>
                    <div className='col-md-12 row'>
                        <EventFilters project={projectData} user={user} showQrCode='hide' showDevices />
                    </div>
                    {isLoading && (
                        <center>
                            <Spinner />
                        </center>
                    )}

                    <LineChart
                        projectDetails={projectDetails}
                        dateRange={dateRange}
                        project_id={project_id}
                        filterDatas={{
                            group: selectedGroup,
                            truck: selectedTruck,
                            container: selectedContainer,
                            item: selectedItem,
                            device: selectedDevice,
                        }}
                        rgbColor='126,253,255'
                        type='temp'
                        projectSelections={projectSelections}
                    />
                    <LineChart
                        projectDetails={projectDetails}
                        dateRange={dateRange}
                        project_id={project_id}
                        filterDatas={{
                            group: selectedGroup,
                            truck: selectedTruck,
                            container: selectedContainer,
                            item: selectedItem,
                            device: selectedDevice,
                        }}
                        rgbColor='117,85,218'
                        type='hum'
                        projectSelections={projectSelections}
                    />
                </div>
            </div>
        </div>
    )
}

AnalyticsPage.getInitialProps = (ctx) => {
    const analyticsPage = true
    return { analyticsPage }
}

AnalyticsPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.string,
    }),
}

AnalyticsPage.defaultProps = {
    user: null,
}

export default AnalyticsPage
