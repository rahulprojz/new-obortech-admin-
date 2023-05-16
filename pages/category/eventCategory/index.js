import React, { useState, useEffect, useCallback } from 'react'
import NProgress from 'nprogress'
import string from '../../../utils/LanguageTranslation.js'
import notify from '../../../lib/notifier'
import ShortUniqueId from 'short-unique-id'
import { useCookies } from 'react-cookie'
import { dynamicLanguageStringChange, sanitize } from '../../../utils/globalFunc'
import Button from '../../../components/common/form-elements/button/Button'
import { LOADER_TYPES } from '../../../shared/constants'
import { getPaginationQuery, getPaginationState } from '../../../utils/InfinitePagination'
import { fetchOrgs } from '../../../lib/api/organization'
import { fetchFormListByUserIdRequest } from '../../../lib/api/formBuilder'
import List from './list'
import DeleteModal from '../../../components/common/DeleteModal'
import FormModal from './form'
import AddEventModal from '../../../components/categories/addEventModal'
import { fetchCategorieswithEvents, removeEventCategory, updateEventCategory, addEventCategory } from '../../../lib/api/event-category'
import { addEvent, deleteEvent, updateEvent } from '../../../lib/api/event'
import { checkIntegrity } from '../../../lib/api/integrity'
import { integrityWrapper } from '../../../utils/integrityHelpers'

