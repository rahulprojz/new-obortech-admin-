import React, { useCallback, useEffect, useReducer } from 'react'
import { connect, useDispatch, useSelector } from 'react-redux'
import NProgress from 'nprogress'
import ShortUniqueId from 'short-unique-id'
import { useCookies } from 'react-cookie'
import { INITIAL_PAGINATION_STATE, LISTING_PAGE_TAB } from '../../../shared/constants'
import { getLocalTime, sanitize } from '../../../utils/globalFunc'
import { removeProjectFromMenuList, fetchSideBarMenuLists } from '../../../redux/actions/sidebarActions'
import { resetCustomLabels } from '../../../redux/actions/customLabelAction'
import { isEditDeleteBtnAllowed, getModalClass, SELECTED_TAB_DETAILS, getShipMentStatusTitle, getProjectStatusClass, handleFetchListData } from '../../../components/projects/utils'
import string from '../../../utils/LanguageTranslation.js'
import notify from '../../../lib/notifier'
import { addProject, fetchProjectOnly, removetemplate, removeProject, restoreProject, updateProject, completeProject, stopTracking } from '../../../lib/api/project'
import { allowEventSubmission } from '../../../lib/api/project-event'
import { fetchDocumentCategories } from '../../../lib/api/document-category'
import { fetchParticipantCategories } from '../../../lib/api/participant-category'
import { fetchUsers } from '../../../lib/api/user'
import { fetchStations } from '../../../lib/api/station'
import { fetchCategoryParticipants } from '../../../lib/api/organization'
import { getAccess } from '../../../lib/api/network-api'
import { createGlobalPDC, updatePdc } from '../../../lib/api/pdc-api'
import List from './List'
import NoDataView from '../../../components/common/NoDataView'
import { getOrgs } from '../../../redux/selectors/organizationSelector'
import Modals from '../modals'
import IntegrityIcon from '../../../components/common/IntegirityIcon'
import ActionButton from '../../../components/common/ActionButton'
import { checkIntegrity } from '../../../lib/api/integrity'
import { integrityWrapper } from '../../../utils/integrityHelpers'

