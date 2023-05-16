import React, { useState, useEffect, useCallback } from 'react'
import NProgress from 'nprogress'
import string from '../../../utils/LanguageTranslation.js'
import notify from '../../../lib/notifier'
import Button from '../../../components/common/form-elements/button/Button'
import { fetchOrgs } from '../../../lib/api/organization'
import {
    fetchProjectCategories,
    addProjectCategory,
    addProjectDocumentCategory,
    addProjectEventCategory,
    removeProjectEventCategory,
    removeProjectDocumentCategory,
    removeProjectParticipantCategory,
    removeProjectCategory,
    updateProjectCategory,
    addProjectParticipants,
    fetchEventDocuments,
} from '../../../lib/api/project-category'
import { fetchEventsByPDC, updateDefaultPdc, deletePdcCategory } from '../../../lib/api/pdc-category'
import { fetchEventCategoriesByPDC } from '../../../lib/api/event-category'
import { fetchDocumentCategoriesByPDC } from '../../../lib/api/document-category'
import List from './list'
import FormModal from './form'
import DeleteModal from '../../../components/common/DeleteModal'
import AddEventCategoryMapModal from '../../../components/categories/addEventCategoryMapModal'
import AddDocumentCategoryMapModal from '../../../components/categories/addDocumentCategoryMapModal'
import AddParticipantCategoryMapModal from '../../../components/categories/addParticipantCategoryMapModel'
import AddPdcCategoryModal from '../../../components/categories/pdcCategoryModal'
import { LOADER_TYPES } from '../../../shared/constants'
import { getPaginationQuery, getPaginationState } from '../../../utils/InfinitePagination'