const randomCode = new ShortUniqueId({ length: 8 })
let timeout
const INITIAL_LOAD_TIME = 10000 //This is used to load events after any event
const EventCategory = ({ user, formmodallist, setformmodallist, orgList, setOrgList, eventCategories, setEventCategories }) => {
    const [event, setEvent] = useState({})
    const [eventModal, setEventModal] = useState(false)
    const [eventCategoryModal, setEventCategoryModal] = useState(false)
    const [values, setValues] = useState({})
    const [categoryIndex, setCategoryIndex] = useState('')
    const [EventformId, setEventformId] = useState({ value: 0 })
    const [selectedData, setSelectedData] = useState({})
    const [cookies, _] = useCookies(['authToken'])

    const [editMode, setEditMode] = useState('')
    const [deleteMode, setDeleteMode] = useState('')
    const [loadingMode, setLoadingMode] = useState({})
    const [selectedIndex, setSelectedIndex] = useState('')
    const [error, setError] = useState('')
    const [activeIntegerity, SetActiveIntegerity] = useState(null)
    const [reRender, setRerender] = useState(null)

    // fetchwithevents-eventcategories
    const _fetchCategorieswithEvents = async (params = {}, isJob = false) => {
        if (!isJob) NProgress.start()
        handleLoadingMode(LOADER_TYPES.EVENT_CATEGORIES, true)
        try {
            const query = { ...params, ...eventCategories }
            const response = await fetchCategorieswithEvents(getPaginationQuery(query))
            query.response = response
            const data = getPaginationState(query)
            setEventCategories(data)
        } catch (err) {
            setError(err.message || err.toString())
        }
        if (!isJob) NProgress.done()
        handleLoadingMode(LOADER_TYPES.EVENT_CATEGORIES, false)
    }

    // Add/Update Event Category
    const _onEventCategorySubmit = (e) => {
        if (editMode === 'eventCategory') {
            _updateEventCategory()
        } else {
            _addEventCategory()
            setValues('')
        }
    }

    // add event category function
    const _addEventCategory = async () => {
        NProgress.start()
        handleLoadingMode(LOADER_TYPES.UPSERT, true)
        try {
            await addEventCategory(values)
            await _fetchCategorieswithEvents({ page: 0 })
            setValues({})
            _toggleEventCategory({})
            notify(string.category.categoryAddSuccess)
        } catch (err) {
            notify(string.category.errorAddCategory)
        }
        NProgress.done()
        handleLoadingMode(LOADER_TYPES.UPSERT, false)
    }

    // update event category function
    const _updateEventCategory = async () => {
        NProgress.start()
        handleLoadingMode(LOADER_TYPES.UPSERT, true)
        try {
            await updateEventCategory(values)
            await _fetchCategorieswithEvents({ isFetchAll: true })
            setValues({})
            _toggleEventCategory({})
            notify(string.category.categoryUpdate)
        } catch (err) {
            notify(string.category.errorAddCategory)
        }
        NProgress.done()
        handleLoadingMode(LOADER_TYPES.UPSERT, false)
    }

    const _onEventSubmit = (e) => {
        setValues({ ...e })
        if (editMode === 'event' && selectedIndex != null) {
            _updateEvent()
        } else {
            _addEvent(event)
            setValues('')
        }
    }

    // add event function
    const _addEvent = async () => {
        NProgress.start()
        handleLoadingMode(LOADER_TYPES.UPSERT, true)
        try {
            const eventData = values
            eventData.type = 'event'
            const eventCategoriesInternal = eventCategories.list
            eventData.event_category_id = eventCategoriesInternal[categoryIndex].id
            const eventPayload = {
                orgName: getUserOrgName(),
                userName: user.unique_id,
                eventObj: {
                    uniqId: randomCode(),
                    type: 'eventasset',
                    eventName: eventData.name,
                    mongolianName: eventData.mongolianName,
                    categoryId: eventData.event_category_id,
                    formId: EventformId.value,
                    deadlineHours: eventData.deadline_hours,
                    eventType: 'event',
                    projectIds: [],
                    usersCanSubmit: [],
                    usersCanAccept: [],
                },
            }
            const addEventresponse = await addEvent(eventPayload, cookies.authToken)
            if (addEventresponse.success) {
                //It should reload after 30 sec
                setTimeout(async () => {
                    await _fetchCategorieswithEvents({ isFetchAll: true })
                }, INITIAL_LOAD_TIME)
                setValues({})
                _toggleEvent({})
                notify(string.eventAddSuccess)
            }
        } catch (err) {
            setError(err.message || err.toString())
            notify(string.eventAddingErr)
        }
        handleLoadingMode(LOADER_TYPES.UPSERT, false)
        NProgress.done()
    }

    // update event function
    const _updateEvent = async () => {
        NProgress.start()
        try {
            handleLoadingMode(LOADER_TYPES.UPSERT, true)

            // call new update event function here
            const eventData = values
            const eventPayload = {
                orgName: getUserOrgName(),
                userName: user.unique_id,
                eventObj: {
                    uniqId: eventData.uniqId,
                    type: 'eventasset',
                    eventName: eventData.name,
                    mongolianName: eventData.mongolianName,
                    categoryId: eventData.event_category_id,
                    formId: EventformId.value,
                    deadlineHours: eventData.deadline_hours,
                    eventType: 'event',
                    projectIds: [],
                    usersCanSubmit: [],
                    usersCanAccept: [],
                },
            }

            const updateResponse = await updateEvent(eventPayload, cookies.authToken)
            if (updateResponse.success) {
                setTimeout(async () => {
                    await _fetchCategorieswithEvents({ isFetchAll: true })
                }, INITIAL_LOAD_TIME)
                setValues({})
                _toggleEvent({})
                handleLoadingMode(LOADER_TYPES.UPSERT, false)
                notify(string.eventUpdateSuccessNot)
                NProgress.done()
            }
        } catch (err) {
            handleLoadingMode(LOADER_TYPES.UPSERT, false)
            notify(string.eventUpdateErrNot)
            NProgress.done()
        }
    }

    const _toggleEvent = (e, cat) => {
        setEventModal(!eventModal)
    }

    const _toggleEventCategory = (e, cat) => {
        setEventCategoryModal(!eventCategoryModal)
    }

    const _setEditMode = (mode, i, j, cat) => {
        if (mode) {
            setValues({ ...cat })
            setCategoryIndex(i)
            setEventformId('')
            if (mode == 'event') {
                if (j != null) {
                    setEditMode(mode)
                    setSelectedIndex(j)
                    const val = formmodallist.filter((item) => item.value === cat.form_id)
                    if (val.length > 0) {
                        setEventformId(val[0])
                    }
                    setEvent(event)
                    _toggleEvent(event)
                } else {
                    setEditMode('')
                    setEvent({})
                    _toggleEvent({})
                }
            } else if (mode == 'eventCategory') {
                setEditMode(mode)
                _toggleEventCategory(cat)
            }
        }
    }

    // set delete mode upon selecting delete icon
    const _setDeleteMode = async (mode, i, cat, data = {}) => {
        if (mode == 'eventCategory') {
            setDeleteMode(mode)
            setSelectedIndex(i)
        } else if (mode == 'event') {
            setDeleteMode(mode)
            setSelectedIndex(i)
            setCategoryIndex(cat)
            setSelectedData(data)
        }
    }

    // Function to delete entry from popup
    const _onDeleteEntry = async (e) => {
        e.preventDefault()
        handleLoadingMode(LOADER_TYPES.DELETE, true)
        try {
            // check which category to delete
            if (deleteMode == 'event') {
                // delete event data
                await deleteEvent(
                    {
                        orgName: getUserOrgName(),
                        userName: user.unique_id,
                        uniqueId: selectedData.uniqId,
                    },
                    cookies.authToken,
                )
                setTimeout(async () => {
                    await _fetchCategorieswithEvents({ isFetchAll: true })
                }, INITIAL_LOAD_TIME)
                setDeleteMode('')
                setSelectedData({})
                notify(string.category.eventDelSuccess)
            } else if (deleteMode == 'eventCategory') {
                // delete event category data
                const category = eventCategories.list[selectedIndex]
                const response = await removeEventCategory({ id: category.id })
                if (response.isDeleted) {
                    await _fetchCategorieswithEvents({ isFetchAll: true })
                    notify(string.category.categoryDelSuccess)
                } else {
                    const events = response.event.map((eventData) => `<li>${eventData?.project_category?.name}</li>`)
                    notify({
                        message: `${dynamicLanguageStringChange(string.category.alreadyInUse, { category: string.project.eventCategory, module: `${string.projectSmallTxt} ${string.categories}` })}<ol style="text-align: left">${events.join('')}</ol>`,
                    })
                }
                setDeleteMode('')
            }
        } catch (err) {
            console.log(err)
        }
        handleLoadingMode(LOADER_TYPES.DELETE, false)
    }

    const handleScroll = useCallback(() => {
        if (window.innerHeight + Math.ceil(document.documentElement.scrollTop) >= document.documentElement.offsetHeight - 100) {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
                const { list, totalCount, pageNumber } = eventCategories
                if (list.length < totalCount) {
                    const params = { page: pageNumber + 1 }
                    _fetchCategorieswithEvents(params)
                }
            }, 300)
        }
    }, [eventCategories])

    const _handleSubmitBtnClick = () => {
        _toggleEventCategory()
        setEditMode('')
        setValues({})
    }

    const getUserOrgName = () => {
        const selectedOrg = orgList.find(({ id }) => id === user.organization_id)
        return sanitize(selectedOrg?.blockchain_name)
    }

    const _fetchformlist = async () => {
        const formlist = await fetchFormListByUserIdRequest(user.organization_id)
        const arr = []
        formlist.data.map(({ id, formname }) => {
            arr.push({ label: formname, value: id })
        })
        setformmodallist(arr)
    }

    const _fetchOrganizationList = async (isJob = false) => {
        if (!isJob) NProgress.start()
        const orgs = await fetchOrgs()
        setOrgList(orgs)
        if (!isJob) NProgress.done()
    }

    const handleLoadingMode = (type, isFetching) => {
        setLoadingMode((prevState) => {
            return { ...prevState, [type]: isFetching }
        })
    }

    const fetchAllData = (isJob = false) => {
        _fetchformlist()
        _fetchOrganizationList(isJob)
        _fetchCategorieswithEvents(isJob ? { isFetchAll: true } : {}, isJob)
    }

    useEffect(() => {
        if (!eventCategories.list.length) {
            fetchAllData()
        }

        return () => {
            if (timeout) clearTimeout(timeout)
        }
    }, [])

    const handleIntegrity = async (category, event) => {
        SetActiveIntegerity(event)
        const response = await checkIntegrity({ type: 'event', uniqId: event.uniqId })
        if (response.data) {
            const activeCategoryIndex = eventCategories.list.findIndex(({ id }) => id === category.id)
            let activeEvents = eventCategories.list[activeCategoryIndex].events
            const updatedEvents = await integrityWrapper(response.data, activeEvents)
            activeEvents = updatedEvents
            setEventCategories(eventCategories)
            setRerender(Math.random())
        }
        SetActiveIntegerity(null)
    }
    return (
        <>
            <div className='tab-pane active mt-3 w-100' id='eventCategory' role='tabpanel' aria-labelledby='event-listing'>
                <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                    <h4 className='text-dark'>{string.eventCatTitle}</h4>
                    <Button className='btn btn-primary large-btn' onClick={_handleSubmitBtnClick}>
                        {string.submitCatBtn}
                    </Button>
                </div>

                <List
                    handleIntegrity={(value, event) => handleIntegrity(value, event)}
                    activeIntegerity={activeIntegerity}
                    isLoading={Boolean(loadingMode[LOADER_TYPES.EVENT_CATEGORIES])}
                    events={[]}
                    event_categories={eventCategories}
                    setEditMode={_setEditMode}
                    setDeleteMode={_setDeleteMode}
                    string={string}
                    fetchEvents={_fetchCategorieswithEvents}
                    handleScroll={handleScroll}
                />
            </div>
            {/*DELETE EVENT CATEGORY MODAL */}
            <DeleteModal isLoading={Boolean(loadingMode[LOADER_TYPES.DELETE])} toggle={() => setDeleteMode('')} isOpen={Boolean(deleteMode)} onDeleteEntry={_onDeleteEntry} />

            {/*ADD/UPDATE EVENT CATEGORY MODAL */}
            <FormModal onCategorySubmit={_onEventCategorySubmit} isOpen={eventCategoryModal} toggle={_toggleEventCategory} values={values} editMode={editMode} string={string} isLoading={Boolean(loadingMode[LOADER_TYPES.UPSERT])} />

            {/* ADD/UPDATE EVENT MODAL */}
            {eventModal && (
                <AddEventModal
                    isLoading={Boolean(loadingMode[LOADER_TYPES.UPSERT])}
                    onEventSubmit={_onEventSubmit}
                    isOpen={eventModal}
                    toggle={_toggleEvent}
                    setEventformId={setEventformId}
                    selectedValue={EventformId}
                    formmodallist={formmodallist}
                    values={values}
                    editMode={selectedIndex != null ? editMode : ''}
                />
            )}
        </>
    )
}

export default EventCategory
