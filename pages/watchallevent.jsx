import PropTypes from 'prop-types'
import NProgress from 'nprogress'
import moment from 'moment-timezone'
import { uniqBy } from 'lodash'
import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import Select, { components } from 'react-select'
import DateRangePicker from 'react-bootstrap-daterangepicker'
import notify from '../lib/notifier'
import withAuth from '../lib/withAuth'
import { checkIntegrity } from '../lib/api/integrity'
import { addProjectEvent, fetchProjectEvents, fetchHiddenProjectEvents, updateHiddenProjectEvents, removeProjectEvent, fetchUserAllEvents, seenProjectEventDocument, addProjectEventComment, handleUserAction, updateProjectComment } from '../lib/api/project-event'
import { fetchProject, useQueryProjects, fetchProjects, fetchProjectDetails, useQueryProjectDetails } from '../lib/api/project'
import { fetchEvents, useQueryFetchSystemEvents } from '../lib/api/event'
import { fetchProjectEventCategories, fetchProjectDocumentCategories, useQuerycategories } from '../lib/api/project-category'
import EventRow from '../components/events/EventRow'
import { fetchOrgs, useQueryOrgList } from '../lib/api/organization'
import EventModal from '../components/events/EventModalV2'
import DocumentModal from '../components/events/DocumentModalV2'
import Loader from '../components/common/Loader'
import string from '../utils/LanguageTranslation.js'
import { _momentDateFormat, _momentDate, _momentGetDiff, groupBy, sanitize, dynamicLanguageStringChange } from '../utils/globalFunc'
import { useQueryEventDoc } from '../lib/api/event-category'
import { getSelectedLanguage, otherLanguage } from '../utils/selectedLanguage.js'
import Button from '../components/common/form-elements/button/Button'
import CustomSelect from '../components/common/form-elements/select/CustomSelect'
import 'bootstrap-daterangepicker/daterangepicker.css'
import WatchAllEventFilter from '../components/events/miniStatus/WatchAllEventFilter'
import WatchAllEventContext from '../store/watchAllEvent/watchAllEventContext'
import EventContext from '../store/event/eventContext'
import { setCustomLabels, resetCustomLabels } from '../redux/actions/customLabelAction'
import { integrityWrapper } from '../utils/integrityHelpers'
import { updateSubmitEventErrors } from '../redux/actions/integrityActions'

let interval = null
const EVENTS_LIMIT = 20
let eventsData = {}
let isFetchAll = false
let allEvents = []
let pEventUsers = []
let userManualEvents = []
let timeFilter = '0'
let timeoutOrg = ''
let timeoutEvent = ''
let timeoutScroll = ''
let timeoutScrollEvent = ''

