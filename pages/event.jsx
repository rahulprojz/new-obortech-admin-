import React, { useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/router'
import PropTypes from 'prop-types'
import NProgress from 'nprogress'
import { uniqBy } from 'lodash'
import moment from 'moment-timezone'
import { useDispatch, useSelector } from 'react-redux'
import notify from '../lib/notifier'
import { addProjectEvent, fetchProjectEvents, fetchHiddenProjectEvents, updateHiddenProjectEvents, removeProjectEvent, seenProjectEventDocument, fetchUserAllEvents, addProjectEventComment, handleUserAction, updateProjectComment, allowEventSubmission } from '../lib/api/project-event'
import { forceRenderEventsAction } from '../redux/actions/eventAction'
import { useQuerycategories } from '../lib/api/project-category'
import { useQueryEventDoc } from '../lib/api/event-category'
import { useQueryProjectDetails, useQueryProjectSelections } from '../lib/api/project'
import EventRow from '../components/events/EventRow'
import EventModal from '../components/events/EventModalV2'
import EventFilterComponent from '../components/events/EventsFilterComponent'
import DocumentModal from '../components/events/DocumentModalV2'
import ShowHidePopup from '../components/events/ShowHidePopup'
import string from '../utils/LanguageTranslation'
import { dynamicLanguageStringChange, getLocalTime, groupBy, sanitize, getLocalDBValue } from '../utils/globalFunc'
import { getSelectedLanguage, otherLanguage } from '../utils/selectedLanguage'
import Loader from '../components/common/Loader'
import EventContext from '../store/event/eventContext'
import { fetchUnSeenCountAction } from '../redux/actions/unSeenCountAction'
import { getOrgs } from '../redux/selectors/organizationSelector'
import { getCategoryEvents } from '../redux/selectors/eventSelector'
import { setCustomLabels } from '../redux/actions/customLabelAction'
import { checkIntegrity } from '../lib/api/integrity'
import { integrityWrapper } from '../utils/integrityHelpers'
import { updateSubmitEventErrors } from '../redux/actions/integrityActions'

let interval = null
const EVENTS_LIMIT = 20
let eventsData = {}
let isFetchAll = false
let allProjectEvents = []
let userManualEvents = []
const timeFilter = ''
let timeout = ''
let timeoutScrollEvent = ''

const EventPage = (props) => {
    if (typeof window === 'undefined') {
        return null
    }

    const router = useRouter()
    const dispatch = useDispatch()
    const user = props.user || {}
    const user_id = props.user.id
    const user_role_id = props.user.role_id
    const isNotAdminRole = user.role_id != process.env.ROLE_ADMIN
    const isManagerRole = user.role_id == process.env.ROLE_MANAGER
    const { project_id } = router.query
    const [eventOpen, setEventOpen] = useState(false)
    const [documentOpen, setDocumentOpen] = useState(false)
    const [eventType, setEventType] = useState([])
    const [eventLabelType, setEventLabelType] = useState([])
    const [commentOpen, setCommentOpen] = useState()
    const [acceptOpen, setAcceptOpen] = useState()
    const [timer, setTimer] = useState(false)
    const [is_submitting, SetIsSubmitting] = useState(false)
    const [menuIsOpen, SetMenuIsOpen] = useState(false)
    const [selectedPreviewEvent, setSelectedPreviewEvent] = useState({})
    const [selectedProjectEvent, setSelectedProjectEvent] = useState({})
    const [filteredEvent, setFilteredEvent] = useState([])
    const [allProjectEvent, setAllProjectEvent] = useState({})
    const orgList = useSelector(getOrgs)
    const categoryEvents = useSelector(getCategoryEvents)
    const [loading, setLoading] = useState([])
    const [hideStatus, setHideStatus] = useState(true)
    const {
        selectedItemValue,
        selectedGroupValue,
        selectedTruckValue,
        selectedContainerValue,
        labels,
        selectedGroup,
        selectedTruck,
        selectedContainer,
        selectedItem,
        lastItemUpdatedAt,
        datetime,
        organization_id,
        created_by,
        SetEventoptions,
        SetProjectEventParticipants,
        eventId,
        searchText,
        eventName,
        setPdcCategoryList,
        selectedPDCName,
        searchEventId,
        timeSelectorFilter,
        projectEventUsers,
        setProjectEventUsers,
        selectedMenu,
    } = useContext(EventContext)
    const [isChanged, setIsChanged] = useState(false)
    const [showHiddenEvents, setShowHiddenEvents] = useState(false)
    const [isShowingHiddenEvents, setIsShowHiddenEvents] = useState(false)
    const [hiddenProjectEvents, setHiddenProjectEvents] = useState([])
    const userEvents = filteredEvent.map((val) => val.val.filter((ev) => ev?.project_event?.event?.eventType !== 'alert' && ev?.project_event?.checked))
    const projectBody = useMemo(() => ({ project_id }), [project_id])
    const { data: project, refetch: projectRefetch } = useQueryProjectDetails(projectBody)
    const { data: projectSelections, refetch: refetchProjectSelection } = useQueryProjectSelections(project_id)
    const [{ data: event_categories, isFetching: eventLoading, refetch: refetchEvent }, { data: documents_categories, isFetching: documentLoading, refetch: refetchDocument }] = useQuerycategories(project?.project_category_id)
    const categoryLoading = eventLoading || documentLoading
    const { data: pdcEvents, isFetching: pdcIsFetching, refetch: refetchEventDoc } = useQueryEventDoc(event_categories, documents_categories, user, orgList, categoryLoading, true)
    const [activeIntegerity, SetActiveIntegerity] = useState(null)
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

    const startLoading = () => {
        loading.push(true)
        setLoading(loading)
    }
    const closeLoading = () => {
        loading.pop()
        setLoading(loading)
    }

    const handleScroll = useCallback(
        (e) => {
            // End of the document reached?
            if (e.target.scrollHeight - Math.ceil(e.target.scrollTop) <= e.target.offsetHeight + 50) {
                if (!isFetchAll) {
                    if (timeoutScrollEvent) clearTimeout(timeoutScrollEvent)
                    timeoutScrollEvent = setTimeout(() => {
                        _fetchEvents(true)
                    }, 300)
                    document.getElementById('event-wrapper')?.removeEventListener('scroll', handleScroll, true)
                }
            }
        },
        [filteredEvent],
    )
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
        SetActiveIntegerity(null)
    }

    const getHiddenProjectEvents = async () => {
        const hiddenEvents = await fetchHiddenProjectEvents()
        if (hiddenEvents && hiddenEvents.length) setHiddenProjectEvents(hiddenEvents.map((event) => event.project_event_id))
    }

    useMemo(() => {
        document.getElementById('event-wrapper')?.removeEventListener('scroll', handleScroll, true)
        document.getElementById('event-wrapper')?.addEventListener('scroll', handleScroll, true)
    }, [pdcEvents, filteredEvent])

    useEffect(() => {
        getHiddenProjectEvents()
        return () => {
            resetScrollingData()
            clearInterval(interval)
            document.getElementById('event-wrapper')?.removeEventListener('scroll', handleScroll)
        }
    }, [])

    useEffect(() => {
        if (lastItemUpdatedAt) {
            projectRefetch()
            // refetchProjectSelection()
        }
    }, [lastItemUpdatedAt])

    useEffect(() => {
        if (project?.id != undefined) {
            // Check if logged in user is part of project or not
            if (
                user.role_id != process.env.ROLE_ADMIN &&
                project.project_users.filter(function (e) {
                    return parseInt(e.user.id) === parseInt(user.id)
                }).length == 0
            ) {
                router.push('/404')
            }

            if (!timer) {
                setTimer(true)
                _fetchEventsJob(project_id, user_id, organization_id, eventId, created_by, datetime.start, datetime.end, searchText, searchEventId, eventName)
            }
        }
        if (project?.custom_labels) dispatch(setCustomLabels(JSON.parse(project.custom_labels)))
        refetchEvent()
        refetchDocument()
    }, [project])

    useMemo(() => {
        if (!categoryLoading) {
            NProgress.start()
            startLoading()
            setTimeout(() => {
                refetchEventDoc()
                closeLoading()
            }, 500)
            setTimeout(() => {
                NProgress.done()
            }, 5000)
        }
    }, [event_categories, documents_categories, categoryLoading])

    // useEffect(() => {
    //     try {
    //         if (!project?.project_category_id) {
    //             return
    //         }
    //         fetchProjectPDCList(project?.project_category_id).then((document_types) => {
    //             const PDCList = []
    //             document_types?.map((type) => {
    //                 PDCList.push({ label: type.name, value: type.pdc_name })
    //             })
    //             const options = [{ value: 0, label: string.showAllEvents }, ...PDCList]
    //             setPdcCategoryList(options)
    //         })
    //     } catch (error) {
    //         console.log({ error })
    //     }
    // }, [project])

    useEffect(() => {
        setNewData(eventLabelType, timeSelectorFilter)
    }, [eventLabelType, timeSelectorFilter])

    /**
     * Request for fetching all @events
     */
    const _fetchEvents = async (isScrolling = false) => {
        NProgress.start()
        startLoading()
        document.getElementById('event-wrapper')?.removeEventListener('scroll', handleScroll, true)
        try {
            let pEventUsers = projectEventUsers
            if (selectedContainer || selectedContainer == null || isScrolling) {
                let eventLimit = EVENTS_LIMIT
                if (window && window.innerHeight > 1000) {
                    eventLimit = parseInt(eventLimit) + 30
                }
                const offset = isScrolling ? allProjectEvents?.length : 0
                const data = {
                    ...(isScrolling
                        ? eventsData
                        : {
                              container_id: selectedContainer,
                              group_id: selectedGroup,
                              truck_id: selectedTruck,
                              item_id: selectedItem,
                              project_id: parseInt(project_id),
                              user_id: parseInt(user_id),
                              user_role_id,
                              organization_id: parseInt(organization_id),
                              eventId,
                              eventName,
                              created_by: parseInt(created_by),
                              start_date_time: datetime.start,
                              end_date_time: datetime.end,
                              search_text: searchText.trim(),
                              searchEventId,
                              ...(selectedPDCName?.value && { pdc_name: selectedPDCName.value }),
                          }),
                    limit: eventLimit,
                    offset,
                }

                const events = await fetchProjectEvents(data)
                if (events && events.projectEvents) {
                    events.projectEvents.forEach((event) => {
                        if (event.integrity_status === 0 || event.integrity_status === 1) {
                            dispatch(updateSubmitEventErrors({ id: event?._id, status: event?.integrity_status }))
                        }
                    })
                }
                if (!isChanged) {
                    setIsChanged(true)
                }
                if (events?.eventUsers?.length) {
                    pEventUsers = _.unionBy([].concat.apply(pEventUsers, events.eventUsers), 'id')
                    setProjectEventUsers(pEventUsers)
                }
                if (isScrolling && (events.projectEvents?.length % EVENTS_LIMIT !== 0 || !events.projectEvents?.length)) {
                    isFetchAll = true
                }
                eventsData = Object.assign({}, data)
                userManualEvents = (isNotAdminRole && events.userManualEvents) || []
                if (isScrolling) {
                    if (events.projectEvents?.length) {
                        allProjectEvents.push(...events.projectEvents)
                    }
                } else {
                    allProjectEvents = events.projectEvents.slice()
                }
                const userAllEvents = await fetchUserAllEvents(data)
                setAllProjectEvent(userAllEvents)
                setEventType(allProjectEvents)
                getGroupedData(allProjectEvents, isScrolling ? timeFilter : timeSelectorFilter)
                if (!offset) dispatch(fetchUnSeenCountAction(project_id, user_id))
            }
        } catch (err) {
            console.error('Error while fetching events => ', err)
        }
        NProgress.done()
        closeLoading()
    }

    /**
     *  Get Grouped Data
     */
    const getGroupedData = (projectEvents, groupfilter) => {
        let response
        if (groupfilter == 'day') {
            response = groupBy(projectEvents, (ev) => ev.createdAt, 'MMM Do YYYY', 'day')
        } else if (groupfilter == 'week') {
            response = groupBy(projectEvents, (ev) => ev.createdAt, 'MMM Do YYYY', 'week')
        } else {
            response = groupBy(projectEvents, (ev) => ev.createdAt, 'MMMM, YYYY', 'month')
        }
        setNewData(response)
    }

    const fetchEventsJobApi = useCallback(
        async (project_id, user_id, organization_id, eventId, created_by, startdatetime, enddatetime, searchText, searchEventId, eventName) => {
            const canApiCall = !userEvents.some((ue) => ue.length)
            if (canApiCall) {
                let eventLimit = allProjectEvents.length
                let pEventUsers = projectEventUsers
                const data = {
                    container_id: selectedContainer,
                    group_id: selectedGroup,
                    truck_id: selectedTruck,
                    item_id: selectedItem,
                    project_id: parseInt(project_id),
                    user_id: parseInt(user_id),
                    user_role_id,
                    organization_id: parseInt(organization_id),
                    eventId,
                    eventName,
                    created_by: parseInt(created_by),
                    start_date_time: startdatetime,
                    end_date_time: enddatetime,
                    language: getSelectedLanguage(),
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
                // allProjectEvents = events.projectEvents
                userManualEvents = (isNotAdminRole && events.userManualEvents) || []
                const userAllEvents = await fetchUserAllEvents(data)
                setAllProjectEvent(userAllEvents)
                setEventType(allProjectEvents)
                getGroupedData(allProjectEvents, timeFilter)
            }
        },
        [pdcEvents, userEvents, selectedPDCName, selectedContainer, selectedGroup, selectedTruck, selectedItem],
    )

    const _fetchEventsJob = (project_id, user_id, organization_id, eventId, created_by, startdatetime, enddatetime, searchText, searchEventId, eventName) => {
        if (interval) {
            clearInterval(interval)
        }
        interval = setInterval(() => {
            document.getElementById('event-wrapper')?.removeEventListener('scroll', handleScroll, true)
            fetchEventsJobApi(project_id, user_id, organization_id, eventId, created_by, startdatetime, enddatetime, searchText, searchEventId, eventName)
        }, process.env.EVENT_TIMER || 60000)
    }

    useMemo(() => {
        if (orgList.length && categoryEvents.length) {
            projectRefetch()
            refetchProjectSelection()
        }
    }, [orgList, categoryEvents])

    const openDoc = useMemo(() => {
        if (documentOpen && interval) {
            clearInterval(interval)
        } else {
            if (interval) {
                clearInterval(interval)
            }
            _fetchEventsJob(project_id, user_id, organization_id, eventId, created_by, datetime.start, datetime.end, searchText, searchEventId, eventName)
        }
    }, [documentOpen, pdcEvents, userEvents])

    const getUserOrgName = () => {
        const selectedOrg = orgList.find(({ id }) => id === user.organization_id)
        return sanitize(selectedOrg?.blockchain_name)
    }

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
        const eventPDCName = !pdc || pdc == 0 ? project?.pdc_name : pdc?.toString()?.trim() || ''

        if (document_deadline == '') {
            notify(`${string.emailmessages.acceptancedate} ${string.errors.required}`)
            return false
        }
        if (parseInt(document_deadline) <= 0) {
            notify(`${string.acceptancedeadlinereq}`)
            return false
        }
        if (file && !file_types.includes(file.type)) {
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
        formData.append('title', title)
        formData.append('description', description)
        formData.append('location', location)
        formData.append('file', file)
        formData.append('project_id', project_id)
        formData.append('itemIds', JSON.stringify(itemsArray))
        formData.append('user_id', user.id)
        formData.append('organization_id', user.organization_id)
        formData.append('user_role', user.role_id)
        formData.append('type', type)
        formData.append('formjsonanswers', json_data)
        formData.append('formbuilderId', formId || '')
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
        formData.append('event_submission_id', event_submission_id)

        formData.append('isIotEventOff', isIotEventOff || false)
        formData.append('isIotEventOn', isIotEventOn || false)
        formData.append('device_id', device_id || 0)

        if (selectedProjectEvent && selectedProjectEvent.event_submission_id) {
            formData.append('projectEventId', selectedProjectEvent.event_submission_id)
        }
        formData.append('pdcName', eventPDCName)
        NProgress.start()
        SetIsSubmitting(true)

        const eventPayload = {
            orgName: getUserOrgName(),
            userName: user?.unique_id,
            pdc: eventPDCName,
            eventName: `EVENT_${event_id}` || `EVENT_${project_id}`,
            users: [user?.unique_id],
            orgs: [getUserOrgName() === process.env.HOST_ORG ? process.env.HOST_MSP : getUserOrgName()],
        }
        try {
            const isEventSubmissionAllowed = await allowEventSubmission({ ...eventPayload })
            const isAddEventAllowed = JSON.parse(isEventSubmissionAllowed.data)
            if (!isAddEventAllowed.success) {
                throw isAddEventAllowed.message
            }
            await addProjectEvent(formData)
            resetScrollingData()
            _fetchEvents()
            setEventOpen(false)
            setDocumentOpen(false)
            NProgress.done()
        } catch (err) {
            notify(string.eventAddingErr)
            console.error('Error while fething events => ', err)
            NProgress.done()
        }
        SetIsSubmitting(false)
    }

    const _addComment = async (comment, event_submission_id, item_id, type, project_event) => {
        if (!comment) {
            notify(string.errors.enterComment)
            return false
        }
        NProgress.start()
        try {
            const new_comment = await addProjectEventComment({
                comment,
                event_name: otherLanguage ? project_event.local_event_name : project_event.event_name,
                user_id: user.id,
                event_submission_id,
                organization_id: user.organization_id,
                item_id,
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

    const _handleUserAction = async (project_event_id, userAction, actionType, item_id, callback, event_name) => {
        NProgress.start()
        try {
            await handleUserAction({
                user_id: user.id,
                organization_id: user.organization_id,
                project_event_id,
                item_id,
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
            console.error('Error while fetching events => ', err)
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
        if (!selectedGroup && !selectedTruck && !selectedContainer && !selectedItem) {
            notify(dynamicLanguageStringChange(string.pleaseSelectItemAny, labels))
            return false
        }
        if (!documentOpen) {
            localStorage.removeItem('resubmitId')
        }
        setDocumentOpen(!documentOpen)
    }

    const _toggleEvent = () => {
        setSelectedPreviewEvent({})
        setSelectedProjectEvent({})
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

    const setNewData = (eventLabelType, timeSelectorFilter) => {
        const allEventsArr = []
        if (eventLabelType != '' && timeSelectorFilter != '' && timeSelectorFilter != 'undefined') {
            eventLabelType.forEach((values, keys) => {
                let nameList
                nameList = values.map((ev, i) => {
                    return ev
                })
                allEventsArr.push({ key: keys, val: nameList })
            })
            generateFilterEvents(allEventsArr)
        }
    }

    const generateFilterEvents = useCallback(
        (EventsList) => {
            if (!EventsList.length) {
                closeLoading()
                setFilteredEvent([])
                return
            }
            const filteredList = []
            EventsList.map((eventObj) => {
                const eventList = []
                eventObj?.val?.map((event) => {
                    const eventObj = categoryEvents.find((categoryEvent) => categoryEvent.uniqId == event?.event_id)
                    const oldevents = filteredEvent.map((val) => val.val.filter((ev) => ev?.project_event?._id == event?._id))
                    const oldAvailEvents = oldevents.find((ev) => ev.length)
                    let checked = oldAvailEvents && oldAvailEvents.length ? oldAvailEvents[0].project_event.checked : false
                    let hiddenEvent = oldAvailEvents && oldAvailEvents.length ? oldAvailEvents[0].project_event.hiddenEvent : false
                    if (hiddenProjectEvents.includes(event.event_submission_id)) {
                        checked = true
                        hiddenEvent = true
                    }
                    const extraEventData = {
                        eventType: event.event_category_id == process.env.ALERT_EVENTS_CATEGORY ? 'alert' : event.attachment_type == 2 ? 'document' : 'event',
                        uniqId: event.event_id,
                        event_category_id: event.event_category_id,
                        eventName: event.event_name,
                        mongolianName: event.local_event_name,
                        formId: event.form_id,
                    }
                    if (selectedPDCName?.value) {
                        if (event?.pdc_id === selectedPDCName?.value?.trim()) {
                            eventList.push({ ...event, project_event: { ...event, checked, hiddenEvent, event: extraEventData } })
                        }
                    } else {
                        eventList.push({ ...event, project_event: { ...event, checked, hiddenEvent, event: extraEventData } })
                    }
                })
                if (eventList.length) {
                    const values = uniqBy(eventList, (el) => el._id)
                    filteredList.push({ key: eventObj.key, val: values })
                }
            })
            closeLoading()

            // we need this list to remove the continues fetch api call
            if (filteredList.length) setFilteredEvent(filteredList)
            document.getElementById('event-wrapper')?.removeEventListener('scroll', handleScroll, true)
        },
        [userEvents, categoryEvents, pdcEvents, allProjectEvent],
    )

    useMemo(() => {
        let eventsArr = allProjectEvent?.eventsList?.length
            ? allProjectEvent.eventsList
                  .filter((projectEvent) => projectEvent.event_category_id == process.env.ALERT_EVENTS_CATEGORY)
                  .map((projectEvent) => ({ label: otherLanguage ? projectEvent?.local_event_name || projectEvent?.eventName : projectEvent?.eventName, value: projectEvent?.eventName })) || []
            : []
        const docArr = []
        if (user.role_id != process.env.ROLE_ADMIN) {
            userManualEvents.length && allProjectEvent?.eventsList?.length
                ? allProjectEvent?.eventsList.map((project_event) => {
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
                ? allProjectEvent?.eventsList.map((project_event) => {
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
        const pdcList = allProjectEvent?.pdcList?.map((projectEvent) => ({ value: projectEvent.pdc_name, label: projectEvent.name })) || []
        setPdcCategoryList([{ value: 0, label: string.showAllPDCs }, ...pdcList])
        SetProjectEventParticipants(allProjectEvent?.usersList || [])
    }, [userManualEvents, categoryEvents, allProjectEvent])

    useMemo(() => {
        setNewData(eventLabelType)
    }, [JSON.stringify(pdcEvents)])

    const resetScrollingData = (isJob = false) => {
        allProjectEvents = []
        eventsData = {
            ...eventsData,
            eventId,
            eventName,
            created_by,
            container_id: selectedContainer,
            organization_id: parseInt(organization_id),
            project_id: parseInt(project_id),
            group_id: selectedGroup,
            truck_id: selectedTruck,
            itemsNames: selectedItem,
            start_date_time: getLocalTime(datetime.start),
            end_date_time: getLocalTime(datetime.end),
        }
        isFetchAll = false
    }

    useEffect(() => {
        if (project) {
            document.getElementById('event-wrapper')?.removeEventListener('scroll', handleScroll, true)
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
                if (Object.keys(project).length && (getLocalDBValue(project_id) || selectedItem || selectedContainer || selectedGroup || selectedTruck)) {
                    resetScrollingData(true)
                    if (orgList.length && categoryEvents.length) {
                        _fetchEvents()
                    }
                    _fetchEventsJob(project_id, user_id, organization_id, eventId, created_by, datetime.start, datetime.end, searchText, searchEventId, eventName)
                }
            }, 400)
        }
    }, [eventId, eventName, project, created_by, organization_id, selectedContainer, selectedGroup, selectedTruck, selectedItem, datetime, selectedPDCName])

    const _handleModalEventsAction = (preview_event, project_event) => {
        setSelectedPreviewEvent(preview_event)
        setSelectedProjectEvent(project_event)
    }

    // const canUserAcceptEvent = (event) => {
    //     const allowedUsers = event?.project_event?.project?.project_category?.project_pdc_categories?.find(({ pdc_name = '' }) => pdc_name === event.project_event?.pdc_name)
    //     return allowedUsers?.pdc_organizations?.some(({ accept_user_id }) => accept_user_id == user.id)
    // }

    // const organizatoinOptions = [{ label: string.participant.showForAllOrganizations, value: '' }]
    // const userOptions = [{ label: string.participant.showForAllUsers, userName: string.participant.showForAllUsers, organizationName: '', value: '' }]
    // projectEventParticipants.length > 0 &&
    //     projectEventParticipants.map((pep) => {
    //         if (pep.project_event_users)
    //             pep.project_event_users.map((pUsers) => {
    //                 if (pUsers.user) {
    //                     userOptions.push({
    //                         label: `${pUsers.user.username} ${pUsers.user.organization.name}`,
    //                         userName: pUsers.user.username,
    //                         organizationName: pUsers.user.organization.name,
    //                         value: pUsers.user.id,
    //                     })
    //                     const ifExists = organizatoinOptions.find((org) => org.label == pUsers.user.organization.name)
    //                     if (!ifExists) {
    //                         organizatoinOptions.push({ label: pUsers.user.organization.name, value: pUsers.user.organization.id })
    //                     }
    //                 }
    //             })
    //     })

    const onSelectAll = (checked) => {
        const filterEvent = filteredEvent.map((val) => {
            val.val.map((ev) => {
                ev.project_event.checked = checked
                return ev
            })
            return val
        })
        document.getElementById('event-wrapper')?.removeEventListener('scroll', handleScroll, true)
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

    const isloader = () => {
        let isLoading = false
        if (pdcIsFetching) {
            if (!pdcEvents.events.length && !pdcEvents.documents.length) {
                isLoading = true
            }
        }
        return isLoading
    }

    const userProjectSelections = useMemo(() => {
        if (isManagerRole ? projectSelections?.user_id != user_id : isNotAdminRole) {
            const tempProjectSelectionsData = projectSelections
            const projectData = tempProjectSelectionsData?.project_selections?.filter((projSelection) => {
                return userManualEvents.some((e) => e.item_id == projSelection?.selection_items[0]?.item_id)
            })
            return { ...projectSelections, project_selections: projectData || [] }
        }
        return projectSelections
    }, [projectSelections, userManualEvents, isNotAdminRole])
    return (
        <div key='event-page' id='Project-Event-page' className='container-fluid padding-x-0'>
            <div className='row d-flex project-listing'>
                <div className='tab-pane fade show active w-100' id='event' role='tabpanel' aria-labelledby='event-listing'>
                    <div className='row d-flex event-listing'>
                        <div className='col-md-12' style={{ padding: 0 }}>
                            <div className='main-card card'>
                                <EventFilterComponent
                                    projectSelections={userProjectSelections}
                                    refetchProjectSelection={refetchProjectSelection}
                                    user={user}
                                    _fetchEvents={_fetchEvents}
                                    _fetchEventsJob={_fetchEventsJob}
                                    eventType={eventType}
                                    getGroupedData={getGroupedData}
                                    _toggleEvent={_toggleEvent}
                                    _toggleDocument={_toggleDocument}
                                    project_id={project_id}
                                    project={project}
                                    user_id={user_id}
                                    isChanged={isChanged}
                                    categoryEvents={categoryEvents}
                                    pdcEvents={pdcEvents}
                                    setCheckTrue={onSelectAll}
                                    hideEvents={hideEvents}
                                    filteredEvent={filteredEvent}
                                    menuIsOpen={menuIsOpen}
                                    SetMenuIsOpen={SetMenuIsOpen}
                                    setShowHiddenEvents={setShowHiddenEvents}
                                    setIsShowHiddenEvents={setIsShowHiddenEvents}
                                />
                                {loading.length > 0 || isloader() ? <Loader style={{ top: '120px', position: 'absolute', height: '50px' }} /> : !project ? <div className='text-center'>{string.event.noRecordFound}</div> : null}
                                <div className='card-body pt-3' id='event-wrapper'>
                                    {isloader()
                                        ? null
                                        : filteredEvent?.map((val, filterIndex) => {
                                              return val.val
                                                  ?.filter((ev) => showHiddenEvents || !ev?.project_event?.hiddenEvent)
                                                  .map((ev, i) => {
                                                      ev.user = projectEventUsers.find((user) => user.id == ev.viewUsers[0].created_by)
                                                      return (
                                                          <React.Fragment key={i}>
                                                              {i == 0 && timeSelectorFilter != '' && (
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
                                                                      handleIntegrity={() => handleIntegrity(ev, filterIndex)}
                                                                      activeIntegerity={activeIntegerity}
                                                                      showHiddenEvents={showHiddenEvents}
                                                                      key={ev._id}
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
                                                                      allUsersAccepted={ev.project_event.document_accepted_users?.length == ev.project_event.event_accept_document_users?.length}
                                                                      _handleModalEventsAction={_handleModalEventsAction}
                                                                      _handleUserAction={_handleUserAction}
                                                                      _onDeleteEntry={_onDeleteEntry}
                                                                      _addComment={_addComment}
                                                                      _seenDocument={_seenDocument}
                                                                      setCommentOpen={setCommentOpen}
                                                                      setAcceptOpen={setAcceptOpen}
                                                                      _updateProjectisViewed={_updateProjectisViewed}
                                                                      _fetchEvents={_fetchEvents}
                                                                      categoryEvents={categoryEvents}
                                                                      parent_id={ev._id}
                                                                      updateFilter={() => {
                                                                          document.getElementById('event-wrapper').removeEventListener('scroll', handleScroll, true)
                                                                          setFilteredEvent([...filteredEvent])
                                                                      }}
                                                                      acceptedDocument={
                                                                          ev.project_event?.document_accepted_users?.filter(function (e) {
                                                                              return e.user_id
                                                                          }).length != 0
                                                                      }
                                                                      seenDocument={
                                                                          ev.project_event?.document_seen_users?.filter(function (e) {
                                                                              return e.organization_id === parseInt(user.organization_id)
                                                                          }).length != 0
                                                                      }
                                                                      isLastEvent={filteredEvent.length - 1 === filterIndex && i === val.val?.filter((e) => (showHiddenEvents ? isShowingHiddenEvents || !e?.project_event?.hiddenEvent : !e?.project_event?.hiddenEvent)).length - 1}
                                                                  />
                                                              )}
                                                          </React.Fragment>
                                                      )
                                                  })
                                          })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {eventOpen && (
                <EventModal
                    project={project}
                    selectedPreviewEvent={selectedPreviewEvent}
                    selectedProjectEvent={selectedProjectEvent}
                    projectSelections={userProjectSelections?.project_selections || []}
                    pdcEvents={pdcEvents?.events || []}
                    isOpen={eventOpen}
                    categoryEvents={categoryEvents}
                    toggle={_toggleEvent}
                    eventParticipantFilters={project.project_participants}
                    _submitEvent={_submitEvent}
                    is_submitting={is_submitting}
                    eventFilters={event_categories}
                    currentUser={user}
                    filteredEvent={filteredEvent}
                />
            )}
            {documentOpen && (
                <DocumentModal
                    project={project}
                    selectedPreviewEvent={selectedPreviewEvent}
                    selectedProjectEvent={selectedProjectEvent}
                    categoryEvents={categoryEvents}
                    projectSelections={userProjectSelections?.project_selections || []}
                    pdcEvents={pdcEvents?.documents || []}
                    isOpen={documentOpen}
                    toggle={_toggleDocument}
                    eventParticipantFilters={project.project_participants}
                    _submitEvent={_submitEvent}
                    auth_user={user}
                    is_submitting={is_submitting}
                    file_types={file_types}
                    documentFilters={documents_categories}
                    currentUser={user}
                />
            )}
        </div>
    )
}

EventPage.defaultProps = {
    user: null,
    eventId: {},
}

export default EventPage
