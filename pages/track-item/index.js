import NProgress from 'nprogress'
import dynamic from 'next/dynamic'
import { useCallback, useState, useEffect, useMemo } from 'react'
import moment from 'moment-timezone'
import _ from 'lodash'
import { useSelector, useDispatch } from 'react-redux'
const EventListing = dynamic(() => import('./EventListing'), { ssr: false })
import TrackItemModal from './TrackItemModal'
import { trackItem } from '../../lib/api/item'
import { fetchProjectEvents, fetchUserAllEvents } from '../../lib/api/project-event'
import withAuth from '../../lib/withAuth'
import string from '../../utils/LanguageTranslation.js'
import { getSelectedLanguage, otherLanguage } from '../../utils/selectedLanguage'
import notify from '../../lib/notifier'
import { fetchProjectDetails } from '../../lib/api/project'
import { fetchCategoryEvents } from '../../lib/api/event'
import { fetchProjectEventCategories, fetchProjectDocumentCategories } from '../../lib/api/project-category'
import { sanitize, groupBy, removeDataFromLS } from '../../utils/globalFunc'
import { fetchOrgs } from '../../lib/api/organization'
import Iot from '../iot'
import Analytics from '../analytics'
import { TRACK_ITEM_PAGE } from '../../components/header/Config'
import { EventContextProvider } from '../../store/event/eventContext'
import { setCustomLabels } from '../../redux/actions/customLabelAction'
import { fetchEventsAction } from '../../redux/actions/eventAction'
import { getCustomLabels } from '../../redux/selectors/customLabelSelector'
import { getSystemEvents } from '../../redux/selectors/eventSelector'
import { setTrackItemDetail, resetTrackItemDetail, toggleTrackItemModal } from '../../redux/actions/publicUser'

let interval = null
const EVENTS_LIMIT = 20
let isFetchAll = false
let allProjectEvents = []
let eventsData = {}
let timeFilter = ''
let timeout = ''
let timeoutScrollEvent
const advanceSearchOptions = [
    { value: 'eventDateRange', label: string.event.filterByDateRange },
    { value: 'eventOrganization', label: string.event.filterByOrganization },
    { value: 'eventUser', label: string.event.filterByUser },
    { value: 'timelineSeparator', label: string.timelineSelector },
    { value: 'eventAndDocuments', label: string.event.showAllEvents },
    { value: 'allContent', label: string.event.searchFromAllContent },
]

