import React, { useState, useEffect, useCallback } from 'react'
import NProgress from 'nprogress'
import string from '../../../utils/LanguageTranslation.js'
import notify from '../../../lib/notifier'
import ShortUniqueId from 'short-unique-id'
import { dynamicLanguageStringChange, sanitize } from '../../../utils/globalFunc'
import Button from '../../../components/common/form-elements/button/Button'
import { useCookies } from 'react-cookie'
import { LOADER_TYPES } from '../../../shared/constants'
import { getPaginationQuery, getPaginationState } from '../../../utils/InfinitePagination'
import { fetchOrgs } from '../../../lib/api/organization'
import { fetchFormListByUserIdRequest } from '../../../lib/api/formBuilder'
import List from './list'
import DeleteModal from '../../../components/common/DeleteModal'
import FormModal from './form'
import AddDocTypeModal from '../../../components/categories/addTypeModal'
import { addDocumentCategory, updateDocumentCategory, removeDocumentCategory, fetchDocumentCategorieswithEvents } from '../../../lib/api/document-category'
import { addEvent, deleteEvent, updateEvent } from '../../../lib/api/event'
import { checkIntegrity } from '../../../lib/api/integrity'
import { integrityWrapper } from '../../../utils/integrityHelpers'

const randomCode = new ShortUniqueId({ length: 8 })
const INITIAL_LOAD_TIME = 10000 //This is used to load events after any event
let timeout
const DocumentCategory = ({ user, formmodallist, setformmodallist, orgList, setOrgList, document_categories, setDocument_categories }) => {
    const [documentCategoryModal, setDocumentCategoryModal] = useState(false)
    const [docEventModal, setDocEventModal] = useState(false)

    const [values, setValues] = useState({})
    const [EventformId, setEventformId] = useState({ value: 0 })
    const [categoryIndex, setCategoryIndex] = useState('')
    const [cookies, _] = useCookies(['authToken'])

    const [editMode, setEditMode] = useState('')
    const [deleteMode, setDeleteMode] = useState('')
    const [loadingMode, setLoadingMode] = useState({})
    const [selectedIndex, setSelectedIndex] = useState('')
    const [selectedData, setSelectedData] = useState({})
    const [error, setError] = useState('')

    const [activeIntegerity, SetActiveIntegerity] = useState(null)
    const [reRender, setRerender] = useState(null)

    const _fetchDocumentCategories = async (params = {}, isJob = false) => {
        if (!isJob) NProgress.start()
        handleLoadingMode(LOADER_TYPES.DOCUMENT_CATEGORIES, true)
        try {
            const query = { ...params, ...document_categories }
            const response = await fetchDocumentCategorieswithEvents(getPaginationQuery(query))
            query.response = response
            const data = getPaginationState(query)
            setDocument_categories(data)
        } catch (err) {
            setError(err.message || err.toString())
        }
        if (!isJob) NProgress.done()
        handleLoadingMode(LOADER_TYPES.DOCUMENT_CATEGORIES, false)
    }

    // Add/Update Document Category
    const _onDocumentCategorySubmit = (e) => {
        if (editMode === 'documentCategory') {
            _updateDocumentCategory()
        } else {
            _addDocumentCategory()
            setValues('')
        }
    }

    const _onDocEventSubmit = (e) => {
        setValues({ ...e })
        if (editMode === 'd_event' && selectedIndex != null) {
            _updateDocEvent()
        } else {
            addDocEvent()
            setValues('')
        }
    }

    // add document category function
    const _addDocumentCategory = async () => {
        NProgress.start()
        handleLoadingMode(LOADER_TYPES.UPSERT, true)
        try {
            await addDocumentCategory(values)
            await _fetchDocumentCategories({ page: 0 })
            setValues({})
            _toggleDocumentCategory({})
            notify(string.category.categoryAddSuccess)
        } catch (err) {
            notify(string.category.errorAddCategory)
        }
        NProgress.done()
        handleLoadingMode(LOADER_TYPES.UPSERT, false)
    }

    // update document category function
    const _updateDocumentCategory = async () => {
        NProgress.start()
        handleLoadingMode(LOADER_TYPES.UPSERT, true)
        try {
            await updateDocumentCategory(values)
            _fetchDocumentCategories({ isFetchAll: true })
            setValues({})
            _toggleDocumentCategory({})
            notify(string.category.categoryUpdate)
        } catch (err) {
            notify(string.category.errorAddCategory)
        }
        NProgress.done()
        handleLoadingMode(LOADER_TYPES.UPSERT, false)
    }

    // add document event function
    const addDocEvent = async () => {
        NProgress.start()
        try {
            handleLoadingMode(LOADER_TYPES.UPSERT, true)
            const eventData = values
            eventData.type = 'document'
            const documentCategories = document_categories.list
            eventData.event_category_id = documentCategories[categoryIndex].id
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
                    eventType: 'document',
                    projectIds: [],
                    usersCanSubmit: [],
                    usersCanAccept: [],
                },
            }

            const addEventresponse = await addEvent(eventPayload, cookies.authToken)
            if (addEventresponse.success) {
                setTimeout(async () => {
                    await _fetchDocumentCategories({ isFetchAll: true })
                }, INITIAL_LOAD_TIME)
                setValues({})
                _toggleDocEvent({})
                notify(string.documentAddSuccess)
                handleLoadingMode(LOADER_TYPES.UPSERT, false)
                NProgress.done()
            }
        } catch (err) {
            handleLoadingMode(LOADER_TYPES.UPSERT, false)
            notify(string.eventAddingErr)
            NProgress.done()
        }
    }

    // update doc event function
    const _updateDocEvent = async () => {
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
                    eventType: 'document',
                    projectIds: [],
                    usersCanSubmit: [],
                    usersCanAccept: [],
                },
            }

            const updateResponse = await updateEvent(eventPayload, cookies.authToken)
            if (updateResponse.success) {
                setTimeout(async () => {
                    await _fetchDocumentCategories({ isFetchAll: true })
                }, INITIAL_LOAD_TIME)
                setValues({})
                _toggleDocEvent({})
                handleLoadingMode(LOADER_TYPES.UPSERT, false)
                notify(string.documentUpdateSuccessNot)
                NProgress.done()
            }
        } catch (err) {
            handleLoadingMode(LOADER_TYPES.UPSERT, false)
            notify(string.eventUpdateErrNot)
            NProgress.done()
        }
    }

    const _toggleDocEvent = (e, cat) => {
        setDocEventModal(!docEventModal)
    }

    const _toggleDocumentCategory = (e, cat) => {
        setDocumentCategoryModal(!documentCategoryModal)
    }

    // set delete mode upon selecting delete icon
    const _setDeleteMode = async (mode, i, cat, data = {}) => {
        if (mode == 'documentCategory') {
            setDeleteMode(mode)
            setSelectedIndex(i)
        } else if (mode == 'd_event') {
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
            if (deleteMode == 'd_event') {
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
                    await _fetchDocumentCategories({ isFetchAll: true })
                }, INITIAL_LOAD_TIME)
                setDeleteMode('')
                setSelectedData({})
                notify(string.category.documentDelSuccess)
            } else if (deleteMode == 'documentCategory') {
                // delete document category data
                const category = document_categories.list[selectedIndex]
                const response = await removeDocumentCategory({ id: category.id })
                if (response.isDeleted) {
                    _fetchDocumentCategories({ isFetchAll: true })
                    notify(string.category.categoryDelSuccess)
                } else {
                    const documents = response.document.map((documenttData) => `<li>${documenttData?.project_category?.name}</li>`)
                    notify({
                        message: `${dynamicLanguageStringChange(string.category.alreadyInUse, { category: string.project.documentCategory, module: `${string.projectSmallTxt} ${string.categories}` })}<ol style="text-align: left">${documents.join('')}</ol>`,
                    })
                }
                setDeleteMode('')
            }
        } catch (err) {
            console.log(err)
        }
        handleLoadingMode(LOADER_TYPES.DELETE, false)
    }

    const _setEditMode = (mode, i, j, cat) => {
        if (mode) {
            setValues({ ...cat })
            setCategoryIndex(i)
            setEventformId('')
            if (mode == 'documentCategory') {
                setEditMode(mode)
                _toggleDocumentCategory(cat)
            } else if (mode == 'd_event') {
                if (j != null) {
                    setEditMode(mode)
                    setSelectedIndex(j)
                    const val = formmodallist.filter((item) => item.value === cat.form_id)
                    if (val.length > 0) {
                        setEventformId(val[0])
                    }
                    _toggleDocEvent()
                } else {
                    setEditMode('')
                    _toggleDocEvent({})
                }
            }
        }
    }

    const _handleSubmitBtnClick = () => {
        _toggleDocumentCategory()
        setEditMode('')
        setValues({})
    }

    // const handleIntegrity = async (category) => {
    //     SetActiveIntegerity(category)
    //     setTimeout(() => {
    //         SetActiveIntegerity(null)
    //     }, 2000)
    // }

    const handleIntegrity = async (category, event) => {
        SetActiveIntegerity(event)
        const response = await checkIntegrity({ type: 'event', uniqId: event.uniqId })
        if (response.data) {
            const activeCategoryIndex = document_categories.list.findIndex(({ id }) => id === category.id)
            let activeEvents = document_categories.list[activeCategoryIndex].events
            const updatedEvents = await integrityWrapper(response.data, activeEvents)
            activeEvents = updatedEvents
            setDocument_categories(document_categories)
            setRerender(Math.random())
        }
        SetActiveIntegerity(null)
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

    const handleScroll = useCallback(() => {
        if (window.innerHeight + Math.ceil(document.documentElement.scrollTop) >= document.documentElement.offsetHeight - 100) {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
                const { list, totalCount, pageNumber } = document_categories
                if (list.length < totalCount) {
                    const params = { page: pageNumber + 1 }
                    _fetchDocumentCategories(params)
                }
            }, 300)
        }
    }, [document_categories])

    const fetchAllData = (isJob = false) => {
        _fetchformlist()
        _fetchOrganizationList(isJob)
        _fetchDocumentCategories(isJob ? { isFetchAll: true } : {}, isJob)
    }

    useEffect(() => {
        if (!document_categories.list.length) {
            fetchAllData()
        }

        return () => {
            if (timeout) clearTimeout(timeout)
        }
    }, [])

    return (
        <>
            <div className='tab-pane active mt-3 w-100' id='documentCategory' role='tabpanel' aria-labelledby='document-listing'>
                <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                    <h4 className='text-dark'>{string.docCatTitle}</h4>
                    <Button className='btn btn-primary large-btn' onClick={_handleSubmitBtnClick}>
                        {string.submitCatBtn}
                    </Button>
                </div>

                <List
                    handleIntegrity={(value, event) => handleIntegrity(value, event)}
                    activeIntegerity={activeIntegerity}
                    isLoading={Boolean(loadingMode[LOADER_TYPES.DOCUMENT_CATEGORIES])}
                    subEvents={[]}
                    document_categories={document_categories}
                    setEditMode={_setEditMode}
                    setDeleteMode={_setDeleteMode}
                    string={string}
                    fetchDocuments={_fetchDocumentCategories}
                    handleScroll={handleScroll}
                />
            </div>

            {/*DELETE DOCUMENT CATEGORY MODAL */}
            <DeleteModal isLoading={Boolean(loadingMode[LOADER_TYPES.DELETE])} toggle={() => setDeleteMode('')} isOpen={Boolean(deleteMode)} onDeleteEntry={_onDeleteEntry} />

            {/*ADD/UPDATE DOCUMENT CATEGORY MODAL */}
            <FormModal onCategorySubmit={_onDocumentCategorySubmit} isOpen={documentCategoryModal} toggle={_toggleDocumentCategory} values={values} editMode={editMode} string={string} isLoading={Boolean(loadingMode[LOADER_TYPES.UPSERT])} />

            {/** ADD/UPDATE DOCUMENT MODAL * */}
            {Boolean(docEventModal) && (
                <AddDocTypeModal
                    isLoading={Boolean(loadingMode[LOADER_TYPES.UPSERT])}
                    onEventSubmit={_onDocEventSubmit}
                    isOpen={Boolean(docEventModal)}
                    toggle={_toggleDocEvent}
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

export default DocumentCategory