const Listing = (props) => {
    const [state, setState] = useReducer((prevState, newState) => ({ ...prevState, ...newState }), {
        user: props.user || {},
        projects: INITIAL_PAGINATION_STATE,
        project: {
            selections: [],
            selectedRoads: [],
            projecttempratures: [],
        },
        showdraftmodal: 0,
        document_categories: [],
        participant_categories: [],
        participants: [],
        stations: [],
        organizations: [],
        selectedOrganization: '',
        deleteMode: '',
        restoreMode: '',
        selectedIndex: '',
        currentStep: 0,
        isEdit: false,
        isActive: false,
        deleteOpen: false,
        restoreOpen: false,
        toggleOpen: false,
        completeOpen: false,
        istemplateselected: false,
        selectedOrg: [],
        allProjects: [],
        isLoading: false,
        checkprojectdata: 'updateprojectdata',
        isDeleting: false,
        isRestore: false,
        isSavingDraft: false,
        isLoadingMode: false,
        selectedTab: props.selectedTab,
        selectedTabDetails: SELECTED_TAB_DETAILS[props.selectedTab],
        completed: false,
        activeIntegerity: null,
        sort: '',
    })
    const [cookies, _] = useCookies(['authToken'])
    const dispatch = useDispatch()
    const orgList = useSelector(getOrgs)
    const randomCode = new ShortUniqueId({ dictionary: 'alpha_lower', length: 8 })
    let timeout

    const saveprojectData = async () => {
        setState({ istemplateselected: false, isLoading: true, isSavingDraft: true })
        if (state.checkprojectdata == 'updateprojectdata') {
            setState({ isEdit: true, isDraft: 0 })
        } else if (state.checkprojectdata == 'saveprojectdata') {
            setState({ isEdit: false, isDraft: 0 })
        }
        saveProject(state.project, true)
    }

    /* Check project value */
    const handleProjectChange = (e) => {
        setState({ checkprojectdata: e.target.value })
    }

    const getUserOrgName = ({ organization_id }) => {
        const selectedOrg = orgList.find(({ id }) => id === organization_id)
        return sanitize(selectedOrg?.blockchain_name)
    }

    const saveProject = async (project, draftClick, setSubmitBtnDisable = () => {}) => {
        NProgress.start()
        if (state.istemplateselected === true && project.isDraft === 1) {
            setState({ showdraftmodal: 1, isLoading: false })
        } else {
            try {
                const orgList = await fetchCategoryParticipants({ catIds: [project?.project_category_id] })
                const pdcName = `${sanitize(project.name)}${randomCode()}`

                const filteredOrgs = []
                orgList.map((org) => {
                    const orgName = sanitize(org.blockchain_name)
                    filteredOrgs.push(orgName === process.env.HOST_ORG ? process.env.HOST_MSP : orgName)
                })

                // Check if there are any orgs in the selected project category, go back to first step
                if (filteredOrgs.length <= 0) {
                    throw string.project.projectBlankParticipant
                }

                const pdcData = {
                    pdcName,
                    orgName: process.env.HOST_ORG,
                    peerId: process.env.PEER_ID,
                    chaincode: process.env.CHAINCODE_NAME,
                    memberOrgs: filteredOrgs,
                }

                // Show error message to user if there are no participants,
                // it will not create PDC and event submission will not work in this case
                if (!filteredOrgs.length) {
                    NProgress.done()
                    setState({ isLoading: false })
                    notify(`${string.project.noParticipantsInCategory}`)
                    return false
                }
                const body = { ...project, pdcName, members: pdcData.memberOrgs }

                if (state.isEdit) {
                    if (!!project.project_category_id && project.pdc_name) {
                        body.pdcName = project.pdc_name
                        // const result = await updatePdc(pdcData, 1, cookies.authToken)
                        // if (result.success) {
                        await updateProject(body)
                        await stopTracking({ id: project.id })
                        window.localStorage.removeItem(`${project.id}_selection`)
                        // } else {
                        //     throw string.event.createUpdatePdcError
                        // }
                    }
                    const { projects, allProjects } = await _fetchMasters({ isFetchAll: true })
                    setState({ projects, allProjects })
                } else {
                    await addProject(body)
                    const { projects, allProjects } = await _fetchMasters({ page: 0 })
                    setState({ projects, allProjects })
                }
                dispatch(fetchSideBarMenuLists())
                window.localStorage.removeItem('project_selections')
                let notifyMsg = string.project.projectReqInProgress
                if (draftClick) {
                    notifyMsg = string.project.projectTemplateSaved
                } else if (state.isEdit) {
                    notifyMsg = state.selectedTabDetails.editSuccessText
                }

                notify(`${notifyMsg}`)

                // Close modal and reset the states
                setState({
                    currentStep: 0,
                    isEdit: false,
                    project: {},
                    showdraftmodal: 0,
                    isLoading: false,
                    istemplateselected: false,
                    isSavingDraft: false,
                })
            } catch (err) {
                notify(err.message || err.toString())
                setSubmitBtnDisable(false)
            } finally {
                NProgress.done()
            }
        }
    }

    const onCompleteProject = async (event) => {
        NProgress.start()
        event.preventDefault()
        setState({ isLoading: true })
        const { selectedIndex, projects, user } = state
        // delete project data
        const projects_data = projects.list[selectedIndex]
        const eventPayload = {
            orgName: getUserOrgName(user),
            userName: user?.unique_id,
            pdc: projects_data.pdc_name,
            eventName: `EVENT_${process.env.projectFinishedEventId}` || `EVENT_${projects_data.id}`,
            users: [user?.unique_id],
            orgs: [getUserOrgName(user) === process.env.HOST_ORG ? process.env.HOST_MSP : getUserOrgName(user)],
        }
        try {
            const isEventSubmissionAllowed = await allowEventSubmission({ ...eventPayload })
            const isAddEventAllowed = JSON.parse(isEventSubmissionAllowed.data)
            if (!isAddEventAllowed.success) {
                throw isAddEventAllowed.message
            }
            await completeProject({ id: projects_data.id, user_id: user.id, role_id: user.role_id, organization_id: user.organization_id })
            await stopTracking({ id: projects_data.id })
            const { projects: latestProjects, allProjects } = await _fetchMasters({ page: 0 })
            NProgress.done()
            notify(`${string.project.projectCompletedSuccessfully}`)
            setState({ completeOpen: false, isLoading: false, projects: latestProjects, allProjects, completed: true })
        } catch (err) {
            notify(string.eventAddingErr)
            setState({ completeOpen: false, isLoading: false })
            console.error('Error while complete project => ', err)
            NProgress.done()
        }
    }

    // this function is used to save project data into project state from modal which can be use to pass into another model
    const setProjectData = (project) => {
        if (project) {
            setState({ project })
        }
    }

    // Function to delete entry from popup
    const onDeleteEntry = async (event) => {
        NProgress.start()
        event.preventDefault()
        setState({ isDeleting: true })
        const { deleteMode, selectedIndex } = state
        if (deleteMode == 'project') {
            const projects_data = state.projects.list[selectedIndex]
            await removeProject({ id: projects_data.id })
            props.removeProjectFromMenuList(projects_data.id)
            props.fetchSideBarMenuLists()
            const { projects, allProjects } = await _fetchMasters({ isFetchAll: true })
            setState({ deleteOpen: false, isDeleting: false, projects, allProjects })
            NProgress.done()
            notify(`${state.selectedTabDetails.archiveSucessText}`)
        } else if (deleteMode == 'template') {
            const projects_data = state.projects.list[selectedIndex]
            await removetemplate({ id: projects_data.id })
            const { projects, allProjects } = await _fetchMasters({ isFetchAll: true })
            setState({ deleteOpen: false, isDeleting: false, projects, allProjects })
            NProgress.done()
            notify(`${state.selectedTabDetails.deleteSucessText}`)
        }
    }

    const editMode = (i) => {
        const { projects } = state
        const project = projects.list[i]
        window.localStorage.setItem('project_selections', JSON.stringify({}))
        setState({ project, isEdit: true })
        _toggleStep(1)
    }

    const onRestoreEntry = async (event) => {
        NProgress.start()
        event.preventDefault()
        setState({ isRestore: true })
        const { restoreMode, selectedIndex } = state
        if (restoreMode == 'project') {
            const projects_data = state.projects.list[selectedIndex]
            await restoreProject({ id: projects_data.id })
            props.fetchSideBarMenuLists()
            const { projects, allProjects } = await _fetchMasters({ isFetchAll: true })
            setState({ restoreOpen: false, isRestore: false, projects, allProjects })
            NProgress.done()
            notify(`${state.selectedTabDetails.restoreSucessText}`)
        }
    }

    // set delete mode upon selecting delete icon
    const setDeleteMode = (mode, i) => {
        if (mode) {
            setState({ deleteMode: mode, selectedIndex: i, deleteOpen: true })
        }
    }
    const setRestoreMode = (mode, i) => {
        if (mode) {
            setState({ restoreMode: mode, selectedIndex: i, restoreOpen: true })
        }
    }

    const setCompleteMode = (i) => {
        setState({ selectedIndex: i, completeOpen: true })
    }

    const handleIntegrityCheck = (policy) => {
        const { activeIntegerity } = state
        let integrityIcon = `fa fa-refresh`
        if (activeIntegerity?.id === policy?.id) {
            integrityIcon = 'fas fa-sync fa-spin'
        }
        if (activeIntegerity !== null && activeIntegerity?.id !== policy?.id) {
            integrityIcon = 'fa fa-refresh text-muted disable'
        }
        return integrityIcon
    }
    const handleIntegrity = async (project) => {
        const { projects } = state
        setState({ activeIntegerity: project })
        const response = await checkIntegrity({ type: 'project', uniqId: project.uniqueId })
        if (response.data) {
            const updatedProjects = await integrityWrapper(response.data, projects.list)
            setState({
                activeIntegerity: null,
                projects: {
                    list: updatedProjects,
                },
            })
        }
    }

    const handleSort = async () => {
        const { sort } = state
        let sortSet
        NProgress.start()
        try {
            sortSet = sort === 'DESC' ? 'ASC' : 'DESC'
            const { projects, allProjects } = await _fetchMasters({ page: 0 }, { sort: sortSet, sortBy: 'integrity_status' })
            setState({ projects, allProjects, sort: sort === 'DESC' ? 'ASC' : 'DESC' })
        } catch (err) {
            notify(err.message || err.toString())
        }
        NProgress.done()
    }

    const getTableBody = (isArchive = true) => {
        const { activeIntegerity } = state
        return (
            <tbody>
                {state.projects.list.map((project, i) => {
                    const disableBtncomplete = project.is_completed || !project.isActive ? 'disable-btn ' : ''
                    const disableArchiveBtn = !project.is_completed || !project.isActive ? 'disable-btn ' : ''
                    const integrityIcon = handleIntegrityCheck(project)
                    const disableEditBtn = !project.isActive ? 'disable-btn ' : ''

                    return (
                        <tr key={i}>
                            <td>{i + 1}</td>
                            <td className='project-name-blk'>{project.name}</td>
                            {state.selectedTab === LISTING_PAGE_TAB.PROJECT_LISTING && (
                                <td className='text-left'>
                                    {state.selectedTab === LISTING_PAGE_TAB.PROJECT_LISTING && (
                                        <>
                                            <i className={!project.isActive && !project.is_completed ? 'fa fa-circle text-danger' : 'fa fa-circle text-success'} title={!project.isActive && !project.is_completed ? string.inProgress : string.worker.active} />
                                        </>
                                    )}
                                </td>
                            )}
                            <td style={{ textAlign: 'left' }}>{project.project_category?.name}</td>
                            <td style={{ textAlign: isArchive ? 'end' : 'left' }}>{getLocalTime(project.createdAt)}</td>
                            {state.selectedTab === LISTING_PAGE_TAB.PROJECT_LISTING && (
                                <td>
                                    <IntegrityIcon data={project} />
                                </td>
                            )}
                            {isEditDeleteBtnAllowed(state.user) && (
                                <td className='custom-width'>
                                    {state.selectedTab === LISTING_PAGE_TAB.ARCHIVED_LISTING ? <i title={string.restoreArchivedProjectTitle} className='fa fa-undo' onClick={() => setRestoreMode('project', i)} /> : <></>}
                                    {state.selectedTab === LISTING_PAGE_TAB.ARCHIVED_LISTING ? (
                                        <></>
                                    ) : (
                                        <i title={state.selectedTab === LISTING_PAGE_TAB.TEMPLATE_LISTING ? string.editTemplateTitle : string.editProjectTitle} className={`${disableEditBtn}fa fa-pencil-alt`} onClick={() => editMode(i)} />
                                    )}
                                    {state.selectedTab === LISTING_PAGE_TAB.PROJECT_LISTING ? <i title={string.archiveProjectTitle} className={`${disableArchiveBtn}fa fa-archive`} onClick={() => setDeleteMode('project', i)} /> : <></>}
                                    {state.selectedTab === LISTING_PAGE_TAB.TEMPLATE_LISTING ? <i title={string.deleteTemplateTitle} className='fa fa-trash' onClick={() => setDeleteMode('template', i)} /> : <></>}
                                    {state.selectedTab === LISTING_PAGE_TAB.PROJECT_LISTING && (
                                        <>
                                            <i title={string.completeProjectTitle} className={`${disableBtncomplete}fa fa-check-square`} onClick={() => setCompleteMode(i)} />
                                        </>
                                    )}
                                    {state.selectedTab === LISTING_PAGE_TAB.PROJECT_LISTING && (
                                        <ActionButton
                                            icon={project.isActive ? integrityIcon : 'fa fa-refresh text-muted disable'}
                                            title='Check Integrity'
                                            onClick={() => {
                                                if (!activeIntegerity) {
                                                    handleIntegrity(project)
                                                }
                                            }}
                                        />
                                    )}
                                </td>
                            )}
                        </tr>
                    )
                })}
                <NoDataView list={state.projects.list} isLoading={state.isLoadingMode} colSpan={state.selectedTab === LISTING_PAGE_TAB.PROJECT_LISTING ? 7 : 5} />
            </tbody>
        )
    }

    const handleScroll = useCallback(() => {
        // End of the document reached?
        if (window.innerHeight + Math.ceil(document.documentElement.scrollTop) >= document.documentElement.offsetHeight - 100) {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
                const { list, totalCount, pageNumber } = state.projects
                const { sort } = state
                if (list.length < totalCount) {
                    NProgress.start()
                    const query = sort === '' ? { page: pageNumber + 1, ...state.projects } : { page: pageNumber + 1, ...state.projects, sort, sortBy: 'integrity_status' }
                    const { getDataFn } = state.selectedTabDetails
                    setState({ isLoadingMode: true })
                    handleFetchListData({ query, getDataFn })
                        .then((projects) => {
                            setState({ projects, isLoadingMode: false })
                            NProgress.done()
                        })
                        .catch((err) => {
                            setState({ isLoadingMode: false, error: err.message || err.toString() })
                            NProgress.done()
                        })
                }
            }, 300)
        }
    }, [state.projects, state.selectedTabDetails])

    const _toggleStep = (step) => {
        setState({ currentStep: step })
    }

    const addAudit = () => {}

    const addMode = () => {
        setState({
            isEdit: false,
            project: {
                selectedOrganizations: [],
                selectedUsers: [],
                isDraft: 0,
                projecttemptype: 'completeproject',
                selectedRoads: [],
                selections: [
                    {
                        item_id: '',
                        projectselectiontype: '',
                        container_id: '',
                        devices: [
                            {
                                // Data interval remove from UI
                                // data_interval: '',
                                device_id: '',
                                tag: '',
                            },
                        ],
                        group_id: 1,
                        truck_id: 1,
                        disableContainer: true,
                        disableTruck: true,
                        disableGroup: true,
                        selectionTemperatureArray: [],
                    },
                ],
                projecttempratures: {
                    temperature_alert_min: '',
                    temperature_alert_max: '',
                    temperature_alert_interval: '',
                    temperature_allowed_occurances: '',
                    humidity_alert_min: '',
                    humidity_alert_max: '',
                    humidity_alert_interval: '',
                    humidity_allowed_occurances: '',
                    ambience_threshold: '',
                },
            },
        })
        _toggleStep(1)
        props.resetCustomLabels()
        window.localStorage.removeItem('project_selections')
    }

    const _fetchMasters = async (params = {}, options) => {
        const pageNo = params.page > -1 ? params.page : state.projects.pageNumber
        const query = { ...params, page: pageNo, ...state.projects, ...options }
        const { getDataFn } = state.selectedTabDetails
        const [projects, allProjects] = await Promise.all([handleFetchListData({ query, getDataFn }), fetchProjectOnly(options)])
        return { projects, allProjects }
    }

    const getInitalDataFromServer = async () => {
        try {
            NProgress.start()
            setState({ isLoadingMode: true })
            const [{ projects, allProjects }, document_categories, participant_categories, participants, stations] = await Promise.all([_fetchMasters({}), fetchDocumentCategories(), fetchParticipantCategories(), fetchUsers(), fetchStations()])
            setState({ projects, allProjects, document_categories, participant_categories, participants, stations, isLoadingMode: false })
        } catch (err) {
            console.log(err)
            setState({ isLoadingMode: false, error: err.message || err.toString() }) // eslint-disable-line
        } finally {
            NProgress.done()
        }
    }

    useEffect(() => {
        getInitalDataFromServer()
    }, [])

    return (
        <>
            <List
                paginationProps={{
                    isPaginationRequired: state.selectedTabDetails.isPaginationRequired,
                    handleScroll,
                    isLoaderRequired: state.isLoadingMode,
                    handleSort,
                }}
                listTitle={state.selectedTabDetails.title || ''}
                addSubmitBtnProps={{
                    isVisible: state.selectedTabDetails.isSubmitBtnAllowed(state.user),
                    addMode,
                    btnTxt: string.submitProject,
                }}
                tableProps={{
                    tableHeaders: state.selectedTabDetails.tableHeaders,
                    isColGroupRequired: state.selectedTabDetails.isColGroupRequired,
                    getTableBody,
                }}
            />
            <Modals
                onDeleteEntry={onDeleteEntry}
                deleteOpen={state.deleteOpen}
                isDeleting={state.isDeleting}
                toggleDelete={() => {
                    setState({ deleteOpen: !state.deleteOpen })
                }}
                deleteMode={state.deleteMode}
                onRestoreEntry={onRestoreEntry}
                restoreOpen={state.restoreOpen}
                isRestore={state.isRestore}
                toggleRestore={() => {
                    setState({ restoreOpen: !state.restoreOpen })
                }}
                completeOpen={state.completeOpen}
                onCompleteProject={onCompleteProject}
                toggleComplete={() => {
                    setState({ completeOpen: !state.completeOpen })
                }}
                isActive={state.isActive}
                toggleOpen={state.toggleOpen}
                toggleStatus={() => setState({ toggleOpen: !state.toggleOpen })}
                currentStep={state.currentStep}
                _toggleStep={_toggleStep}
                modalClass={getModalClass(state.currentStep)}
                isEdit={state.isEdit}
                state={state}
                setState={setState}
                user={state.user}
                setProjectData={setProjectData}
                allProjects={state.allProjects}
                project_id={state?.project?.id}
                saveProject={saveProject}
                showdraftmodal={state.showdraftmodal}
                toggleDraftModal={() => setState({ showdraftmodal: 0 })}
                checkprojectdata={state.checkprojectdata}
                handleProjectChange={handleProjectChange}
                saveprojectData={saveprojectData}
                isLoading={state.isLoading}
                isReadOnly={!!state.project?.is_completed}
                modalTitle={state.isEdit ? state.selectedTabDetails.editModalTitle : state.selectedTabDetails.addModalTitle}
            />
        </>
    )
}
function mapDispatchToProps(dispatch) {
    return {
        // dispatching plain actions
        removeProjectFromMenuList: (payload) => dispatch(removeProjectFromMenuList(payload)),
        fetchSideBarMenuLists: (payload) => dispatch(fetchSideBarMenuLists(payload)),
        resetCustomLabels: () => dispatch(resetCustomLabels()),
    }
}

export default connect(null, mapDispatchToProps)(Listing)