const TrackItem = (props) => {
    const { user } = props
    const user_role_id = user.role_id
    const dispatch = useDispatch()

    const [projectEventUsers, setProjectEventUsers] = useState([])
    const [code, setCode] = useState(window.localStorage.getItem('itemQrCode') || '')
    const [qrCode, setQrCode] = useState('')
    const [itemEvents, setItemEvents] = useState([])
    const [trackingData, setTrackingData] = useState({ item_id: 0, project_id: 0, item_selection: {}, container_id: null })
    const [isLoading, setIsLoading] = useState(false)
    const [buttonLoading, setButtonLoading] = useState(false)
    const [advanceFilterSelection, setAdvanceFilterSelection] = useState(advanceSearchOptions[1])
    const [organization_id, setOrganizationId] = useState(0)
    const [timeselectorfilter, settimeselectorfilter] = useState('')
    const [eventName, setEventName] = useState('')
    const [datetime, setDatetime] = useState({
        start: null,
        end: null,
        updated: false,
    })
    const [eventParticipantFilters, setEventParticipantFilters] = useState([])
    const [eventoptions, SetEventoptions] = useState([])
    const [event_category, setEventCategory] = useState(0)
    const [searchText, setSearchText] = useState('')
    const [eventlabelType, setEventLabelType] = useState([])
    const [EventList, setEventList] = useState([])
    const [isFetched, setIsFetched] = useState(false)
    const [isChanged, setIsChanged] = useState(false)
    const [filteredEvent, setFilteredEvent] = useState([])
    const [created_by, setCreatedBy] = useState(0)
    const [searchEventId, setSearchEventId] = useState([])
    const [allProjectEvent, setAllProjectEvent] = useState({})
    const systemEvents = useSelector(getSystemEvents)
    const borderEvents = systemEvents.length ? systemEvents.filter((event) => event.uniqId == process.env.borderInEventId || event.uniqId == process.env.borderOutEventid) : []
    const [pdcEvents, setPdcEvents] = useState({
        documents: [],
        events: [],
    })
    const userLanguage = user && user.language ? user.language.toUpperCase() : 'US'
    const labels = useSelector(getCustomLabels)
    const trackItemStore = useSelector((state) => state.publicUser)
    const { projectId: project_id, page, isOpenTrackItemModal: isOpenModal } = trackItemStore

    const _fetchEventsJob = (data = {}) => {
        if (interval) {
            clearInterval(interval)
        }
        interval = setInterval(async () => {
            NProgress.start()
            let pEventUsers = projectEventUsers
            document.getElementById('track-item-wrapper')?.removeEventListener('scroll', handleScroll)
            const { item_id, project_id, event_category, organization_id, created_by, user, datetime, searchText, searchEventId, eventName, container_id } = data || trackingData
            if ((code == '' && qrCode == '') || (!item_id && !container_id) || !project_id) {
                return
            }
            const payload = {
                container_id: null,
                eventId: event_category,
                eventName,
                group_id: null,
                item_id,
                organization_id: parseInt(organization_id),
                project_id: parseInt(project_id),
                created_by: parseInt(created_by),
                truck_id: null,
                user_id: parseInt(user.id),
                user_role_id,
                start_date_time: datetime.start,
                end_date_time: datetime.end,
                search_text: searchText.trim(),
                language: getSelectedLanguage(),
                lastEventId: allProjectEvents?.length ? allProjectEvents[allProjectEvents.length - 1].id : 0,
                createdAt: allProjectEvents?.length ? allProjectEvents[allProjectEvents.length - 1].createdAt : 0,
                searchEventId,
            }
            const events = await fetchProjectEvents(payload)
            const userAllEvents = await fetchUserAllEvents(payload)
            setAllProjectEvent(userAllEvents)
            if (events?.eventUsers?.length) {
                pEventUsers = _.unionBy([].concat.apply(pEventUsers, events.eventUsers), 'id')
                setProjectEventUsers(pEventUsers)
            }
            allProjectEvents = events.projectEvents
            setItemEvents(allProjectEvents)
            getgroupeddata(allProjectEvents, timeFilter)
            NProgress.done()
        }, process.env.EVENT_TIMER || 60000)
    }

    if (typeof window === 'undefined') {
        return null
    }

    const scrollHandler = useMemo(() => {
        document.getElementById('track-item-wrapper')?.removeEventListener('scroll', handleScroll)
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
            document.getElementById('track-item-wrapper')?.addEventListener('scroll', handleScroll)
        }, 500)
    }, [pdcEvents, filteredEvent])

    useEffect(() => {
        if (!systemEvents.length) {
            dispatch(fetchEventsAction())
        }
        if (code || qrCode) {
            const payload = {
                projectId: undefined,
                qrTrackCode: qrCode,
                trackid: code,
            }
            handleTrackItem(payload, false)
        } else {
            handleToggleModal()
        }
        dispatch(resetTrackItemDetail())
        return () => {
            resetScrollingData()
            clearInterval(interval)
            document.getElementById('track-item-wrapper')?.removeEventListener('scroll', handleScroll)
        }
    }, [])

    useEffect(() => {
        if (!EventList.length) {
            setFilteredEvent([])
            return
        }
        let filteredList = []
        EventList.map((ev) => {
            let eventList = []
            ev?.val?.map((event) => {
                const extraEventData = {
                    eventType: event.event_category_id == process.env.ALERT_EVENTS_CATEGORY ? 'alert' : event.attachment_type == 2 ? 'document' : 'event',
                    uniqId: event.event_id,
                    event_category_id: event.event_category_id,
                    eventName: event.event_name,
                    mongolianName: event.local_event_name,
                    formId: event.form_id,
                }
                eventList.push({ ...event, project_event: { ...event, event: extraEventData } })
            })
            if (eventList.length) {
                filteredList.push({ key: ev.key, val: eventList })
            }
        })
        document.getElementById('track-item-wrapper')?.removeEventListener('scroll', handleScroll)
        setFilteredEvent(filteredList)
    }, [EventList, pdcEvents, itemEvents])

    useEffect(() => {
        let searchTimeOut
        if (isChanged) {
            const allEventAssets = [...borderEvents, ...pdcEvents.events, ...pdcEvents.documents]
            let eventIds = []
            if (searchText) {
                const eventsArr = allEventAssets.filter((event) => {
                    if (event.eventName.search(new RegExp(searchText, 'i')) >= 0) {
                        return true
                    }
                })
                eventIds = eventsArr.map((event) => event.uniqId)
                setSearchEventId(eventIds)
            }
            _fetchEventsJob({ ...trackingData, event_category, organization_id, created_by, user, datetime, searchText, searchEventId: eventIds })
            searchTimeOut = setTimeout(() => handleFetchEvents(), 1000)
        }
        return () => {
            if (searchTimeOut) {
                clearTimeout(searchTimeOut)
            }
        }
    }, [searchText])

    const resetScrollingData = useCallback(() => {
        allProjectEvents = []
        const { item_id, project_id } = trackingData
        eventsData = {
            ...eventsData,
            container_id: null,
            eventId: event_category,
            eventName,
            group_id: null,
            item_id,
            language: userLanguage,
            organization_id: user.organization_id,
            organization_id,
            project_id,
            truck_id: null,
            user_id: user.id,
            start_date_time: datetime.start,
            end_date_time: datetime.end,
            search_text: searchText.trim(),
        }
        isFetchAll = false
    }, [user, trackingData, event_category, organization_id, datetime, searchText, userLanguage])

    const handleFetchEvents = useCallback(
        async (data, isScrolling = false) => {
            try {
                document.getElementById('track-item-wrapper')?.removeEventListener('scroll', handleScroll)
                const { item_id, project_id, container_id } = data || trackingData
                if ((code == '' && qrCode == '') || (!item_id && !container_id) || !project_id) {
                    return
                }
                let pEventUsers = projectEventUsers
                NProgress.start()
                const payload = {
                    ...(isScrolling
                        ? eventsData
                        : {
                              container_id: container_id || null,
                              eventId: event_category,
                              eventName,
                              group_id: null,
                              item_id: item_id || null,
                              organization_id: parseInt(organization_id),
                              project_id: parseInt(project_id),
                              created_by: parseInt(created_by),
                              truck_id: null,
                              user_id: parseInt(user.id),
                              user_role_id,
                              start_date_time: datetime.start,
                              end_date_time: datetime.end,
                              search_text: searchText.trim(),
                              searchEventId,
                          }),
                    limit: EVENTS_LIMIT,
                    offset: isScrolling ? allProjectEvents?.length : 0,
                }
                const events = await fetchProjectEvents(payload)
                if (events?.eventUsers?.length) {
                    pEventUsers = _.unionBy([].concat.apply(pEventUsers, events.eventUsers), 'id')
                    setProjectEventUsers(pEventUsers)
                }
                if (!isChanged) {
                    setIsChanged(true)
                }
                if (isScrolling && (events.projectEvents?.length % EVENTS_LIMIT !== 0 || !events.projectEvents?.length)) {
                    isFetchAll = true
                }
                eventsData = Object.assign({}, payload)
                if (isScrolling) {
                    allProjectEvents.push(...events.projectEvents)
                } else {
                    allProjectEvents = events.projectEvents.slice()
                }
                const userAllEvents = await fetchUserAllEvents(payload)
                setAllProjectEvent(userAllEvents)
                setItemEvents(allProjectEvents)
                getgroupeddata(allProjectEvents, isScrolling ? timeFilter : timeselectorfilter)
                NProgress.done()
            } catch (err) {
                console.log(err)
                NProgress.done()
            }
        },
        [code, qrCode, user, trackingData, allProjectEvents, created_by, eventsData, datetime, timeselectorfilter, event_category, eventName, organization_id, isChanged, searchText, userLanguage, getgroupeddata],
    )

    useEffect(() => {
        resetScrollingData()
        handleFetchEvents()
        _fetchEventsJob({ ...trackingData, event_category, organization_id, created_by, user, datetime, searchText, searchEventId, eventName })
    }, [event_category, organization_id, created_by, datetime, eventName])

    useEffect(() => {
        setNewData(eventlabelType, timeselectorfilter)
    }, [eventlabelType, timeselectorfilter])

    const handleScroll = useCallback(
        (e) => {
            // End of the document reached?
            if (e.target.scrollHeight - Math.ceil(e.target.scrollTop) <= e.target.offsetHeight + 100) {
                if (timeoutScrollEvent) clearTimeout(timeoutScrollEvent)
                timeoutScrollEvent = setTimeout(() => {
                    if (!isFetchAll) {
                        handleFetchEvents(null, true)
                    }
                }, 300)
            }
        },
        [isFetchAll, handleFetchEvents],
    )

    const handleToggleModal = useCallback(() => {
        window.localStorage.getItem('itemQrCode') && setCode(window.localStorage.getItem('itemQrCode'))
        dispatch(toggleTrackItemModal())
    }, [])

    const handleFetchProject = useCallback(
        async (project_id = 0) => {
            const project_details = await fetchProjectDetails({ project_id })
            if (project_details.custom_labels) dispatch(setCustomLabels(JSON.parse(project_details.custom_labels)))
            const event_categories = await fetchProjectEventCategories({
                project_category_id: project_details.project_category_id,
            })
            const document_categories = await fetchProjectDocumentCategories({
                project_category_id: project_details.project_category_id,
            })
            await fetchEventAssets(event_categories, document_categories)
            setIsLoading(false)
            NProgress.done()
        },
        [fetchEventAssets],
    )

    const fetchEventAssets = async (event_categories, document_categories) => {
        try {
            let eventCategoryIds = []
            let documentCategoryIds = []

            event_categories.map((event) => {
                eventCategoryIds.push(event.event_category_id)
            })

            document_categories.map((document) => {
                documentCategoryIds.push(document.document_category_id)
            })

            const orgList = await fetchOrgs()
            const selectedOrg = orgList?.find(({ id }) => id === user?.organization_id)
            if (Object.values(selectedOrg).length === 0) {
                return
            }
            const { documentCategory, eventCategory } = await fetchCategoryEvents({ eventCategoryIds, documentCategoryIds })
            const events = [].concat.apply(
                [],
                eventCategory.map((event) => event.events),
            )
            const documents = [].concat.apply(
                [],
                documentCategory.map((event) => event.events),
            )

            setPdcEvents({ events, documents })
        } catch (err) {
            console.log(err)
        }
    }

    const handleTrackItem = useCallback(
        async (payload = {}, isOpenModal = true) => {
            setIsLoading(true)
            setButtonLoading(true)
            const response = await trackItem({ code: payload.trackid, qrCode: payload.qrTrackCode })
            if ((response.item_id || response.container_id) && response.project_id) {
                removeDataFromLS(['itemQrCode', `${payload.projectId}_selection`])
                const { item_id = 0, container_id = 0, isContainer, project_id = 0, item_selection = {} } = response || {}
                const data = { project_id, item_selection }

                window.localStorage.setItem('itemQrCode', code)
                if (isContainer) {
                    data.container_id = container_id
                    window.localStorage.setItem(`${project_id}_selection`, JSON.stringify({ container: { value: data.item_selection.container.id, label: data.item_selection.container.containerID } }))
                } else {
                    data.item_id = item_id
                    window.localStorage.setItem(`${project_id}_selection`, JSON.stringify({ item: { value: data.item_selection.item.id, label: data.item_selection.item.itemID } }))
                }
                dispatch(
                    setTrackItemDetail({
                        projectId: project_id,
                        page: TRACK_ITEM_PAGE.EVENTS,
                        deviceId: 0,
                        itemId: 0,
                        containerId: 0,
                    }),
                )
                handleFetchProject(project_id)
                setTrackingData(data)
                handleFetchEvents(data)
                setIsFetched(true)
                if (isOpenModal) {
                    handleToggleModal()
                }
                _fetchEventsJob({ ...data, event_category, organization_id, created_by, user, datetime, searchText, searchEventId })
            } else {
                setIsLoading(false)
                notify(string.trackItem.itemNotFound)
            }
            setButtonLoading(false)
        },
        [code, handleFetchEvents, handleToggleModal, handleFetchProject, _fetchEventsJob],
    )

    const handleCodeOnChange = useCallback((event) => {
        setCode(event.target.value)
    }, [])

    const handleQrCodeOnChange = useCallback((event) => {
        setQrCode(event.target.value)
    }, [])

    const setaddDatePicker = (event, picker) => {
        settimeselectorfilter('')
        timeFilter = ''
        const startDate = moment(picker.startDate).format('YYYY-MM-DD HH:mm:ss')
        const endDate = moment(picker.endDate).format('YYYY-MM-DD HH:mm:ss')
        setDatetime({
            start: startDate,
            end: endDate,
            updated: true,
        })
    }

    const handleInputChange = (e) => {
        setSearchText(e.target.value)
    }

    const setNewData = async (eventlabelType, timeselectorfilter) => {
        const finalarr = []
        if (eventlabelType != '' && timeselectorfilter != '' && timeselectorfilter != 'undefined') {
            await eventlabelType.forEach((values, keys) => {
                let nameList
                nameList = values.map((ev, i) => {
                    return ev
                })
                finalarr.push({ key: keys, val: nameList })
            })
            setEventList(finalarr)
        }
    }

    /**
     *  Get Grouped Data
     */
    const getgroupeddata = (projectEvents, groupfilter) => {
        let response
        if (groupfilter == 'day') {
            response = groupBy(projectEvents, (ev) => ev.createdAt, 'MMM Do YYYY', 'day')
        } else if (groupfilter == 'week') {
            response = groupBy(projectEvents, (ev) => ev.createdAt, 'MMM Do YYYY', 'week')
        } else {
            response = groupBy(projectEvents, (ev) => ev.createdAt, 'MMMM, YYYY', 'month')
        }
        setEventLabelType(response)
        setNewData(response)
    }

    useMemo(() => {
        let eventsArr = allProjectEvent?.eventsList?.length
            ? allProjectEvent.eventsList
                  .filter((project_event) => project_event?.event_category_id == process.env.ALERT_EVENTS_CATEGORY && project_event?.local_event_name && project_event?.event_name)
                  .map((project_event) => ({ label: otherLanguage ? project_event?.local_event_name || project_event?.event_name : project_event?.event_name, value: project_event?.event_name, id: project_event?.event_id })) || []
            : []
        const docArr = []
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
        const FinalOptionSet = [
            {
                label: string.showAllEvents,
                value: 0,
            },
            {
                label: `${string.transportevents}`,
                options: _.uniqBy(
                    eventsArr.filter((event) => !!event.value),
                    'value',
                ),
            },
            {
                label: `${string.documentEvents}`,
                options: _.uniqBy(
                    docArr.filter((event) => !!event.value),
                    'value',
                ),
            },
        ]
        SetEventoptions(eventsArr.length || docArr.length ? FinalOptionSet : [])
        setEventParticipantFilters(allProjectEvent?.usersList)
    }, [pdcEvents, allProjectEvent])

    const ondatemonthchange = async (event) => {
        const filterBy = event.target.value
        if (filterBy != '0') {
            await settimeselectorfilter(filterBy)
            await getgroupeddata(itemEvents, filterBy)
        } else {
            await settimeselectorfilter('')
        }
    }

    return (
        <EventContextProvider>
            <div>
                {page === TRACK_ITEM_PAGE.EVENTS && (
                    <EventListing
                        projectEventUsers={projectEventUsers}
                        user={user}
                        code={code}
                        item_selection={trackingData.item_selection}
                        list={filteredEvent}
                        isFetched={isFetched}
                        datetime={datetime}
                        setDatetime={setDatetime}
                        handleScroll={handleScroll}
                        setFilteredEvent={setFilteredEvent}
                        searchText={searchText}
                        timeselectorfilter={timeselectorfilter}
                        advanceFilterSelection={advanceFilterSelection}
                        eventParticipantFilters={eventParticipantFilters}
                        eventoptions={eventoptions}
                        advanceSearchOptions={advanceSearchOptions}
                        isLoading={isLoading}
                        setAdvanceFilterSelection={setAdvanceFilterSelection}
                        setaddDatePicker={setaddDatePicker}
                        setOrganizationId={setOrganizationId}
                        setEventCategory={setEventCategory}
                        handleInputChange={handleInputChange}
                        setCreatedBy={setCreatedBy}
                        ondatemonthchange={ondatemonthchange}
                        setEventName={setEventName}
                        pdcEvents={[...pdcEvents.events, ...pdcEvents.documents]}
                    />
                )}
                {page === TRACK_ITEM_PAGE.IOT && <Iot {...props} project_id={parseInt(project_id)} />}
                {page === TRACK_ITEM_PAGE.ANALYTICS && <Analytics {...props} />}

                {isOpenModal && <TrackItemModal isOpenModal={isOpenModal} isLoading={buttonLoading} code={code} qrCode={qrCode} handleQrCodeOnChange={handleQrCodeOnChange} onCodeChange={handleCodeOnChange} onTrackItem={handleTrackItem} onToggleModal={handleToggleModal} />}
            </div>
        </EventContextProvider>
    )
}

export default withAuth(TrackItem, { loginRequired: true })
