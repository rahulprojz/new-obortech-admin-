import { useEffect, useState, useMemo, useContext } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import NProgress from 'nprogress'
import moment from 'moment'
import notify from '../lib/notifier'
import { addProjectEvent, seenProjectEventDocument, handleUserAction, addProjectEventComment, fetchProjectDocuments, updateProjectComment, fetchUserAllEvents, allowEventSubmission } from '../lib/api/project-event'
import { fetchProjectDetails, fetchProjectSelections, useQueryProjectDetails, useQueryProjectSelections } from '../lib/api/project'
import DocumentEvent from '../components/events/DocumentEvent'
import DocumentHash from '../components/events/DocumentHash'
import Loader from '../components/common/Loader'
import DocumentModal from '../components/events/DocumentModalV2'
import string from '../utils/LanguageTranslation.js'
import EventFilters from '../components/events/miniStatus/EventFilters'
import EventContext from '../store/event/eventContext'
import { useQueryEventDoc } from '../lib/api/event-category'
import { useQueryDocumentCategories } from '../lib/api/project-category'
import { sanitize, getLocalDBValue } from '../utils/globalFunc'
import { setCustomLabels } from '../redux/actions/customLabelAction'
import { getOrgs } from '../redux/selectors/organizationSelector'
import { getCategoryEvents } from '../redux/selectors/eventSelector'

let interval = null
let userManualEvents = []

const file_types = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']