const watchall = (props) => {
    if (typeof window === 'undefined') {
        return null
    }

    const user = props.user || {}
    const user_id = props.user.id
    const user_role_id = props.user.role_id
    const isNotAdminRole = user.role_id != process.env.ROLE_ADMIN
    const dispatch = useDispatch()
    const [organization_id, setOrganizationId] = useState(0)
    const [selectedPreviewEvent, setSelectedPreviewEvent] = useState({})
    const [selectedProjectEvent, setSelectedProjectEvent] = useState({})
    const [created_by, setCreatedBy] = useState(0)
    const [eventId, setEventId] = useState(0)
    const [eventOpen, setEventOpen] = useState(false)
    const [documentOpen, setDocumentOpen] = useState(false)
    const [eventParticipantFilterOptions, setEventParticipantFilterOptions] = useState([])
    const [eventType, setEventType] = useState([])
    const [commentOpen, setCommentOpen] = useState()
    const [acceptOpen, setAcceptOpen] = useState()
    const [circlePopupOpen, setCirclePopupOpen] = useState()
    const [timer, setTimer] = useState(false)
    const [eventoptions, SetEventoptions] = useState([])
    const [EventList, setEventList] = useState([])
    const [is_submitting, SetIsSubmitting] = useState(false)
    const [isEventsLoaded, SetIsEventsLoaded] = useState(false)
    const [menuIsOpen, SetMenuIsOpen] = useState(false)
    const [searchText, setSearchText] = useState('')
    const [timeselectorfilter, settimeselectorfilter] = useState('0')
    const [eventName, setEventName] = useState('')
    const [pdcCategoryList, setPdcCategoryList] = useState([])
    const [selectedPDCName, setSelectedPDCName] = useState()
    const [hideStatus, setHideStatus] = useState(true)
    const [watchalldatetime, setwatchalldatetime] = useState({
        start: null,
        end: null,
        isChanged: false,
    })
    const [searchEventId, setSearchEventId] = useState([])
    const { selectedGroup, selectedTruck, selectedContainer, selectedItem, selectedProject, projectNames, labels, selectedItemValue, selectedGroupValue, selectedTruckValue, selectedContainerValue, advanceFilterSelection, advanceSearchOptions, setAdvanceFilterSelection } =
        useContext(WatchAllEventContext)
    const { projectEventUsers, setProjectEventUsers, setselectedMenu, selectedMenu } = useContext(EventContext)
    const [isChanged, setIsChanged] = useState(false)
    const [loading, setLoading] = useState([])
    const [filteredEvent, setFilteredEvent] = useState([])
    const [allProjectEvent, setAllProjectEvent] = useState({})
    const [allUsers, setAllUsers] = useState([])
    const [hiddenProjectEvents, setHiddenProjectEvents] = useState([])
    const [activeIntegerity, SetActiveIntegerity] = useState(null)

    const isSelected = !selectedProject && !selectedGroup && !selectedTruck && !selectedContainer && !selectedItem
    const selectionBody = {
        project_id: selectedProject,
        group_id: selectedGroup,
        container_id: selectedContainer,
        truck_id: selectedTruck,
        item_id: selectedItem,
    }

    const {
        data: { project, ProjectId, eventParticipantFilters },
        refetch: refetchProjects,
    } = useQueryProjects(project)
    const { data: systemEvents, refetch: fetchSystemEvnts } = useQueryFetchSystemEvents()
    const { data: projectDetails, refetch: refetchProjectDetails } = useQueryProjectDetails(selectionBody)
    const { data: orgList, refetch: fetchOrgList } = useQueryOrgList()
    const project_category_id = !isSelected ? projectDetails.project_category_id : project.map((proj) => proj.project_category_id)
    const [{ data: event_categories, isFetching: eventLoading, refetch: refetchEventCategories }, { data: documents_categories, isFetching: documentLoading, refetch: refetchDocumentCategories }] = useQuerycategories(project_category_id)
    const categoryLoading = eventLoading || documentLoading
    const { data: pdcEvents, isFetching: pdcIsFetching, refetch: refetchPDCEvents } = useQueryEventDoc(event_categories, documents_categories, user, orgList, categoryLoading, !isSelected)

    const handleIntegrity = async (project_event, index) => {
        const { event_submission_id, pdc_id } = project_event
        const list = filteredEvent[index].val || []
        SetActiveIntegerity(project_event)
        const response = await checkIntegrity({ type: 'eventsubmission', uniqId: event_submission_id, pdc: pdc_id })
        if (response.data) {
            const updatedEvents = await integrityWrapper(response.data, list)
            filteredEvent[index].val = updatedEvents
            SetActiveIntegerity(null)
            setFilteredEvent(filteredEvent)
            return dispatch(updateSubmitEventErrors({ id: project_event._id, status: response.data.integrity_status }))
        }
    }

    const getHiddenProjectEvents = async () => {
        const hiddenEvents = await fetchHiddenProjectEvents()
        if (hiddenEvents && hiddenEvents.length) setHiddenProjectEvents(hiddenEvents.map((event) => event.project_event_id))
    }
    useEffect(() => {
        getHiddenProjectEvents()
        fetchOrgList()
        refetchProjects()
        fetchSystemEvnts()
    }, [])

    useEffect(() => {
        if (!categoryLoading || isSelected) {
            setTimeout(() => {
                refetchPDCEvents()
            }, 500)
        }
    }, [event_categories, documents_categories, categoryLoading, user, orgList, selectedProject, selectedGroup, selectedTruck, selectedContainer, selectedItem])

    // Allowwe file formats
    const file_types = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]

    const startLoader = () => {
        loading.push(true)
        setLoading(loading)
    }

    const closeLoader = () => {
        loading.pop()
        setLoading(loading)
    }

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: 35,
            height: 35,
            fontSize: 14,
            color: '#6e707e',
            borderRadius: 3,
        }),
    }

    useMemo(() => {
        setAdvanceFilterSelection(advanceSearchOptions[1])
        setwatchalldatetime({ start: null, end: null, isChanged: false })
        settimeselectorfilter('0')
        setOrganizationId(0)
        setCreatedBy(0)
        setEventId(0)
        setSearchText('')
        setSelectedPDCName(0)
    }, [selectedProject])

    const filteredPDCEvents = useMemo(() => pdcEvents, [pdcEvents]) || []

    useMemo(() => {
        if ((selectedProject || projectNames.selected?.[0]?.value) && (pdcEvents.documents.length > 0 || pdcEvents.events.length > 0)) {
            refetchEventCategories()
            refetchDocumentCategories()
        }
    }, [documentOpen, eventOpen])

    const loadEventList = (eList) => {
        try {
            if (eList.length === 0) {
                setFilteredEvent([])
                return
            }
            const filteredList = []
            const allEventAssets = [...pdcEvents.events, ...pdcEvents.documents, ...systemEvents]
            if (allEventAssets.length > 0) {
                eList.map((ev) => {
                    const eventList = []
                    ev?.val?.map((event) => {
                        const eventObj = allEventAssets.find((eventAsset) => eventAsset.uniqId == event.event_id)
                        const oldevents = filteredEvent.map((val) => val.val.filter((ev) => ev?.project_event?._id == event?._id))
                        const oldAvailEvents = oldevents.find((ev) => ev.length)
                        const checked = oldAvailEvents && oldAvailEvents.length ? oldAvailEvents[0].project_event.checked : false
                        const hiddenEvent = oldAvailEvents && oldAvailEvents.length ? oldAvailEvents[0].project_event.hiddenEvent : false
                        if (hiddenProjectEvents.includes(event.event_submission_id)) {
                            checked = true
                            hiddenEvent = true
                        }
                        const extraEventData = {
                            eventType: event.event_category_id == process.env.ALERT_EVENTS_CATEGORY ? 'alert' : event.attachment_type == 2 ? 'document' : 'event',
                            uniqId: event?.event_id,
                            event_category_id: event?.event_category_id,
                            eventName: event.event_name,
                            mongolianName: event.local_event_name,
                            formId: event.form_id,
                        }
                        if (selectedPDCName?.value) {
                            if (event.pdc_id === selectedPDCName?.value?.trim()) {
                                eventList.push({ ...event, project_event: { ...event, checked, hiddenEvent, event: extraEventData } })
                            }
                        } else {
                            eventList.push({ ...event, project_event: { ...event, checked, hiddenEvent, event: extraEventData } })
                        }
                    })
                    if (eventList.length) {
                        const values = uniqBy(eventList, (el) => el._id)
                        filteredList.push({ key: ev.key, val: values })
                    }
                })
            }

            document.getElementById('watchall-event-wrapper')?.removeEventListener('scroll', handleScroll)
            setFilteredEvent([...filteredList])
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        return () => {
            resetScrollingData()
            document.getElementById('watchall-event-wrapper')?.removeEventListener('scroll', handleScroll)
        }
    }, [])

    useEffect(() => {
        loadEventList(EventList)
    }, [EventList, pdcEvents])

    useEffect(() => {
        let searchTimeOut
        if (isChanged) {
            const allEventAssets = [...systemEvents, ...pdcEvents.events, ...pdcEvents.documents]
            if (searchText) {
                const eventsArr = allEventAssets.filter((event) => {
                    if (event.eventName.search(new RegExp(searchText, 'i')) >= 0) {
                        return true
                    }
                })
                const eventIds = eventsArr.map((event) => event.uniqId)
                setSearchEventId(eventIds)
                _fetchEventsJob(user_id, organization_id, eventId, created_by, watchalldatetime.start, watchalldatetime.end, timeselectorfilter, searchText, eventIds, eventName)
            }
            searchTimeOut = setTimeout(() => _fetchEvents(), 1000)
        }
        return () => {
            if (searchTimeOut) {
                clearTimeout(searchTimeOut)
            }
        }
    }, [searchText])

    const resetScrollingData = () => {
        allEvents = []
        eventsData = {
            ...eventsData,
            project_id: selectedProject || ProjectId,
            container_id: selectedContainer,
            group_id: selectedGroup,
            truck_id: selectedTruck,
            item_id: selectedItem,
            user_id: parseInt(user_id),
            organization_id: parseInt(organization_id),
            eventId,
            eventName,
            created_by: parseInt(created_by),
            start_date_time: watchalldatetime.start,
            end_date_time: watchalldatetime.end,
            search_text: searchText.trim(),
        }
        isFetchAll = false
    }

    useEffect(() => {
        if (timeoutOrg) clearTimeout(timeoutOrg)
        timeoutOrg = setTimeout(() => {
            refetchProjectDetails()
            // refetchProjectEventParticipants()
            if (selectedProject || ProjectId.length) {
                // getPDCDetails()
            }
        }, 500)
    }, [selectedProject, selectedGroup, selectedTruck, selectedContainer, selectedItem, orgList, ProjectId])

    const fetchProjectParticipantDtetails = async () => {
        if (!isSelected) {
            if (projectDetails.custom_labels) dispatch(setCustomLabels(JSON.parse(projectDetails.custom_labels)))
        } else {
            dispatch(resetCustomLabels())
        }
    }

    const updateUserAndOrganizationDatas = (projectParticipants) => {
        const arr = [{ label: string.participant.showForAllOrganizations, value: 0 }]

        const allUsersArr = [{ label: string.participant.showForAllUsers, userName: string.participant.showForAllUsers, organizationName: '', value: 0 }]
        projectParticipants.map((pUsers) => {
            if (pUsers.id) {
                allUsersArr.push({
                    label: `${pUsers.username} ${pUsers.organization.name}`,
                    userName: pUsers.username,
                    organizationName: pUsers.organization.name,
                    value: pUsers.id,
                })
                const ifExists = arr.find((org) => org.label == pUsers.organization.name)
                if (!ifExists) {
                    arr.push({ label: pUsers.organization.name, value: pUsers.organization.id })
                }
            }
        })
        setAllUsers(allUsersArr.length > 1 ? allUsersArr : [])
        setEventParticipantFilterOptions(arr.length > 1 ? arr : [])
    }

    useMemo(() => {
        if (timeoutOrg) clearTimeout(timeoutOrg)
        timeoutOrg = setTimeout(() => {
            if (orgList.length) {
                fetchProjectParticipantDtetails()
            }
        }, 500)
        refetchEventCategories()
        refetchDocumentCategories()
    }, [projectDetails, orgList])

    const _addComment = async (comment, project_event_id, selectedItem, type) => {
        if (!comment) {
            notify(string.errors.enterComment)
            return false
        }
        NProgress.start()
        try {
            const new_comment = await addProjectEventComment({
                comment,
                user_id: user.id,
                project_event_id,
                organization_id: user.organization_id,
                item_id: selectedItem,
                is_viewed: 0,
                type,
            })
            NProgress.done()
            return new_comment
        } catch (err) {
            console.error('Error while fething events => ', err)
            NProgress.done()
        }
    }

    const _handleUserAction = async (project_event_id, userAction, actionType, selectedItem, callback, event_name) => {
        NProgress.start()
        try {
            await handleUserAction({
                user_id: user.id,
                organization_id: user.organization_id,
                project_event_id,
                item_id: selectedItem,
                user_action: userAction,
                type: actionType,
                event_name,
            })

            _fetchEvents()
            if (callback) {
                callback()
            }
            NProgress.done()
        } catch (err) {
            console.error('Error while fething events => ', err)
            NProgress.done()
        }
    }

    /**
     * Seen Document
     */
    const _seenDocument = async (event_submission_id, seenDocument) => {
        NProgress.start()
        try {
            if (!seenDocument) {
                await seenProjectEventDocument({
                    organization_id: user.organization_id,
                    event_submission_id,
                })
                _fetchEvents()
            }
            NProgress.done()
        } catch (err) {
            console.error('Error while fething events => ', err)
            NProgress.done()
        }
    }

    /**
     * Request for deleting @event.
     * @param e is instance of button clicked.
     */
    const _onDeleteEntry = async (id) => {
        NProgress.start()
        try {
            await removeProjectEvent({ id })
            _fetchEvents()
            notify(string.category.eventDelSuccess)
            NProgress.done()
        } catch (err) {
            notify(string.eventDeleteErr)
            NProgress.done()
        }
    }

    const _toggleDocument = () => {
        setSelectedPreviewEvent({})
        setSelectedProjectEvent({})
        if (!selectedProject) {
            notify(string.pleaseSelectOneProject)
            return false
        }
        if (!selectedGroup && !selectedTruck && !selectedContainer && !selectedItem) {
            notify(dynamicLanguageStringChange(string.pleaseSelectItemAny, labels))
            return false
        }
        setDocumentOpen(!documentOpen)
    }

    const _toggleEvent = () => {
        setSelectedPreviewEvent({})
        setSelectedProjectEvent({})
        if (!selectedProject) {
            notify(string.pleaseSelectOneProject)
            return false
        }
        if (!selectedGroup && !selectedTruck && !selectedContainer && !selectedItem) {
            notify(dynamicLanguageStringChange(string.pleaseSelectItemAny, labels))
            return false
        }
        setEventOpen(!eventOpen)
    }

    const _updateProjectisViewed = async (data) => {
        await updateProjectComment(data)
        _fetchEvents()
        setEventOpen(false)
        setDocumentOpen(false)
    }

    /*
     * reload the data based on date picker
     */
    const setaddDatePicker = (event, picker) => {
        settimeselectorfilter('0')
        timeFilter = '0'
        const start = moment(picker.startDate).startOf('day').format('YYYY-MM-DD HH:mm:ss')
        const end = moment(picker.endDate).endOf('day').format('YYYY-MM-DD HH:mm:ss')
        setwatchalldatetime({ start, end, isChanged: true })
        _fetchEventsJob(user_id, organization_id, eventId, created_by, start, end, timeselectorfilter, searchText, searchEventId, eventName)
    }

    /*
     * finalize the array and set it to view
     */
    const setuserview = async (result_data) => {
        const finalarr = []
        await result_data.forEach((values, keys) => {
            let nameList
            nameList = values.map((ev, i) => {
                return ev
            })
            finalarr.push({ key: keys, val: nameList })
        })
        setEventList(finalarr)
        loadEventList(finalarr)
    }

    /**
     *  get first set of array, based on last position of data, Initialy last Position remains 10
     *  for first call we get data for 0,10
     */
    const getgroupeddata = async (projectEvents, groupfilter) => {
        let response
        if (groupfilter == 'day') {
            response = groupBy(projectEvents, (ev) => ev.createdAt, 'MMM Do YYYY', 'day')
        } else if (groupfilter == 'week') {
            response = groupBy(projectEvents, (ev) => ev.createdAt, 'MMM Do YYYY', 'week')
        } else {
            response = groupBy(projectEvents, (ev) => ev.createdAt, 'MMMM, YYYY', 'month')
        }
        setuserview(response)
    }

    /**
     * Request for fetching all @events
     */
    const _fetchEvents = async (isScrolling = false) => {
        NProgress.start()
        startLoader()

        try {
            let eventLimit = EVENTS_LIMIT
            if (window && window.innerHeight > 1000) {
                eventLimit = parseInt(eventLimit) + 30
            }
            let pEventUsers = projectEventUsers

            const data = {
                ...(isScrolling
                    ? eventsData
                    : {
                          project_id: selectedProject || ProjectId,
                          container_id: selectedContainer,
                          group_id: selectedGroup,
                          truck_id: selectedTruck,
                          item_id: selectedItem,
                          user_id: parseInt(user_id),
                          user_role_id,
                          organization_id: parseInt(organization_id),
                          eventId,
                          eventName,
                          created_by: parseInt(created_by),
                          start_date_time: watchalldatetime.start,
                          end_date_time: watchalldatetime.end,
                          language: getSelectedLanguage(),
                          search_text: searchText.trim(),
                          searchEventId,
                          ...(selectedPDCName?.value && { pdc_name: selectedPDCName.value }),
                      }),
                limit: eventLimit,
                offset: isScrolling ? allEvents.length : 0,
            }
            const events = await fetchProjectEvents(data)
            if (events?.eventUsers?.length) {
                pEventUsers = _.unionBy([].concat.apply(pEventUsers, events.eventUsers), 'id')
                setProjectEventUsers(pEventUsers)
            }
            if (!isChanged) {
                setIsChanged(true)
            }
            if (isScrolling && (events.projectEvents?.length % eventLimit !== 0 || !events.projectEvents?.length)) {
                isFetchAll = true
            }
            if (userManualEvents.length === 0) {
                userManualEvents = (isNotAdminRole && events.userManualEvents) || []
            }
            eventsData = Object.assign({}, data)
            if (isScrolling) {
                if (events.projectEvents?.length) allEvents.push(...events.projectEvents)
            } else {
                allEvents = events.projectEvents.slice()
            }
            fetchUserAllEvents(data).then((userAllEvents) => {
                setAllProjectEvent(userAllEvents)
            })
            setEventType(allEvents)
            getgroupeddata(allEvents, isScrolling ? timeFilter : timeselectorfilter)
            closeLoader()
            NProgress.done()
        } catch (err) {
            closeLoader()
            console.error('Error while fething events => ', err)
            NProgress.done()
        }
    }

    const userEvents = filteredEvent.map((val) => val.val.filter((ev) => ev?.project_event))
    const selectedAll = selectedMenu != 'showEvents' && userEvents.length && userEvents.every((val) => val.every((ev) => ev?.project_event?.checked))
    const deselectedAll = selectedMenu !== undefined && userEvents.length && userEvents.every((val) => val.every((ev) => !ev?.project_event?.checked))

    const fetchProjectEventsAPI = useCallback(
        async (user_id, organization_id, eventId, created_by, watchallstart, watchallend, timeselectorfilter, searchText, searchEventId, eventName) => {
            const canApiCall = !userEvents.some((ue) => ue.length)
            if (canApiCall) {
                let pEventUsers = projectEventUsers
                let eventLimit = allEvents.length

                const data = {
                    project_id: selectedProject || ProjectId,
                    container_id: selectedContainer,
                    group_id: selectedGroup,
                    truck_id: selectedTruck,
                    item_id: selectedItem,
                    user_id: parseInt(user_id),
                    user_role_id,
                    organization_id: parseInt(organization_id),
                    eventId,
                    eventName,
                    created_by: parseInt(created_by),
                    language: getSelectedLanguage(),
                    start_date_time: watchallstart,
                    end_date_time: watchallend,
                    // lastEventId: allEvents.length ? allEvents[allEvents.length - 1].id : 0,
                    // createdAt: allEvents.length ? allEvents[allEvents.length - 1].createdAt : 0,
                    search_text: searchText.trim(),
                    searchEventId,
                    ...(selectedPDCName?.value && { pdc_name: selectedPDCName.value }),
                    limit: eventLimit,
                    offset: 0,
                }
                const events = await fetchProjectEvents(data)
                if (events?.eventUsers?.length) {
                    pEventUsers = _.unionBy([].concat.apply(pEventUsers, events.eventUsers), 'id')
                    setProjectEventUsers(pEventUsers)
                }
                allEvents = events.projectEvents.slice()
                if (userManualEvents.length === 0) {
                    userManualEvents = (isNotAdminRole && events.userManualEvents) || []
                }
                fetchUserAllEvents(data).then((userAllEvents) => {
                    setAllProjectEvent(userAllEvents)
                })
                // setEventType(projectEvents)
                setEventType(allEvents)
                getgroupeddata(allEvents, timeFilter)
            }
        },
        [userEvents, selectedProject, ProjectId, selectedContainer, selectedGroup, selectedTruck, selectedItem, selectedPDCName],
    )

    const _fetchEventsJob = (user_id, organization_id, eventId, created_by, watchallstart, watchallend, timeselectorfilter, searchText, searchEventId, eventName) => {
        if (interval) {
            clearInterval(interval)
        }
        interval = setInterval(async () => {
            document.getElementById('watchall-event-wrapper')?.removeEventListener('scroll', handleScroll)
            fetchProjectEventsAPI(user_id, organization_id, eventId, created_by, watchallstart, watchallend, timeselectorfilter, searchText, searchEventId, eventName)
        }, process.env.EVENT_TIMER || 60000)
    }

    useMemo(() => {
        if (project.length > 0) {
            if (!timer) {
                setTimer(true)
                _fetchEventsJob(user_id, organization_id, eventId, created_by, watchalldatetime.start, watchalldatetime.end, timeselectorfilter, searchText, searchEventId, eventName)
            }
            _fetchEvents()
            const projArr = project.map((p) => ({
                key: p.id,
                value: p.name,
            }))
            window.localStorage.setItem('project_name_obj', JSON.stringify(projArr))
        }
    }, [project])

    useMemo(() => {
        if (userEvents.length) {
            _fetchEventsJob(user_id, organization_id, eventId, created_by, watchalldatetime.start, watchalldatetime.end, timeselectorfilter, searchText, searchEventId, eventName)
        }
        return true
    }, [userEvents])

    useMemo(() => {
        // isFiltered = true
        if (timeoutEvent) clearTimeout(timeoutEvent)
        timeoutEvent = setTimeout(() => {
            document.getElementById('watchall-event-wrapper')?.removeEventListener('scroll', handleScroll)
            resetScrollingData()
            if (selectedProject || ProjectId.length > 0) _fetchEvents()
            _fetchEventsJob(user_id, organization_id, eventId, created_by, watchalldatetime.start, watchalldatetime.end, timeselectorfilter, searchText, searchEventId, eventName)
        }, 500)
    }, [eventId, eventName, created_by, organization_id, selectedProject, selectedContainer, selectedGroup, selectedTruck, selectedItem, watchalldatetime, selectedPDCName])

    const _submitEvent = async ({
        subEvents,
        event,
        items,
        due_date,
        accept_users,
        event_users,
        file,
        type,
        document_deadline,
        image_base,
        json_data,
        formId,
        title,
        description,
        location,
        _,
        pdc,
        canUserSubmitEvent,
        isPDCEvent = true,
        isPublicEvent,
        event_submission_id,
        isIotEventOn,
        isIotEventOff,
        device_id,
    }) => {
        const event_id = event?.uniqId
        if (!event_id) {
            if (type == 'document') {
                notify(string.pleaseSelectDocumentType)
                return false
            }
            notify(string.pleaseSelectEventType)
            return false
        }
        if (!canUserSubmitEvent && pdc) {
            return notify(documentOpen ? string.event.userCannotSubmitDocument : string.event.userCannotSubmitEvent)
        }
        const eventPDCName = !pdc || pdc == 0 ? projectDetails?.pdc_name : pdc?.toString()?.trim() || ''

        if (document_deadline == '') {
            notify(`${string.emailmessages.acceptancedate} ${string.errors.required}`)
            return false
        }
        if (parseInt(document_deadline) <= 0) {
            notify(`${string.acceptancedeadlinereq}`)
            return false
        }
        if (file && file.type && !file_types.includes(file.type)) {
            notify(string.invalidFileFormat)
            return false
        }
        const itemsArray = items.filter((item) => item.isSelected).map((item) => item.item)
        if (!itemsArray.length) {
            notify(dynamicLanguageStringChange(string.pleaseSelectItemAny, labels))
            return false
        }

        let utcDueDate = ''
        if (due_date) {
            utcDueDate = moment(due_date).utc().format('YYYY-MM-DD HH:mm:ss')
        }

        const subEventEventIDs = subEvents.map((event) => event.project_event.event_submission_id)

        const formData = new FormData()
        formData.append('event_id', event_id)
        formData.append('due_date', utcDueDate)
        formData.append('accept_users', accept_users)
        formData.append('event_users', event_users)
        formData.append('isPublicEvent', isPublicEvent)

        if (type == 'document') {
            if (event_users.length > 0) {
                formData.append('is_viewed', 0)
            }
        } else if (accept_users.length > 0) {
            formData.append('is_viewed', 0)
        }
        if (document_deadline != '') {
            formData.append('document_deadline', parseInt(document_deadline))
        } else {
            formData.append('document_deadline', '')
        }
        formData.append('image_base', image_base)
        // formData.append('comment', comment)
        formData.append('itemIds', JSON.stringify(itemsArray))
        formData.append('title', title)
        formData.append('description', description)
        formData.append('location', location)
        formData.append('file', file)
        formData.append('project_id', projectDetails.id)
        // formData.append('item_id', selectedItem)
        formData.append('user_id', user.id)
        formData.append('organization_id', user.organization_id)
        formData.append('user_role', user.role_id)
        formData.append('type', type)
        formData.append('formjsonanswers', json_data)
        formData.append('formbuilderId', formId || '')
        formData.append('pdcName', eventPDCName)
        formData.append('event_submission_id', event_submission_id)
        formData.append('subEventsID', JSON.stringify(subEvents))
        formData.append('sub_event_uniq_ids', JSON.stringify(subEventEventIDs))
        formData.append('event_name', event.eventName)
        formData.append('local_event_name', event.mongolianName)
        formData.append('event_category_id', event.event_category_id)

        // Check the form-builder have assets field
        const formBuilderData = json_data ? JSON.parse(json_data) : []
        formData.append('isAssetEvent', formBuilderData.length > 0 && formBuilderData.some((data) => data.name && data.name.includes('asset')))

        // selection names
        formData.append('groupName', selectedGroupValue.label)
        formData.append('truckName', selectedTruckValue.label)
        formData.append('containerName', selectedContainerValue.label)
        formData.append('itemName', selectedItemValue.label)
        formData.append('isIotEventOn', isIotEventOn || false)
        formData.append('isIotEventOff', isIotEventOff || false)
        formData.append('device_id', device_id || 0)

        if (selectedProjectEvent && selectedProjectEvent.event_submission_id) {
            formData.append('projectEventId', selectedProjectEvent.event_submission_id)
        }
        NProgress.start()
        SetIsSubmitting(true)
        try {
            await addProjectEvent(formData)
            resetScrollingData()
            _fetchEvents()
            setEventOpen(false)
            setDocumentOpen(false)
            fetchProjectParticipantDtetails()
            NProgress.done()
        } catch (err) {
            notify(string.eventAddingErr)
            console.error('Error while fething events => ', err)
            NProgress.done()
        }
        SetIsSubmitting(false)
    }

    const handleScroll = useCallback(
        (e) => {
            // End of the document reached?
            if (e.target.scrollHeight - Math.ceil(e.target.scrollTop) <= e.target.offsetHeight + 50) {
                if (!isFetchAll) {
                    document.getElementById('watchall-event-wrapper')?.removeEventListener('scroll', handleScroll, true)
                    if (timeoutScrollEvent) clearTimeout(timeoutScrollEvent)
                    timeoutScrollEvent = setTimeout(() => {
                        _fetchEvents(true)
                    }, 300)
                }
            }
        },
        [filteredEvent],
    )
    const onSelectAll = (checked) => {
        const filterEvent = filteredEvent.map((val) => {
            val.val.map((ev) => {
                ev.project_event.checked = checked
                return ev
            })
            return val
        })
        document.getElementById('watchall-event-wrapper')?.removeEventListener('scroll', handleScroll)

        setFilteredEvent([...filterEvent])
    }

    const hideEvents = async () => {
        if (!selectedMenu) {
            setHideStatus(false)
        } else {
            setHideStatus(true)
        }
        const event_submission_id = []
        const filterEvent = filteredEvent.map((val) => {
            val.val.map((ev) => {
                ev.project_event.hiddenEvent = ev.project_event.checked
                if (ev.project_event.checked) {
                    event_submission_id.push(ev.project_event.event_submission_id)
                }
                return ev
            })
            return val
        })
        if (event_submission_id.length !== 0 && event_submission_id.length < filterEvent[0].val.length) {
            setHideStatus(true)
        }
        setHiddenProjectEvents(event_submission_id)
        SetMenuIsOpen(false)
        setFilteredEvent([...filterEvent])
        await updateHiddenProjectEvents({ event_submission_id })
    }

    const MenuList = (props) => {
        const style = selectedAll ? { color: 'black', textDecoration: 'none', fontWeight: 'bold' } : { color: '#666', textDecoration: 'none' }
        return (
            <components.MenuList {...props}>
                <div className='px-3'>
                    <div className='d-flex'>
                        <a
                            style={selectedMenu == 'showEvents' ? { color: 'black', textDecoration: 'none', fontWeight: 'bold', top: 12 } : { color: '#666', textDecoration: 'none', top: 12 }}
                            href='#'
                            className='position-relative  py-2 font-weight-bold'
                            onClick={(event) => {
                                event.preventDefault()
                                setselectedMenu('showEvents')
                            }}
                        >
                            {string.showEvents}
                        </a>
                    </div>
                    <div className='d-flex'>
                        <a
                            style={selectedMenu == 'hideEvents' ? { color: 'black', textDecoration: 'none', fontWeight: 'bold', top: 12 } : { color: '#666', textDecoration: 'none', top: 12 }}
                            href='#'
                            className='position-relative  py-2 font-weight-bold'
                            onClick={(event) => {
                                event.preventDefault()
                                setselectedMenu('hideEvents')
                            }}
                        >
                            {string.hideEvent}
                        </a>
                    </div>
                </div>
                {
                    <div className='d-flex p-3 justify-content-between'>
                        <div className='show-hide'>
                            <a
                                style={style}
                                href='#'
                                className={`mr-2  ${selectedMenu == 'showEvents' && 'disabled'}`}
                                onClick={(event) => {
                                    event.preventDefault()
                                    if (selectedMenu != 'showEvents') onSelectAll(true)
                                    setselectedMenu('')
                                }}
                            >
                                {string.selectAll}
                            </a>
                            <a
                                style={deselectedAll ? { color: 'black', textDecoration: 'none', fontWeight: 'bold' } : { color: '#666', textDecoration: 'none' }}
                                href='#'
                                onClick={(event) => {
                                    event.preventDefault()
                                    onSelectAll(false)
                                    if (!selectedMenu) {
                                        setselectedMenu('showEvents')
                                    }
                                }}
                            >
                                {string.deselectAll}
                            </a>
                        </div>
                        <Button style={{ fontSize: '14px', minWidth: '30px', height: 'fit-content', paddindTop: '2px', paddingBottom: '2px' }} className='btn btn-primary m-0 px-3' onClick={hideEvents}>
                            {string.notificationSettings.applyBtn}
                        </Button>
                    </div>
                }
            </components.MenuList>
        )
    }

    useMemo(() => {
        if (timeoutScroll) clearTimeout(timeoutScroll)
        timeoutScroll = setTimeout(() => {
            document.getElementById('watchall-event-wrapper')?.removeEventListener('scroll', handleScroll)
            document.getElementById('watchall-event-wrapper')?.addEventListener('scroll', handleScroll)
        }, 600)
    }, [pdcEvents, filteredEvent])

    const handleInputChange = (e) => {
        setSearchText(e.target.value)
    }

    const _handleModalEventsAction = (preview_event, project_event) => {
        setSelectedPreviewEvent(preview_event)
        setSelectedProjectEvent(project_event)
    }

    const getloader = () => {
        let isloading = false
        if (pdcIsFetching) {
            if (!pdcEvents.documents.length && !pdcEvents.events.length) {
                isloading = true
            }
        }
        if (loading.some((l) => l) && (!filteredEvent.length || isEventsLoaded)) {
            isloading = true
        }
        return isloading
    }

    useMemo(() => {
        let eventsArr = allProjectEvent?.eventsList?.length
            ? allProjectEvent.eventsList
                  .filter((project_event) => project_event?.event_category_id == process.env.ALERT_EVENTS_CATEGORY && project_event?.local_event_name && project_event?.event_name)
                  .map((project_event) => ({ label: otherLanguage ? project_event?.local_event_name || project_event?.event_name : project_event?.event_name, value: project_event?.event_name, id: project_event?.event_id })) || []
            : []
        const docArr = []
        const allEventAssets = [...systemEvents, ...pdcEvents.events, ...pdcEvents.documents]
        if (user.role_id != process.env.ROLE_ADMIN) {
            userManualEvents.length && allProjectEvent?.eventsList?.length
                ? allProjectEvent?.eventsList?.map((project_event) => {
                      const localEventName = project_event?.local_event_name
                      const eventName = project_event?.event_name
                      if (project_event.attachment_type == 2) {
                          docArr.push({ label: otherLanguage ? localEventName || eventName : eventName, value: eventName, id: project_event.event_id })
                      } else {
                          eventsArr.push({ label: otherLanguage ? localEventName || eventName : eventName, value: eventName, id: project_event.event_id })
                      }
                  })
                : (eventsArr = [])
        } else {
            allProjectEvent?.eventsList?.length
                ? allProjectEvent?.eventsList?.map((project_event) => {
                      const localEventName = project_event?.local_event_name
                      const eventName = project_event?.event_name
                      if (project_event.attachment_type == 2) {
                          docArr.push({ label: otherLanguage ? localEventName || eventName : eventName, value: eventName, id: project_event.event_id })
                      } else {
                          eventsArr.push({ label: otherLanguage ? localEventName || eventName : eventName, value: eventName, id: project_event.event_id })
                      }
                  })
                : (eventsArr = [])
        }
        updateUserAndOrganizationDatas(allProjectEvent?.usersList || [])
        const pdcList = allProjectEvent?.pdcList?.map((projectEvent) => ({ value: projectEvent.pdc_name, label: projectEvent.name })) || []
        setPdcCategoryList([{ value: 0, label: string.showAllPDCs }, ...pdcList])
        const FinalOptionSet = [
            {
                label: string.showAllEvents,
                value: 0,
            },
            {
                label: `${string.transportevents}`,
                options: uniqBy(
                    eventsArr.filter((event) => !!event.value),
                    'value',
                ),
            },
            {
                label: `${string.documentEvents}`,
                options: uniqBy(
                    docArr.filter((event) => !!event.value),
                    'value',
                ),
            },
        ]
        SetEventoptions(eventsArr.length || docArr.length ? FinalOptionSet : [])
    }, [systemEvents, userManualEvents, pdcEvents, allProjectEvent])

    const userProjectSelections = useMemo(() => {
        if (isNotAdminRole) {
            const tempProject = project
            const projectData = tempProject.map((project) => {
                const filterData = project.project_selections?.filter((projSelection) => {
                    return userManualEvents.some((e) => e.item_id == projSelection?.selection_items[0]?.item_id)
                })
                return { ...project, project_selections: filterData || [] }
            })
            return projectData
        }
        return project
    }, [project, JSON.stringify(userManualEvents), isNotAdminRole])
    return (
        <div className='container-fluid padding-x-0'>
            <div className='row d-flex project-listing'>
                <div className='tab-pane fade show active mt-3 w-100' id='event' role='tabpanel' aria-labelledby='event-listing'>
                    <div className='row d-flex event-listing'>
                        <div className='col-md-12 p-0'>
                            <div className='main-card card'>
                                {getloader() && <Loader style={{ top: '120px', position: 'absolute', height: '50px' }} />}
                                <div className='show-hide-popup'>
                                    <div className='col-12 '>
                                        <div className='event-filter col-md-12'>
                                            <div className='d-flex flex-wrap'>
                                                <WatchAllEventFilter project={userProjectSelections} />
                                            </div>
                                            <div className='d-flex flex-wrap mt-3 event-filter'>
                                                <div className='col-md-3 mr-0'>
                                                    <Select
                                                        options={advanceSearchOptions}
                                                        styles={customStyles}
                                                        value={advanceFilterSelection}
                                                        onChange={(selectedOption) => {
                                                            if (selectedOption.value == 'clearFilter') {
                                                                setwatchalldatetime({ start: null, end: null, isChanged: false })
                                                                settimeselectorfilter('0')
                                                                setOrganizationId('')
                                                                setCreatedBy('')
                                                                setEventId('')
                                                                setEventName('')
                                                                setSearchText('')
                                                                setSelectedPDCName('')
                                                                setAdvanceFilterSelection(advanceSearchOptions[1])
                                                                return
                                                            }
                                                            setAdvanceFilterSelection(selectedOption)
                                                        }}
                                                    />
                                                </div>
                                                {advanceFilterSelection.value == 'eventDateRange' && (
                                                    <div className='col-md-3 pl-0'>
                                                        <DateRangePicker
                                                            initialSettings={{ startDate: `${moment(watchalldatetime.start || moment().format('YYYY/MM/DD')).format('MM/DD/YYYY')}`, endDate: `${moment(watchalldatetime.end || moment().subtract(30).format('YYYY/MM/DD')).format('MM/DD/YYYY')}` }}
                                                            onApply={setaddDatePicker}
                                                        >
                                                            <input type='text' className='form-control mr-2' />
                                                        </DateRangePicker>
                                                    </div>
                                                )}
                                                {advanceFilterSelection.value == 'timelineSeparator' && (
                                                    <div className='col-md-3 pl-0'>
                                                        <CustomSelect
                                                            className='form-control'
                                                            value={timeselectorfilter}
                                                            onChange={(event) => {
                                                                settimeselectorfilter(event.target.value)
                                                                timeFilter = event.target.value
                                                                getgroupeddata(eventType, event.target.value)
                                                                _fetchEventsJob(user_id, organization_id, eventId, created_by, watchalldatetime.start, watchalldatetime.end, event.target.value, searchText, searchEventId, eventName)
                                                            }}
                                                        >
                                                            <option value='0'>{string.timelineSelector}</option>
                                                            <option value='day'>{string.timelineSelectorday}</option>
                                                            <option value='week'>{string.timelineSelectorweek}</option>
                                                            <option value='month'>{string.timelineSelectormonth}</option>
                                                        </CustomSelect>
                                                    </div>
                                                )}
                                                {advanceFilterSelection.value == 'eventOrganization' && (
                                                    <div className='col-md-3 pl-0' style={{ fontSize: '14px' }}>
                                                        <Select
                                                            defaultValue={{ label: string.participant.showForAllOrganizations, value: 0 }}
                                                            options={eventParticipantFilterOptions}
                                                            value={eventParticipantFilterOptions.find((org) => org.value == organization_id)}
                                                            onChange={(event) => {
                                                                setOrganizationId(event.value)
                                                                _fetchEventsJob(user_id, event.value, eventId, created_by, watchalldatetime.start, watchalldatetime.end, timeselectorfilter, searchText, searchEventId, eventName)
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                {advanceFilterSelection.value == 'eventUser' && (
                                                    <div className='col-md-3 pl-0'>
                                                        <Select
                                                            defaultValue={{ label: string.participant.showForAllUsers, userName: string.participant.showForAllUsers, organizationName: '', value: '' }}
                                                            options={allUsers}
                                                            styles={customStyles}
                                                            onChange={(event) => {
                                                                setCreatedBy(event.value)
                                                                _fetchEventsJob(user_id, organization_id, eventId, event.value, watchalldatetime.start, watchalldatetime.end, searchText, searchEventId, eventName)
                                                            }}
                                                            formatOptionLabel={function (data) {
                                                                return (
                                                                    <>
                                                                        <span style={{ color: data.value ? '#ED8931' : '#333333' }}>{data.userName}</span> <span style={{ color: '#a56233' }}>{data.organizationName}</span>
                                                                    </>
                                                                )
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                {advanceFilterSelection.value == 'eventAndDocuments' && (
                                                    <div className='col-md-3 pl-0'>
                                                        <Select
                                                            styles={customStyles}
                                                            defaultValue={{ label: string.showAllEvents, value: 0 }}
                                                            className='selectOptions'
                                                            options={eventoptions}
                                                            onChange={(event) => {
                                                                setEventName(event.value)
                                                                _fetchEventsJob(user_id, organization_id, eventId, created_by, watchalldatetime.start, watchalldatetime.end, timeselectorfilter, searchText, searchEventId, event.value)
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                {advanceFilterSelection.value == 'allContent' && (
                                                    <div className='col-md-3 pl-0'>
                                                        <input className='form-control' type='search' value={searchText} onChange={handleInputChange} placeholder={advanceFilterSelection.label} />
                                                    </div>
                                                )}
                                                {advanceFilterSelection.value == 'searchByPDC' && (
                                                    <div className='col-md-3 pl-0'>
                                                        <Select
                                                            styles={customStyles}
                                                            defaultValue={{ label: string.showAllPDCs, value: 0 }}
                                                            className='selectOptions'
                                                            options={pdcCategoryList.length > 1 ? pdcCategoryList : []}
                                                            onChange={(event) => {
                                                                setSelectedPDCName(event)
                                                                _fetchEventsJob(user_id, organization_id, eventId, created_by, watchalldatetime.start, watchalldatetime.end, timeselectorfilter, searchText, searchEventId, eventName)
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                {advanceFilterSelection.value == 'hideEvents' && (
                                                    <div className='col-md-3 pl-0'>
                                                        <Select defaultValue={{ label: string.event.hideEvents, value: '' }} options={[]} styles={customStyles} menuIsOpen={menuIsOpen} onMenuOpen={() => SetMenuIsOpen(true)} onMenuClose={() => SetMenuIsOpen(false)} components={{ MenuList }} />
                                                    </div>
                                                )}
                                                <Button className='btn btn-primary large-btn' onClick={_toggleEvent}>
                                                    {string.submitEvent}
                                                </Button>
                                                <Button className='btn btn-primary large-btn' onClick={_toggleDocument}>
                                                    {string.event.submitDocument}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='card-body watch-all pt-3' id='watchall-event-wrapper'>
                                    <div className='vertical-timeline vertical-timeline--animate vertical-timeline--one-column p-0'>
                                        {filteredEvent.length > 0 &&
                                            !isEventsLoaded &&
                                            !getloader() &&
                                            filteredEvent?.map((val, filterIndex) =>
                                                val.val?.map((ev, i) => {
                                                    ev.user = projectEventUsers.find((user) => user.id == ev.viewUsers[0].created_by)
                                                    return (
                                                        <React.Fragment key={i}>
                                                            {i == 0 && timeselectorfilter != '0' && (
                                                                <div className='vertical-timeline-item vertical-timeline-element timeline-separator-label text-center'>
                                                                    <div>
                                                                        <span className='vertical-timeline-element-date' />
                                                                        <span className='vertical-timeline-element-icon bounce-in'>
                                                                            <label>{val.key}</label>
                                                                        </span>
                                                                        <div style={{ height: '50px' }} className='vertical-timeline-element-content row' />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {hideStatus && (
                                                                <EventRow
                                                                    key={ev._id}
                                                                    handleIntegrity={() => handleIntegrity(ev, filterIndex)}
                                                                    activeIntegerity={activeIntegerity}
                                                                    ev={ev}
                                                                    project={project}
                                                                    handleScroll={handleScroll}
                                                                    setFilteredEvent={setFilteredEvent}
                                                                    filteredEvent={filteredEvent}
                                                                    acceptOpen={acceptOpen}
                                                                    user={user}
                                                                    commentOpen={commentOpen}
                                                                    setDocumentOpen={setDocumentOpen}
                                                                    documentOpen={documentOpen}
                                                                    setEventOpen={setEventOpen}
                                                                    eventOpen={eventOpen}
                                                                    _handleModalEventsAction={_handleModalEventsAction}
                                                                    _handleUserAction={_handleUserAction}
                                                                    _onDeleteEntry={_onDeleteEntry}
                                                                    _addComment={_addComment}
                                                                    _seenDocument={_seenDocument}
                                                                    setCommentOpen={setCommentOpen}
                                                                    setAcceptOpen={setAcceptOpen}
                                                                    _updateProjectisViewed={_updateProjectisViewed}
                                                                    _fetchEvents={_fetchEvents}
                                                                    categoryEvents={[...pdcEvents.events, ...pdcEvents.documents, ...systemEvents]}
                                                                    parent_id={ev._id}
                                                                    watchall
                                                                    pageHeight={240}
                                                                    topPosition={-255}
                                                                    updateFilter={() => {
                                                                        document.getElementById('watchall-event-wrapper')?.removeEventListener('scroll', handleScroll)
                                                                        setFilteredEvent([...filteredEvent])
                                                                    }}
                                                                    seenDocument={
                                                                        ev.project_event.documentSeenUsers?.filter(function (e) {
                                                                            return e.organization_id === parseInt(user.organization_id)
                                                                        }).length != 0
                                                                    }
                                                                    isLastEvent={filteredEvent.length - 1 === filterIndex && i === val.val.length - 1}
                                                                />
                                                            )}
                                                        </React.Fragment>
                                                    )
                                                }),
                                            )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* */}
                    </div>
                </div>
            </div>

            {eventOpen && (
                <EventModal
                    project={projectDetails}
                    projectSelections={userProjectSelections.find((project) => project.id == selectedProject)?.project_selections || []}
                    selectedPreviewEvent={selectedPreviewEvent}
                    selectedProjectEvent={selectedProjectEvent}
                    isOpen={eventOpen}
                    toggle={_toggleEvent}
                    eventParticipantFilters={eventParticipantFilters}
                    transportEvents={systemEvents}
                    _submitEvent={_submitEvent}
                    pdcEvents={filteredPDCEvents?.events || []}
                    is_submitting={is_submitting}
                    watch_all
                    selectedProject={selectedProject}
                    eventFilters={event_categories}
                    currentUser={user}
                    categoryEvents={[...pdcEvents.events, ...pdcEvents.documents, ...systemEvents]}
                />
            )}
            {documentOpen && (
                <DocumentModal
                    project={projectDetails}
                    selectedProject={selectedProject}
                    projectSelections={userProjectSelections.find((project) => project.id == selectedProject)?.project_selections || []}
                    selectedPreviewEvent={selectedPreviewEvent}
                    selectedProjectEvent={selectedProjectEvent}
                    isOpen={documentOpen}
                    pdcEvents={filteredPDCEvents?.documents || []}
                    toggle={_toggleDocument}
                    eventParticipantFilters={eventParticipantFilters}
                    documentEvents={systemEvents}
                    _submitEvent={_submitEvent}
                    auth_user={user}
                    is_submitting={is_submitting}
                    file_types={file_types}
                    watch_all
                    documentFilters={documents_categories}
                    currentUser={user}
                    categoryEvents={[...pdcEvents.events, ...pdcEvents.documents, ...systemEvents]}
                />
            )}
        </div>
    )
}

watchall.getInitialProps = (ctx) => {
    const watchall = true
    return { watchall }
}

watchall.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.string,
    }),
}

watchall.defaultProps = {
    user: null,
    eventId: {},
}

export default withAuth(watchall, { loginRequired: true })