let timeout
const ProjectCategory = ({ user, project_categories, setProject_categories, orgList, setOrgList }) => {
    const [selectedProjectCategoryId, setProjectCategoryId] = useState('')
    const [projectCategoryModal, setProjectCategoryModal] = useState(false)
    const [projectCategoryPDCModal, setProjectCategoryPDCModal] = useState(false)
    const [projectCategoryMapModal, setProjectCategoryMapModal] = useState(false)
    const [documentCategoryMapModal, setDocumentCategoryMapModal] = useState(false)
    const [participantCategoryMapModal, setParticipantCategoryMapModal] = useState(false)
    const [selectedPdcCategoryId, setPdcCategoryId] = useState(0)
    const [allEventCategories, setAllEventCategories] = useState([])
    const [allDocumentCategories, setAllDocumentCategories] = useState([])
    const [values, setValues] = useState({})
    const [categoryIndex, setCategoryIndex] = useState('')
    const [editMode, setEditMode] = useState('')
    const [deleteMode, setDeleteMode] = useState('')
    const [loadingMode, setLoadingMode] = useState({})
    const [selectedIndex, setSelectedIndex] = useState('')
    const [error, setError] = useState('')
    const [eventAssets, setEventAssets] = useState({
        documents: [],
        events: [],
    })

    const _fetchProjectCategories = async (params = {}, isJob = false) => {
        if (!isJob) NProgress.start()
        handleLoadingMode(LOADER_TYPES.PROJECT_CATEGORIES, true)
        try {
            const query = { ...params, ...project_categories }
            const response = await fetchProjectCategories(getPaginationQuery(query))
            query.response = response
            const data = getPaginationState(query)
            setProject_categories(data)
        } catch (err) {
            setError(err.message || err.toString())
        }
        if (!isJob) NProgress.done()
        handleLoadingMode(LOADER_TYPES.PROJECT_CATEGORIES, false)
    }

    // Add/Update Project Category
    const _onProjectCategorySubmit = (e) => {
        const { name } = values
        if (editMode === 'projectCategory') {
            _updateProjectCategory()
        } else {
            _addProjectCategory(name)
            setValues("")
        }
    }

    // add project category function
    const _addProjectCategory = async (data) => {
        NProgress.start()
        handleLoadingMode(LOADER_TYPES.UPSERT, true)
        try {
            await addProjectCategory(values)
            await _fetchProjectCategories({ page: 0 })
            setValues({})
            _toggleProjectCategory({})
            notify(string.category.categoryAddSuccess)
        } catch (err) {
            notify(string.category.errorAddCategory)
        }
        NProgress.done()
        handleLoadingMode(LOADER_TYPES.UPSERT, false)
    }

    // update project category function
    const _updateProjectCategory = async () => {
        NProgress.start()
        handleLoadingMode(LOADER_TYPES.UPSERT, true)
        try {
            await updateProjectCategory(values)
            await _fetchProjectCategories({ isFetchAll: true })
            setValues({})
            _toggleProjectCategory({})
            notify(string.category.categoryUpdate)
        } catch (err) {
            notify(string.category.errorAddCategory)
        }
        NProgress.done()
        handleLoadingMode(LOADER_TYPES.UPSERT, false)
    }

    // Add Project Event Category
    const _addProjectEventCategory = async () => {
        NProgress.start()
        handleLoadingMode(LOADER_TYPES.UPSERT, true)
        try {
            const categoryData = values
            const projectCategories = project_categories.list
            categoryData.project_category_id = projectCategories[categoryIndex].id
            const categoryObj = await addProjectEventCategory(categoryData)
            if (categoryObj.code == 1) {
                await _fetchProjectCategories({ isFetchAll: true })
                setValues({})
                _toggleProjectCategoryMap({})
                notify(string.category.categoryAddSuccess)
            } else if (categoryObj.message == 'alrdyexisting') {
                notify(string.apiResponses.categoryExists)
            } else {
                notify(categoryObj.message)
            }
        } catch (err) {
            notify(string.category.errorAddCategory)
        }
        NProgress.done()
        handleLoadingMode(LOADER_TYPES.UPSERT, false)
    }

    const _toggleDocumentCategoryMap = (e, cat) => {
        setDocumentCategoryMapModal(!documentCategoryMapModal)
    }

    const _onDocumentCategoryMapSubmit = (e) => {
        const { value } = values
        _addProjectDocumentCategory(value)
        setValues("")
    }

    const _addProjectDocumentCategory = async () => {
        NProgress.start()
        handleLoadingMode(LOADER_TYPES.UPSERT, true)
        try {
            const categoryData = values
            const projectCategories = project_categories.list
            categoryData.project_category_id = projectCategories[categoryIndex].id
            const categoryObj = await addProjectDocumentCategory(values)
            if (categoryObj.code == 1) {
                await _fetchProjectCategories({ isFetchAll: true })
                setValues({})
                _toggleDocumentCategoryMap({})
                notify(string.category.categoryAddSuccess)
            } else if (categoryObj.message == 'alrdyexisting') {
                notify(string.apiResponses.categoryExists)
            } else {
                notify(categoryObj.message)
            }
        } catch (err) {
            notify(string.category.errorAddCategory)
        }
        NProgress.done()
        handleLoadingMode(LOADER_TYPES.UPSERT, false)
    }

    const _toggleParticipantCategoryMap = (e, cat) => {
        setParticipantCategoryMapModal(!participantCategoryMapModal)
    }

    const _onParticipantCategoryMapSubmit = (e) => {
        const { value } = values
        _addProjectParticipantCategory(value)
        setValues("")
    }

    const _addProjectParticipantCategory = async (values) => {
        NProgress.start()
        handleLoadingMode(LOADER_TYPES.UPSERT, true)
        try {
            const categoryData = {}
            const projectCategories = project_categories.list
            categoryData.value = values
            categoryData.project_category_id = projectCategories[categoryIndex].id
            const categoryObj = await addProjectParticipants(categoryData)
            if (categoryObj.code == 1) {
                await _fetchProjectCategories({ isFetchAll: true })
                setValues({})
                _toggleParticipantCategoryMap({})
                notify(string.category.categoryAddSuccess)
            } else {
                notify(categoryObj.message)
            }
        } catch (err) {
            notify(err.message || err.toString())
        }
        handleLoadingMode(LOADER_TYPES.UPSERT, false)
        NProgress.done()
    }

    // Map event category with project category
    const _onProjectCategoryMapSubmit = (e) => {
        console.log("aya")
        const { value } = values
        _addProjectEventCategory(value)
        setValues("")
    }

    const setEventsDocuments = async (id) => {
        const eventdocuments = await fetchEventDocuments(id)
        const documents = [].concat.apply(
            [],
            eventdocuments?.project_document_categories.map((eventCategory) => eventCategory?.document_category?.events),
        )
        const events = [].concat.apply(
            [],
            eventdocuments?.project_event_categories.map((eventCategory) => eventCategory?.event_category?.events),
        )

        setEventAssets({ events, documents })
    }

    const _handleSelectedProjectCategory = async (id, pdcId = '') => {
        setProjectCategoryId(typeof id === 'number' ? id : '')
        await fetchEventsByPDC(pdcId)
        await setEventsDocuments(id)
        setPdcCategoryId(pdcId)
    }

    const ToggleProjectCategoryModal = () => {
        setEventAssets({ events: [], documents: [] })
        setProjectCategoryId('')
        setPdcCategoryId('')
    }

    const onSelectProjectCategoryPDC = async (id) => {
        await setEventsDocuments(id)
        setProjectCategoryId(id)
        _toggleProjectCategoryPDCModal()
    }

    const _toggleProjectCategoryPDCModal = () => {
        setProjectCategoryPDCModal(!projectCategoryPDCModal)
    }

    const _toggleProjectCategory = (e, cat) => {
        setProjectCategoryModal(!projectCategoryModal)
    }

    const _toggleProjectCategoryMap = (e, cat) => {
        setProjectCategoryMapModal(!projectCategoryMapModal)
    }

    const onUpdateDefaultPdcClick = async (data) => {
        try {
            handleLoadingMode(LOADER_TYPES.UPSERT, true)
            await updateDefaultPdc(data)
            handleLoadingMode(LOADER_TYPES.UPSERT, false)
            await _fetchProjectCategories({ isFetchAll: true })
            notify(string.event.defaultPDCUpdated)
        } catch (error) {
            console.log(error)
            handleLoadingMode(LOADER_TYPES.UPSERT, false)
            notify(string.event.defaultPDCUpdateFail)
        }
    }

    const _handleSubmitBtnClick = () => {
        _toggleProjectCategory()
        setEditMode('')
        setValues({})
    }

    const _setEditMode = (mode, i, j, cat) => {
        if (mode) {
            setValues({ ...cat })
            setCategoryIndex(i)
            if (mode == 'projectCategory') {
                setEditMode(mode)
                _toggleProjectCategory(cat)
            } else if (mode == 'eventCategoryMap') {
                setEditMode(mode)
                _toggleProjectCategoryMap(cat)
            } else if (mode == 'documentCategoryMap') {
                setEditMode(mode)
                _toggleDocumentCategoryMap(cat)
            } else if (mode == 'participantCategoryMap') {
                setEditMode(mode)
                _toggleParticipantCategoryMap(cat)
            }
        }
    }

    // set delete mode upon selecting delete icon
    const _setDeleteMode = async (mode, i, cat, data = {}) => {
        if (mode == 'projectCategory') {
            setDeleteMode(mode)
            setSelectedIndex(i)
        } else if (mode == 'eventCategoryMap') {
            setDeleteMode(mode)
            setSelectedIndex(i)
            setCategoryIndex(cat)
        } else if (mode == 'documentCategoryMap') {
            setDeleteMode(mode)
            setSelectedIndex(i)
            setCategoryIndex(cat)
        } else if (mode == 'participantCategoryMap') {
            setDeleteMode(mode)
            setSelectedIndex(i)
            setCategoryIndex(cat)
        } else if (mode == 'pdcCategory') {
            setDeleteMode(mode)
            setSelectedIndex(i)
            setCategoryIndex(cat)
        }
    }

    // Function to delete entry from popup
    const _onDeleteEntry = async (e) => {
        e.preventDefault()
        handleLoadingMode(LOADER_TYPES.DELETE, true)
        try {
            // check which category to delete
            if (deleteMode == 'projectCategory') {
                // delete project category data
                const category = project_categories.list[selectedIndex]
                const response = await removeProjectCategory({ id: category.id })
                if (response.isDeleted) {
                    await _fetchProjectCategories({ isFetchAll: true })
                    notify(string.category.categoryDelSuccess)
                } else {
                    const projects = response.project.map((projectData) => `<li>${projectData?.name}${projectData?.isDraft ? ' (Draft)' : ''}</li>`)
                    notify({
                        message: `${dynamicLanguageStringChange(string.category.alreadyInUse, { category: string.project.projectCategory, module: string.projects })}<ol style="text-align: left">${projects.join('')}</ol>`,
                    })
                }
                setDeleteMode('')
            } else if (deleteMode == 'eventCategoryMap') {
                // delete project category data
                const projectCategories = project_categories.list
                const selectCategory = projectCategories[categoryIndex]
                const categoryData = selectCategory.project_event_categories
                await removeProjectEventCategory({
                    id: categoryData[selectedIndex].id,
                })
                await _fetchProjectCategories({ isFetchAll: true })
                setDeleteMode('')
                notify(string.category.categoryDelSuccess)
            } else if (deleteMode == 'documentCategoryMap') {
                // delete project category data
                const projectCategories = project_categories.list
                const selectCategory = projectCategories[categoryIndex]
                const categoryData = selectCategory.project_document_categories
                await removeProjectDocumentCategory({
                    id: categoryData[selectedIndex].id,
                })
                await _fetchProjectCategories({ isFetchAll: true })
                setDeleteMode('')
                notify(string.category.categoryDelSuccess)
            } else if (deleteMode == 'participantCategoryMap') {
                // delete project category data
                const projectCategories = project_categories.list
                const selectCategory = projectCategories[categoryIndex]
                const categoryData = selectCategory.project_participant_categories
                await removeProjectParticipantCategory({
                    id: categoryData[selectedIndex].id,
                    project_category_id: categoryData[selectedIndex].project_category_id,
                    participant_category_id: categoryData[selectedIndex].participant_category_id,
                })
                await _fetchProjectCategories({ isFetchAll: true })
                setDeleteMode('')
                notify(string.category.categoryDelSuccess)
            } else if (deleteMode == 'pdcCategory') {
                // delete pdc category data
                const projectCategories = project_categories.list.slice()
                const selectCategory = projectCategories[categoryIndex]
                const categoryData = selectCategory.project_pdc_categories
                await deletePdcCategory(categoryData[selectedIndex].id)
                await _fetchProjectCategories({ isFetchAll: true })
                setDeleteMode('')
                notify(string.pdcCategory.pdcDeleteSuccess)
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
                const { list, totalCount, pageNumber } = project_categories
                if (list.length < totalCount) {
                    const params = { page: pageNumber + 1 }
                    _fetchProjectCategories(params)
                }
            }, 300)
        }
    }, [project_categories])

    const handleLoadingMode = (type, isFetching) => {
        setLoadingMode((prevState) => {
            return { ...prevState, [type]: isFetching }
        })
    }

    const _fetchOrganizationList = async (isJob = false) => {
        if (!isJob) NProgress.start()
        const orgs = await fetchOrgs()
        setOrgList(orgs)
        if (!isJob) NProgress.done()
    }

    const fetchAllData = (isJob = false) => {
        _fetchOrganizationList(isJob)
        _fetchProjectCategories(isJob ? { isFetchAll: true } : {}, isJob)
    }

    const fetchEventsAndCategories = async () => {
        try {
            const body = {
                project_category_id: selectedProjectCategoryId,
            }
            const eventCategories = await fetchEventCategoriesByPDC(body)
            const docCategories = await fetchDocumentCategoriesByPDC(body)
            const eventCategoriesList = eventCategories.map((event) => event.event_category)
            const documentCategoriesList = docCategories.map((doc) => doc.document_category)
            setAllEventCategories(eventCategoriesList)
            setAllDocumentCategories(documentCategoriesList)
        } catch (err) {
            console.log('error --> ', err)
        }
    }

    useEffect(() => {
        if (selectedProjectCategoryId) {
            fetchEventsAndCategories()
        }
    }, [selectedProjectCategoryId])

    useEffect(() => {
        if (!project_categories.list.length) {
            fetchAllData()
        }

        return () => {
            if (timeout) clearTimeout(timeout)
        }
    }, [])

    return (
        <>
            <div className='tab-pane show active mt-3 w-100' id='projectCategory' role='tabpanel' aria-labelledby='project-listing'>
                <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                    <h4 className='text-dark'>{string.projectCatTitle}</h4>
                    <Button className='btn btn-primary large-btn' onClick={_handleSubmitBtnClick}>
                        {string.submitCatBtn}
                    </Button>
                </div>

                <List
                    onUpdateDefaultPdcClick={onUpdateDefaultPdcClick}
                    pdcEvents={[]}
                    project_categories={project_categories}
                    _toggleProjectCategoryPDCModal={_toggleProjectCategoryPDCModal}
                    onSelectProjectCategoryPDC={onSelectProjectCategoryPDC}
                    setEditMode={_setEditMode}
                    setDeleteMode={_setDeleteMode}
                    string={string}
                    onSelectProjectCategory={_handleSelectedProjectCategory}
                    isLoading={Boolean(loadingMode[LOADER_TYPES.PROJECT_CATEGORIES])}
                    fetchProjectCategories={_fetchProjectCategories}
                    handleScroll={handleScroll}
                />
            </div>

            {/* DELTE PROJECT CATEGORY MODAL */}
            <DeleteModal isLoading={Boolean(loadingMode[LOADER_TYPES.DELETE])} toggle={() => setDeleteMode('')} isOpen={Boolean(deleteMode)} onDeleteEntry={_onDeleteEntry} />

            {/*ADD/UPDATE PROJECT CATEGORY MODAL */}
            <FormModal onCategorySubmit={_onProjectCategorySubmit} isOpen={projectCategoryModal} toggle={_toggleProjectCategory} values={values} string={string} editMode={editMode} isLoading={Boolean(loadingMode[LOADER_TYPES.UPSERT])} />

            {/*ADD/UPDATE PROJECT EVENT CATEGORY MODAL */}
            <AddEventCategoryMapModal isLoading={Boolean(loadingMode[LOADER_TYPES.UPSERT])} setValues={setValues} onCategorySubmit={_onProjectCategoryMapSubmit} isOpen={projectCategoryMapModal} toggle={_toggleProjectCategoryMap} values={values} editMode={editMode} string={string} />

            {/*ADD/UPDATE PROJECT DOCUMENT CATEGORY MODAL */}
            <AddDocumentCategoryMapModal isLoading={Boolean(loadingMode[LOADER_TYPES.UPSERT])} setValues={setValues} onCategorySubmit={_onDocumentCategoryMapSubmit} isOpen={documentCategoryMapModal} toggle={_toggleDocumentCategoryMap} values={values} editMode={editMode} string={string} />

            {/*ADD/UPDATE PROJECT PARTICIPANT CATEGORY MODAL */}
            <AddParticipantCategoryMapModal
                isLoading={Boolean(loadingMode[LOADER_TYPES.UPSERT])}
                setValues={setValues}
                onCategorySubmit={_onParticipantCategoryMapSubmit}
                isOpen={participantCategoryMapModal}
                toggle={_toggleParticipantCategoryMap}
                values={values}
                editMode={editMode}
                string={string}
            />

            {/*ADD/UPDATE PROJECT PDC CATEGORY MODAL */}
            {Boolean(selectedProjectCategoryId) && (
                <AddPdcCategoryModal
                    isLoading={Boolean(loadingMode[LOADER_TYPES.UPSERT])}
                    isOpen={selectedProjectCategoryId}
                    closeToggle={ToggleProjectCategoryModal}
                    selectedPdcId={selectedPdcCategoryId}
                    onSelectProjectCategory={_handleSelectedProjectCategory}
                    projectCategory={project_categories.list.find((cat) => cat.id === parseInt(selectedProjectCategoryId))}
                    event_categories={allEventCategories}
                    document_categories={allDocumentCategories}
                    eventAssets={eventAssets}
                    user={user}
                    allOrgs={orgList}
                    onfetchProjectCategories={_fetchProjectCategories}
                />
            )}
        </>
    )
}

export default ProjectCategory