const DocumentPage = (props) => {
    const router = useRouter()
    const dispatch = useDispatch()
    const { user } = props
    const user_id = props.user.id
    const user_role_id = props.user.role_id
    const isNotAdminRole = user.role_id != process.env.ROLE_ADMIN
    const isManagerRole = user.role_id == process.env.ROLE_MANAGER
    const { organization_id } = props.user
    const { project_id } = router.query
    const [eventType, setEventType] = useState([])
    // const [project, setProject] = useState({})
    const [selectedPreviewEvent, setSelectedPreviewEvent] = useState({})
    const [selectedProjectEvent, setSelectedProjectEvent] = useState({})
    const [commentOpen, setCommentOpen] = useState()
    const [acceptOpen, setAcceptOpen] = useState()
    const [documentOpen, setDocumentOpen] = useState(false)
    const [hashViewOpen, setHashViewOpen] = useState(false)
    const [documentHash, setDocumentHash] = useState('')
    const [loader, setLoader] = useState(true)
    const [selectedParticipant, setSelectedParticipant] = useState(0)
    const [selectedDocType, setSelectedDocType] = useState('')
    const [selectedDocName, setSelectedDocName] = useState('')
    const [is_submitting, SetIsSubmitting] = useState(false)
    // const [eventParticipantFilters, setEventParticipantFilters] = useState([])
    // const [networkDocuments, SetNetworkDocuments] = useState([])
    const [documentFilters, setDocumentFilters] = useState([])
    const [projectOrganizations, setProjectOrganizations] = useState([])
    const [projectDocuments, setProjectDocuments] = useState([])
    // const [projectSelections, setProjectSelections] = useState({})
    const [headerWidth, setHeaderWidth] = useState({})
    const orgList = useSelector(getOrgs)
    const categoryEvents = useSelector(getCategoryEvents)

    const { groupNames, truckNames, selectedGroup, selectedTruck, selectedContainer, selectedItem, projectEventUsers, setProjectEventUsers, selectedItemValue, selectedGroupValue, selectedTruckValue, selectedContainerValue } = useContext(EventContext)
    const projectBody = useMemo(() => ({ project_id }), [project_id])
    const { data: project, refetch: projectRefetch } = useQueryProjectDetails(projectBody)
    const { data: projectSelections, refetch: refetchProjectSelection } = useQueryProjectSelections(project_id)

    const { data: document_categories, isFetching: documentLoading, refetch: refetchDocuments } = useQueryDocumentCategories(project.project_category_id)
    const {
        data: { documents: networkDocuments },
        isFetching: pdcIsFetching,
        refetch: refetchPDCEvents,
    } = useQueryEventDoc([], document_categories, user, orgList, documentLoading, true)

    // const startLoader = (value) => {
    //     setLoader(loader)
    // }

    // const closeLoader = (val) => {
    //     const loaderArray = [...loader]
    //     const filteredLoader = loaderArray.filter((item) => item !== val)
    //     setLoader(filteredLoader)
    // }

    useEffect(() => {
        if (project.id != undefined) {
            // Check if logged in user is part of project or not
            const ifUserExists = project.project_users.filter(function (e) {
                return parseInt(e.user.id) === parseInt(user.id)
            })

            if (user.role_id != process.env.ROLE_ADMIN && ifUserExists == 0) {
                router.push('/404')
            }
            refetchDocuments()
            if (project.custom_labels) dispatch(setCustomLabels(JSON.parse(project.custom_labels)))
        }
    }, [project])

    useEffect(() => {
        if (getLocalDBValue(project_id) || selectedItem || selectedContainer || selectedGroup || selectedTruck) {
            fetchDocuments(true)
            fetchDocumentJob()
        }
        return () => {
            clearInterval(interval)
        }
    }, [project_id, selectedContainer, selectedGroup, selectedTruck, selectedItem, selectedDocType, selectedDocName, selectedParticipant])

    useMemo(() => {
        if (orgList.length && !documentLoading) {
            setTimeout(() => {
                refetchPDCEvents()
            }, 500)
        }
    }, [JSON.stringify(document_categories), JSON.stringify(orgList), documentLoading])

    useMemo(() => {
        projectRefetch()
        refetchProjectSelection()
    }, [project_id, categoryEvents])

    const fetchDocumentJob = () => {
        try {
            if (interval) {
                clearInterval(interval)
            }
            let pEventUsers = projectEventUsers
            interval = setInterval(async () => {
                const data = {
                    container_id: selectedContainer,
                    group_id: selectedGroup,
                    truck_id: selectedTruck,
                    item_id: selectedItem,
                    project_id: parseInt(project_id),
                    organization_id: parseInt(organization_id),
                    user_id: parseInt(user_id),
                    user_role_id,
                    doc_type_id: selectedDocType,
                    doc_type_name: selectedDocName,
                    selected_participant: selectedParticipant,
                }
                const projectEvents = await fetchProjectDocuments(data)
                userManualEvents = projectEvents.userManualEvents || []
                const userAllEvents = await fetchUserAllEvents({ ...data, attachment_type: 2 })
                setProjectOrganizations(userAllEvents?.usersList || [])
                setProjectDocuments(userAllEvents?.eventsList || [])
                if (projectEvents?.eventUsers?.length) {
                    pEventUsers = _.unionBy([].concat.apply(pEventUsers, projectEvents.eventUsers), 'id')
                    setProjectEventUsers(pEventUsers)
                }

                if (projectEvents.projectEvents) setDocumentEvents(projectEvents)

                // setEventType(isNotAdminRole ? projectEvents.projectDocuments : projectEvents)
            }, process.env.EVENT_TIMER || 60000)
        } catch (error) {
            console.log(error)
        }
    }

    // const _fetchProjectDetails = async () => {
    //     try {
    //         // const project_details = await fetchProjectDetails({ project_id })
    //         // setProject(project_details)
    //         // const project_selections = await fetchProjectSelections({ project_id })
    //         // setProjectSelections(project_selections)
    //         // setEventParticipantFilters(project_details.project_participants)

    //         const document_categories = await fetchProjectDocumentCategories({
    //             project_category_id: project_details.project_category_id,
    //         })
    //         setDocumentFilters(document_categories)
    //         await fetchNetworkEventsList(document_categories)
    //         setLoader(false)
    //     } catch (error) {
    //         setLoader(false)
    //     }
    // }

    const fetchDocuments = async (showProgress = true) => {
        try {
            if (showProgress) {
                NProgress.start()
            }
            let pEventUsers = projectEventUsers
            const data = {
                container_id: selectedContainer,
                group_id: selectedGroup,
                truck_id: selectedTruck,
                item_id: selectedItem,
                project_id: parseInt(project_id),
                organization_id: parseInt(organization_id),
                user_id: parseInt(user_id),
                user_role_id,
                doc_type_id: selectedDocType,
                doc_type_name: selectedDocName,
                selected_participant: selectedParticipant,
            }
            const projectEvents = await fetchProjectDocuments(data)
            userManualEvents = projectEvents.userManualEvents || []
            const userAllEvents = await fetchUserAllEvents({ ...data, attachment_type: 2 })
            setProjectOrganizations(userAllEvents?.usersList || [])
            setProjectDocuments(userAllEvents?.eventsList || [])
            if (projectEvents?.eventUsers?.length) {
                pEventUsers = _.unionBy([].concat.apply(pEventUsers, projectEvents.eventUsers), 'id')
                setProjectEventUsers(pEventUsers)
            }

            if (projectEvents.projectEvents) setDocumentEvents(projectEvents)
            setLoader(false)
            if (showProgress) {
                NProgress.done()
            }
        } catch (error) {
            console.log(error)
        }
    }

    const setDocumentEvents = (pevents) => {
        try {
            const projectEvents = pevents.projectEvents
                .filter((ev) => ev.viewUsers.length)
                .map((ev) => {
                    const user = pevents.eventUsers.find((user) => user.id == ev.viewUsers[0]?.created_by) || {}
                    return { ...ev, project_event: ev, user }
                })
            setEventType(projectEvents)
        } catch (err) {
            console.log(err)
        }
    }

    const _toggleDocument = () => {
        setSelectedPreviewEvent({})
        setSelectedProjectEvent({})
        if (!selectedItem) {
            notify(string.pleaseSelectItem)
            return false
        }
        setDocumentOpen(!documentOpen)
    }

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
        pdc,
        canUserSubmitEvent,
        isPDCEvent = true,
        isPublicEvent,
        event_submission_id,
        isIotEventOn,
        isIotEventOff,
        device_id,
    }) => {
        const event_id = event.uniqId
        if (!event_id) {
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
        if (!canUserSubmitEvent && pdc) {
            return notify(documentOpen ? string.event.userCannotSubmitDocument : string.event.userCannotSubmitEvent)
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
        formData.append('pdcName', eventPDCName)
        formData.append('event_name', event.eventName)
        formData.append('local_event_name', event.mongolianName)
        formData.append('event_category_id', event.event_category_id)
        formData.append('device_id', device_id || 0)

        // Check the form-builder have assets field
        const formBuilderData = json_data ? JSON.parse(json_data) : []
        formData.append('isAssetEvent', formBuilderData.length > 0 && formBuilderData.some((data) => data.name && data.name.includes('asset')))

        // selection names
        formData.append('groupName', selectedGroupValue.label)
        formData.append('truckName', selectedTruckValue.label)
        formData.append('containerName', selectedContainerValue.label)
        formData.append('itemName', selectedItemValue.label)
        formData.append('isIotEventOff', isIotEventOff || false)
        formData.append('isIotEventOn', isIotEventOn || false)
        formData.append('event_submission_id', event_submission_id)

        if (selectedProjectEvent && selectedProjectEvent.event_submission_id) {
            formData.append('projectEventId', selectedProjectEvent.event_submission_id)
        }
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
            if (isPDCEvent) {
                const isEventSubmissionAllowed = await allowEventSubmission({ ...eventPayload })
                const isAddEventAllowed = JSON.parse(isEventSubmissionAllowed.data)

                if (!isAddEventAllowed.success) {
                    throw isAddEventAllowed.message
                }
            }
            await addProjectEvent(formData)
            fetchDocuments(true)
            setDocumentOpen(false)
            // fetchProjectEventUserOrgs()
            NProgress.done()
        } catch (err) {
            notify(string.eventAddingErr)
            console.error('Error while fething events => ', err)
            NProgress.done()
        }
        SetIsSubmitting(false)
    }

    /**
     * Add Comment by user to document
     */
    const _addComment = async (comment, event_submission_id, item_id, type) => {
        NProgress.start()
        try {
            const new_comment = await addProjectEventComment({
                comment,
                user_id: user.id,
                event_submission_id,
                organization_id: parseInt(organization_id),
                item_id,
                is_viewed: 0,
                type,
            })
            NProgress.done()
            fetchDocuments()
            return new_comment
        } catch (err) {
            console.error('Error while fething events => ', err)
            NProgress.done()
        }
    }

    const _toggleHashView = (hash = '') => {
        if (hash) {
            setDocumentHash(hash)
        } else {
            setDocumentHash('')
        }
        setHashViewOpen(!hashViewOpen)
    }

    /**
     * Accept Documment
     */
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

            fetchDocuments()
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
                fetchDocuments()
            }
            NProgress.done()
        } catch (err) {
            console.error('Error while fething events => ', err)
            NProgress.done()
        }
    }

    const _updateProjectisViewed = async (data) => {
        await updateProjectComment(data)
        fetchDocuments()
    }

    const _handleModalEventsAction = (preview_event, project_event) => {
        setSelectedPreviewEvent(preview_event)
        setSelectedProjectEvent(project_event)
    }

    const userProjectSelections = useMemo(() => {
        if (isManagerRole ? projectSelections.user_id != user_id : isNotAdminRole) {
            const tempProjectSelections = projectSelections
            const projectData = tempProjectSelections.project_selections?.filter((projSelection) => {
                return userManualEvents.some((e) => e.item_id == projSelection?.selection_items[0]?.item_id)
            })
            return { ...projectSelections, project_selections: projectData || [] }
        }
        return projectSelections
    }, [projectSelections, userManualEvents])

    return (
        <div>
            {/* {<Loader />} */}

            {/* <Document/> */}
            <div className='container-fluid'>
                <div className='row d-flex project-listing'>
                    <div className='tab-pane fade show active mt-3 w-100' id='event' role='tabpanel' aria-labelledby='event-listing'>
                        <div style={{ paddingTop: groupNames.available.length == 1 || truckNames.available.length == 1 ? '30px' : '65px' }} className='row document-list'>
                            <div className={`${!loader && 'tableFixHead'} project-table-listing mt-2 w-100 col-md-12`}>
                                <table className='table'>
                                    <thead className='thead-dark'>
                                        <tr>
                                            <th scope='col'>{string.date}</th>
                                            <th scope='col'>{string.submitter}</th>
                                            <th scope='col'>{string.typeOfDoc}</th>
                                            <th scope='col'>{string.documentName}</th>
                                            <th scope='col'>{string.fileName}</th>
                                            <th scope='col'>{string.docSeenBy}</th>
                                            <th scope='col' className='text-center'>
                                                {string.project.actions}
                                            </th>
                                            <th className='text-center' scope='col'>
                                                {string.hash}
                                            </th>
                                        </tr>
                                    </thead>
                                    <colgroup>
                                        <col style={{ width: '10%' }} />
                                        <col style={{ width: '10%' }} />
                                        <col style={{ width: '12%' }} />
                                        <col style={{ width: '10%' }} />
                                        <col style={{ width: '8%' }} />
                                        <col style={{ width: '10%' }} />
                                        <col style={{ width: '5%' }} />
                                        <col style={{ width: '5%' }} />
                                    </colgroup>
                                    <tbody>
                                        {!loader &&
                                            eventType.length > 0 &&
                                            eventType.map((ev, i) => {
                                                ev.project_event.event = {
                                                    eventType: 'document',
                                                    uniqId: ev.project_event?.event_id,
                                                    event_category_id: ev.project_event?.event_category_id,
                                                }

                                                return (
                                                    <DocumentEvent
                                                        key={i}
                                                        created_by={ev.project_event.viewUsers[0].created_by}
                                                        networkDocuments={networkDocuments || []}
                                                        project_event={ev.project_event}
                                                        project={project}
                                                        projectSelections={projectSelections}
                                                        createdAt={ev.createdAt}
                                                        toggleDocument={() => setDocumentOpen(!documentOpen)}
                                                        user={ev.user}
                                                        _seenDocument={_seenDocument}
                                                        _handleUserAction={_handleUserAction}
                                                        allUsersAccepted={ev.project_event.document_accepted_users?.length == ev.project_event.event_accept_document_users?.length}
                                                        acceptedDocument={
                                                            ev.project_event.document_accepted_users?.filter(function (e) {
                                                                return e.user_id === parseInt(user.id)
                                                            }).length != 0
                                                        }
                                                        seenDocument={
                                                            ev.project_event.document_seen_users?.filter(function (e) {
                                                                return e.organization_id === user.organization_id
                                                            }).length != 0
                                                        }
                                                        // allUsersAccepted={ev.project_event?.acceptUsers?.every(user=> user.accepted || user.rejected)}
                                                        // acceptedDocument={
                                                        //     ev.project_event.acceptUsers?.some(function (e) {
                                                        //         return e.accepted
                                                        //     })
                                                        // }
                                                        // seenDocument={
                                                        //     ev.project_event.documentSeenUsers?.length != 0
                                                        // }
                                                        setCommentOpen={(id) => setCommentOpen(id)}
                                                        commentOpen={commentOpen}
                                                        _addComment={_addComment}
                                                        auth_user={user}
                                                        _toggleHashView={_toggleHashView}
                                                        setAcceptOpen={(id) => setAcceptOpen(id)}
                                                        acceptOpen={acceptOpen}
                                                        _updateProjectisViewed={_updateProjectisViewed}
                                                        _handleModalEventsAction={_handleModalEventsAction}
                                                    />
                                                )
                                            })}
                                    </tbody>
                                </table>
                                {loader && <Loader className='document-spinner' />}
                            </div>
                        </div>
                    </div>
                    <div className='row event-filter-sticky'>
                        <div className='d-flex flex-wrap'>
                            <EventFilters
                                project={userProjectSelections}
                                projectOrganizations={projectOrganizations}
                                user={user}
                                showQrCode='hide'
                                isDocumentView
                                selectedParticipant={selectedParticipant}
                                selectedDocType={selectedDocType}
                                selectedDocName={selectedDocName}
                                documents={projectDocuments}
                                onSetSelectedParticipant={setSelectedParticipant}
                                onSetSelectedDocType={setSelectedDocType}
                                onSetSelectedDocName={setSelectedDocName}
                            />
                        </div>
                    </div>
                </div>
                <DocumentHash
                    isOpen={hashViewOpen}
                    toggle={() => {
                        _toggleHashView()
                    }}
                    documentHash={documentHash}
                />
            </div>

            {documentOpen && (
                <DocumentModal
                    project={project}
                    selectedPreviewEvent={selectedPreviewEvent}
                    selectedProjectEvent={selectedProjectEvent}
                    categoryEvents={categoryEvents}
                    projectSelections={userProjectSelections?.project_selections || []}
                    pdcEvents={networkDocuments}
                    isOpen={documentOpen}
                    toggle={_toggleDocument}
                    eventParticipantFilters={project.project_participants}
                    _submitEvent={_submitEvent}
                    auth_user={user}
                    is_submitting={is_submitting}
                    file_types={file_types}
                    documentFilters={document_categories}
                    currentUser={user}
                />
            )}
        </div>
    )
}

export default DocumentPage
