import React, { useEffect, useMemo, useState } from 'react'
import './submissionRequest.css'
import withAuth from '../../lib/withAuth'
import { Modal, ModalHeader, ModalFooter, ModalBody, Spinner } from 'reactstrap'
import Button from '../../components/common/form-elements/button/Button'
import Checkbox from '../../components/common/form-elements/checkbox/index'
import CustomSelect from '../../components/common/form-elements/select/CustomSelect'
import Input from '../../components/common/form-elements/input/Input'
import string from '../../utils/LanguageTranslation.js'
import { fetchProjects, fetchProject, submitRequest, fetchSubmissionRequests, removeSubmissionRequests } from '../../lib/api/submissionRequest'
import { fetchActiveVerifiedWorkers } from '../../lib/api/workers'
import NProgress from 'nprogress'
import { fetchOrgs } from '../../lib/api/organization'
import { fetchCategoryEvents } from '../../lib/api/event'
import notify from '../../lib/notifier'
import { sanitize } from '../../utils/globalFunc'
import { INITIAL_PAGINATION_STATE } from '../../shared/constants'
import Pagination from '../../components/pagination'
import Loader from '../../components/common/Loader'

const { PAGE_SIZE } = process.env

function SendSubmissionRequest(props) {
    const [user, setUser] = useState(props.user || {})
    const [modal, setModal] = useState(false)
    const toggle = () => setModal(!modal)
    const [projects, setProjects] = useState([])
    const [project, setProject] = useState(null)
    const [container, setContainer] = useState(null)
    const [item, setItem] = useState(null)
    const [event, setEvent] = useState(null)
    const [eventType, setEventType] = useState('document')
    const [projectDetails, setProjectDetails] = useState({})
    const [selectedParticipants, setSelectedParticipants] = useState([])
    const [selectedDocParticipants, setSelectedDocParticipants] = useState([])
    const [workers, setWorkers] = useState([])
    const [selectedWorkers, setSelectedWorkers] = useState([])
    const [filteredWorkers, setFilteredWorkers] = useState([])
    const [filteredSelectedWorkers, setFilteredSelectedWorkers] = useState([])
    const [paginationData, setPaginationData] = useState({ list: [], pageNumber: 0, totalPages: 0, totalCount: 0 })
    const [selectedIndex, setSelectedIndex] = useState({})
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [viewOpen, setViewOpen] = useState(false)
    const [selectedSubmissionRequest, setSelectedSubmissionRequest] = useState({})
    const [orgList, setOrgList] = useState([])
    const [pdcEvents, setPdcEvents] = useState({
        documents: [],
        events: [],
        PDCs: [],
    })
    const [isLoading, setIsLoading] = useState(false)
    const [loader, setLoader] = useState(false)

    useEffect(() => {
        fetchOrganizationList()
        _fetchProjects()
        _fetchWorkers()
        _fetchSubmissionRequests()
        if (Object.keys(projectDetails).length > 0 && orgList.length > 0) {
            fetchNetworkEventsList()
        }
    }, [])

    useEffect(() => {
        if (Object.keys(projectDetails).length > 0 && orgList.length > 0) {
            fetchNetworkEventsList()
        } else {
            setPdcEvents({
                documents: [],
                events: [],
                PDCs: [],
            })
        }
    }, [orgList, projectDetails])

    const _fetchSubmissionRequests = async (page) => {
        const pageNo = page > -1 ? page : paginationData.pageNumber
        NProgress.start()
        try {
            setIsLoading(true)
            setPaginationData(INITIAL_PAGINATION_STATE)
            const submissionRequestsData = await fetchSubmissionRequests({ limit: PAGE_SIZE, offset: pageNo * PAGE_SIZE })
            const submissionRequestsArray = []
            submissionRequestsData.rows.forEach((element) => {
                let json = {}
                json['id'] = element.id
                json['project_name'] = element.project.name
                json['container_name'] = element.container.containerId
                json['item_name'] = element.item.itemId
                json['event_type'] = element.event_type
                json['event_name'] = element.event.name
                let selectedUsers = []
                element.submission_request_participants.forEach((eachUser) => {
                    selectedUsers.push(eachUser.organization.name)
                })
                let selectedDocUsers = []
                element.submission_request_document_participants.forEach((eachUser) => {
                    selectedDocUsers.push(eachUser.organization.name)
                })
                let selectedRecipients = []
                element.submission_request_recipients.forEach((eachWorker) => {
                    selectedRecipients.push({
                        name: eachWorker.worker.first_name + ' ' + eachWorker.worker.last_name,
                        submitted: eachWorker.is_submitted,
                    })
                })
                json['selected_users'] = selectedUsers
                json['selected_doc_users'] = selectedDocUsers
                json['selected_workers'] = selectedRecipients
                submissionRequestsArray.push(json)
            })
            setIsLoading(false)
            setPaginationData({
                list: submissionRequestsArray || [],
                pageNumber: pageNo,
                totalPages: Math.ceil(submissionRequestsData.count / PAGE_SIZE),
                totalCount: submissionRequestsData.count,
            })

            NProgress.done()
        } catch (err) {
            setIsLoading(false)
            console.error('Error while fething submission requests => ', err)
            NProgress.done()
        }
    }

    const _fetchProjects = async () => {
        NProgress.start()
        try {
            const projects = await fetchProjects()
            setProjects(projects)

            NProgress.done()
        } catch (err) {
            console.error('Error while fething projects => ', err)
            NProgress.done()
        }
    }

    const _submitRequest = async () => {
        try {
            if (!project) {
                notify(string.submissionRequest.pleaseSelectProject)
                return false
            }
            if (!container) {
                notify(string.errors.group1PleaseSelect)
                return false
            }
            if (!item) {
                notify(string.submissionRequest.pleaseSelectItem)
                return false
            }
            if (!event) {
                notify(string.submissionRequest.pleaseSelectEvent)
                return false
            }
            if (selectedWorkers.length == 0) {
                notify(string.submissionRequest.pleaseSelectRecipient)
                return false
            }
            // call submit request function with details
            NProgress.start()
            await submitRequest({
                user_id: user.id,
                project_id: project,
                container_id: container,
                item_id: item,
                event_id: event,
                event_type: eventType,
                recipients: selectedWorkers,
                participants: selectedParticipants,
                doc_participants: selectedDocParticipants,
                organization_id: user.organization_id,
            })
            _fetchSubmissionRequests(0)
            notify(string.submissionRequest.requestSubmitted)
            setProjectDetails({})
            setFilteredSelectedWorkers([])
            setSelectedWorkers([])
            setSelectedParticipants([])
            toggle()
            NProgress.done()
        } catch (err) {
            console.error('Error submitting form => ', err)
            NProgress.done()
        }
    }

    const _fetchProject = async (project_id) => {
        NProgress.start()
        try {
            if (!project_id) {
                setProjectDetails({})
            }
            setProject(project_id)
            const project_details = await fetchProject({ project_id })
            setProjectDetails(project_details)

            NProgress.done()
        } catch (err) {
            console.error('Error while fething project details => ', err)
            NProgress.done()
        }
    }

    const _fetchWorkers = async () => {
        NProgress.start()
        try {
            const workers = await fetchActiveVerifiedWorkers()
            setWorkers(workers)
            setFilteredWorkers(workers)

            NProgress.done()
        } catch (err) {
            console.error('Error while fething project details => ', err)
            NProgress.done()
        }
    }

    const fetchOrganizationList = async () => {
        const orgList = await fetchOrgs()
        setOrgList(orgList)
    }

    const fetchNetworkEventsList = async () => {
        try {
            let eventCategoryIds = []
            let documentCategoryIds = []

            projectDetails.project_category?.project_event_categories.map((event) => {
                eventCategoryIds.push(event.event_category.id)
            })

            projectDetails.project_category?.project_document_categories.map((document) => {
                documentCategoryIds.push(document.document_category.id)
            })

            const selectedOrg = orgList?.find(({ id }) => id === props.user?.organization_id)
            if (Object.values(selectedOrg).length === 0) {
                return
            }
            setLoader(true)
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
            NProgress.done()
            setLoader(false)
        } catch (err) {
            console.log({ err })
            NProgress.done()
        }
    }

    // set delete mode upon selecting delete icon
    const setDeleteMode = (i) => {
        setSelectedIndex(i)
        toggleDelete()
    }

    const setViewMode = (i) => {
        setSelectedIndex(i)
        toggleView()
    }

    const toggleView = () => {
        setViewOpen(!viewOpen)
    }

    const toggleDelete = () => {
        setDeleteOpen(!deleteOpen)
    }

    const onDeleteEntry = async (event) => {
        event.preventDefault()
        let submission_request = paginationData.list[selectedIndex]
        await removeSubmissionRequests({ id: submission_request.id })
        _fetchSubmissionRequests(0)
        toggleDelete()
        notify(string.submissionRequest.requestDeleted)
    }

    const onViewEntry = async (i) => {
        let submission_request = paginationData.list[i]
        setSelectedSubmissionRequest(submission_request)
    }

    const blockchainPDCEvents = useMemo(() => {
        if (!projectDetails || (projectDetails && Object.keys(projectDetails).length === 0)) {
            return {
                events: [],
                documents: [],
            }
        }
        const catId = projectDetails.project_category?.id
        let events = []
        let documents = []

        // @todo- filter by category
        pdcEvents.events.map((event) => {
            events.push({ ...event })
        })

        pdcEvents.documents.map((document) => {
            documents.push({ ...document })
        })

        return {
            events,
            documents,
        }
    }, [pdcEvents, projectDetails])

    return (
        <div>
            <div className='container-fluid'>
                <div className='row d-flex project-listing'>
                    <div className='tab-content w-100' id='myTabContent'>
                        <div className='tab-pane fade show active mt-3 w-100' id='participant' role='tabpanel' aria-labelledby='participant-listing'>
                            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                                <h4 className='text-dark'>{string.submissionRequest.submissionRequestListing}</h4>
                                <Button className='btn btn-primary large-btn' onClick={toggle}>
                                    {string.submissionRequest.addRequest}
                                </Button>
                            </div>
                            <div className='project-table-listing table-responsive mt-2 w-100'>
                                <table className='table'>
                                    <thead className='thead-dark'>
                                        <tr>
                                            <th scope='col'>#</th>
                                            <th scope='col'>{string.submissionRequest.project}</th>
                                            <th scope='col'>{string.group1}</th>
                                            <th scope='col'>{string.project.item}</th>
                                            <th scope='col'>{string.submissionRequest.event}</th>
                                            <th scope='col'>{string.submissionRequest.eventDocumentType}</th>
                                            <th className='text-center' scope='col'>
                                                {string.actions}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginationData.list.map((request, i) => {
                                            return (
                                                <tr key={i}>
                                                    <td>{i + 1}</td>
                                                    <td>{request.project_name}</td>
                                                    <td>{request.container_name}</td>
                                                    <td>{request.item_name}</td>
                                                    <td>{request.event_name}</td>
                                                    <td>{request.event_type}</td>
                                                    <td>
                                                        <i className='fa fa-trash' onClick={() => setDeleteMode(i)}></i>
                                                        <i
                                                            className='fa fa-eye'
                                                            aria-hidden='true'
                                                            onClick={() => {
                                                                onViewEntry(i), setViewMode(i)
                                                            }}
                                                        ></i>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {!paginationData.totalCount && !isLoading && (
                                            <tr>
                                                <td colSpan='5' className='text-center'>
                                                    {string.noData}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                {isLoading && <Loader style={{ marginTop: '20px' }} />}
                            </div>
                            <Pagination data={paginationData} onPageChange={_fetchSubmissionRequests} />
                        </div>
                    </div>
                </div>
            </div>
            <div className='request-block'>
                {/* SEND SUBMISSION REQUEST MODEL */}
                <Modal isOpen={modal} toggle={toggle} className='request-modal submission-model common-model modal-lg customModal'>
                    <div className='common-modal-wrap'>
                        <ModalHeader toggle={toggle} className='modal-header'>
                            <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                                {string.submissionRequest.modalTitle}
                            </h5>
                        </ModalHeader>
                        <ModalBody className='request-body-wrap'>
                            {loader && (
                                <div className='loader-blk'>
                                    <Spinner size={'sm'} />
                                </div>
                            )}
                            <div className='request-body d-flex justify-content-between submission-request-project'>
                                <div className='request-content half-card'>
                                    <label className='modal-sub-heading'>
                                        {string.submissionRequest.projectTitle} <span className='text-danger'>*</span>
                                    </label>
                                    <CustomSelect
                                        className='requet-select'
                                        onChange={(e) => {
                                            _fetchProject(e.target.value)
                                            setContainer(null)
                                            setItem(null)
                                        }}
                                    >
                                        <option value='' disabled selected>
                                            {string.submissionRequest.projectTitleSmall}
                                        </option>
                                        ;
                                        {projects.map((project, i) => {
                                            return (
                                                <option key={i} value={project.id}>
                                                    {project.name}
                                                </option>
                                            )
                                        })}
                                    </CustomSelect>
                                    <label className='modal-sub-heading mt-2'>
                                        {string.submissionRequest.group1Title} <span className='text-danger'>*</span>
                                    </label>
                                    <CustomSelect
                                        className='requet-select'
                                        onChange={(e) => {
                                            setContainer(e.target.value)
                                        }}
                                    >
                                        <option value='' disabled selected={container === null}>
                                            {string.submissionRequest.group1TitleSmall}
                                        </option>
                                        ;
                                        {projectDetails?.project_selections?.map((selection, i) => {
                                            return (
                                                <option key={i} value={selection.selection_containers[0]?.container?.id}>
                                                    {selection.selection_containers[0]?.container?.containerId}
                                                </option>
                                            )
                                        })}
                                    </CustomSelect>
                                    <label className='modal-sub-heading mt-2'>
                                        {string.submissionRequest.itemTitle} <span className='text-danger'>*</span>
                                    </label>
                                    <CustomSelect
                                        className='requet-select'
                                        onChange={(e) => {
                                            setItem(e.target.value)
                                        }}
                                    >
                                        <option value='' disabled selected={item === null}>
                                            {string.submissionRequest.itemTitleSmall}
                                        </option>
                                        ;
                                        {projectDetails.project_selections &&
                                            projectDetails.project_selections.map((selection, i) => {
                                                return (
                                                    <option key={i} value={selection.selection_items[0]?.item?.id}>
                                                        {selection.selection_items[0]?.item?.itemId}
                                                    </option>
                                                )
                                            })}
                                    </CustomSelect>
                                </div>
                                <div className='request-content half-card'>
                                    <div className='custom-checkbox request-btn half-card'>
                                        <Checkbox type='radio' name='event_type' id='document_event' checked={eventType == 'document' ? true : false} onClick={() => setEventType('document')} className='notification-check custom-control-input' />
                                        <label className='custom-control-label modal-sub-heading' htmlFor='document_event'>
                                            {string.submissionRequest.documentTypeTitle} <span className='text-danger'>{eventType == 'document' ? '*' : ''}</span>
                                        </label>
                                        <CustomSelect project className={eventType == 'alert' ? 'requet-select disabled' : 'requet-select'} onChange={(e) => setEvent(e.target.value)}>
                                            <option value='' disabled selected>
                                                {string.submissionRequest.documentTypeTitleSmall}
                                            </option>
                                            ;
                                            {blockchainPDCEvents.documents.map((event, j) => {
                                                return (
                                                    <option key={event.id} value={event.uniqId}>
                                                        {event.name || event.eventName}
                                                    </option>
                                                )
                                            })}
                                        </CustomSelect>
                                    </div>
                                    <div className='custom-checkbox request-btn half-card'>
                                        <Checkbox type='radio' name='event_type' id='alert_event' checked={eventType == 'alert' ? true : false} onClick={() => setEventType('alert')} className='notification-check custom-control-input' />
                                        <label className='custom-control-label modal-sub-heading' htmlFor='alert_event'>
                                            {string.submissionRequest.eventTypeTitle} <span className='text-danger'>{eventType == 'alert' ? '*' : ''}</span>
                                        </label>
                                        <CustomSelect project className={eventType == 'document' ? 'requet-select disabled' : 'requet-select'} onChange={(e) => setEvent(e.target.value)}>
                                            <option value='' disabled selected>
                                                {string.submissionRequest.eventTypeTitleSmall}
                                            </option>
                                            ;
                                            {blockchainPDCEvents.events.map((event, j) => {
                                                return (
                                                    <option key={event.id} value={event.uniqId}>
                                                        {event.name || event.eventName}
                                                    </option>
                                                )
                                            })}
                                        </CustomSelect>
                                    </div>
                                </div>
                            </div>
                            <div className='request-body d-flex justify-content-between'>
                                <div className='half-card participant-custom-checkbox'>
                                    <h6 className='modal-sub-heading'>{string.submissionRequest.submissionViewTitle}</h6>
                                    <div className='setting-card setting-content-wrap'>
                                        <div className='chekbox-wrap'>
                                            {projectDetails?.project_participants &&
                                                projectDetails.project_participants.map((participant, i) => {
                                                    if (participant.organization?.id == user.organization_id) {
                                                        return false
                                                    }
                                                    return (
                                                        <div key={i} id={'checkbox_' + participant.organization.id} className='custom-checkbox'>
                                                            <Checkbox
                                                                onClick={(e) => {
                                                                    // check if participant is already added or not
                                                                    if (
                                                                        selectedParticipants.filter(function (participant) {
                                                                            return participant === e.target.value
                                                                        }).length == 0
                                                                    ) {
                                                                        // add into array
                                                                        selectedParticipants.push(e.target.value)
                                                                        setSelectedParticipants([...selectedParticipants])
                                                                    } else {
                                                                        // remove from the array
                                                                        const index = selectedParticipants.indexOf(e.target.value)
                                                                        selectedParticipants.splice(index, 1)
                                                                        setSelectedParticipants([...selectedParticipants])
                                                                    }
                                                                }}
                                                                id={'participant_' + participant.organization.id}
                                                                value={participant.organization.id}
                                                                className='notification-check custom-control-input'
                                                            />
                                                            <label className='custom-control-label' htmlFor={'participant_' + participant.organization.id}>
                                                                {participant.organization.name}
                                                            </label>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    </div>
                                </div>
                                {eventType == 'document' && (
                                    <>
                                        <div className='half-card participant-custom-checkbox'>
                                            <h6 className='modal-sub-heading'>{string.submissionRequest.submissionAcceptTitle}</h6>
                                            <div className='setting-card setting-content-wrap'>
                                                <div className='chekbox-wrap'>
                                                    {projectDetails?.project_participants &&
                                                        projectDetails.project_participants.map((participant, i) => {
                                                            if (participant.organization?.id == user.organization_id) {
                                                                return false
                                                            }
                                                            return (
                                                                <div key={i} className='custom-checkbox'>
                                                                    <Checkbox
                                                                        onClick={(e) => {
                                                                            if (
                                                                                selectedParticipants.filter(function (participant) {
                                                                                    return participant === e.target.value
                                                                                }).length == 0
                                                                            ) {
                                                                                document.getElementById('participant_' + participant.organization.id).click()
                                                                            }

                                                                            const element = document.getElementById('checkbox_' + participant.organization.id)
                                                                            if (element.classList.contains('checkbox-disabled')) {
                                                                                element.classList.remove('checkbox-disabled')
                                                                            } else {
                                                                                element.classList.add('checkbox-disabled')
                                                                            }
                                                                            // check if participant is already added or not
                                                                            if (
                                                                                selectedDocParticipants.filter(function (participant) {
                                                                                    return participant === e.target.value
                                                                                }).length == 0
                                                                            ) {
                                                                                // add into array
                                                                                selectedDocParticipants.push(e.target.value)
                                                                                setSelectedDocParticipants([...selectedDocParticipants])
                                                                            } else {
                                                                                // remove from the array
                                                                                const index = selectedDocParticipants.indexOf(e.target.value)
                                                                                selectedDocParticipants.splice(index, 1)
                                                                                setSelectedDocParticipants([...selectedDocParticipants])
                                                                            }
                                                                        }}
                                                                        id={'doc_participant_' + participant.organization.id}
                                                                        value={participant.organization.id}
                                                                        className='notification-check custom-control-input'
                                                                    />
                                                                    <label className='custom-control-label' htmlFor={'doc_participant_' + participant.organization.id}>
                                                                        {participant.organization.name}
                                                                    </label>
                                                                </div>
                                                            )
                                                        })}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className='request-body d-flex justify-content-between'>
                                <div className='half-card request-recipients'>
                                    <div className='recipients-header d-flex justify-content-between'>
                                        <h6 className='modal-sub-heading'>{string.submissionRequest.recipientsTitle}</h6>
                                    </div>
                                    <div className='recipients-fliter-wrap'>
                                        <Input
                                            type='text'
                                            className='recipients-filter'
                                            onChange={(e) => {
                                                const string = e.target.value
                                                const values = workers.filter((o) => {
                                                    let workerName = o.first_name + ' ' + o.last_name
                                                    return workerName.toLowerCase().includes(string.toLowerCase())
                                                })
                                                setFilteredWorkers(values)
                                            }}
                                            placeholder={string.submissionRequest.filterText}
                                        />
                                        <div className='setting-card setting-content-wrap'>
                                            <div>
                                                {filteredWorkers.map((worker, i) => {
                                                    return (
                                                        <div key={i}>
                                                            <i
                                                                className='fa fa-plus'
                                                                onClick={(e) => {
                                                                    // add to selected workers if not in array
                                                                    const index = selectedWorkers.indexOf(filteredWorkers[i])
                                                                    if (index == -1) {
                                                                        selectedWorkers.push(filteredWorkers[i])
                                                                        setSelectedWorkers([...selectedWorkers])
                                                                        setFilteredSelectedWorkers([...selectedWorkers])
                                                                    }
                                                                }}
                                                            ></i>
                                                            <span>
                                                                {worker.first_name} {worker.last_name}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='half-card request-recipients'>
                                    <div className='recipients-header d-flex justify-content-between'>
                                        <h6 className='modal-sub-heading'>{string.submissionRequest.selectedRecipientTitle}</h6>
                                    </div>
                                    <div className='recipients-fliter-wrap'>
                                        <Input
                                            type='text'
                                            className='recipients-filter'
                                            onChange={(e) => {
                                                const string = e.target.value
                                                const values = selectedWorkers.filter((o) => {
                                                    let workerName = o.first_name + ' ' + o.last_name
                                                    return workerName.toLowerCase().includes(string.toLowerCase())
                                                })
                                                setFilteredSelectedWorkers([...values])
                                            }}
                                            placeholder={string.submissionRequest.filterText}
                                        />
                                        <div className='setting-card setting-content-wrap'>
                                            <div>
                                                {filteredSelectedWorkers.map((worker, i) => {
                                                    return (
                                                        <div key={i}>
                                                            <i
                                                                className='fa fa-trash'
                                                                onClick={(e) => {
                                                                    // remove from selected workers array
                                                                    let index = filteredSelectedWorkers.indexOf(filteredSelectedWorkers[i])
                                                                    filteredSelectedWorkers.splice(index, 1)
                                                                    setFilteredSelectedWorkers([...filteredSelectedWorkers])
                                                                    index = selectedWorkers.indexOf(selectedWorkers[i])
                                                                    selectedWorkers.splice(index, 1)
                                                                    setSelectedWorkers([...selectedWorkers])
                                                                }}
                                                            ></i>
                                                            <span>
                                                                {worker.first_name} {worker.last_name}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button disabled={loader} className='btn btn-primary large-btn' onClick={() => _submitRequest()}>
                                {string.submissionRequest.sendBtn}
                            </Button>
                        </ModalFooter>
                    </div>
                </Modal>

                {/* DELETE SUBMISSION REQUEST MODEL */}
                <Modal toggle={toggleDelete} isOpen={deleteOpen} className='customModal'>
                    <ModalHeader toggle={toggleDelete}></ModalHeader>
                    <ModalBody className='text-center mb-5'>
                        <p>
                            <strong>{string.deleteRecordTxt}</strong>
                        </p>
                        <Button className='btn btn-primary large-btn' type='button' data-dismiss='modal' onClick={onDeleteEntry}>
                            {string.deleteBtnTxt}
                        </Button>
                    </ModalBody>
                </Modal>

                {/* VIEW SUBMISSION REQUEST MODEL */}
                <Modal toggle={toggleView} isOpen={viewOpen} className='request-modal common-model modal-lg submission-model customModal'>
                    <div className='common-modal-wrap'>
                        <ModalHeader toggle={toggleView} className='modal-center-Header justify-content-center title-profile'>
                            {string.submissionRequest.viewModalTitle}
                        </ModalHeader>
                        <ModalBody className='request-body-wrap'>
                            <div className='request-body d-flex submission-request-view-inputs justify-content-between'>
                                <div className='request-content half-card'>
                                    <h6 className='modal-sub-heading'>{string.submissionRequest.selectedProjectTitle}</h6>
                                    <Input type='text' className='requet-select' value={selectedSubmissionRequest.project_name} disabled={true} />
                                    <h6 className='modal-sub-heading mt-2'>{string.submissionRequest.group1Title}</h6>
                                    <Input type='text' className='requet-select' value={selectedSubmissionRequest.container_name} disabled={true} />
                                    <h6 className='modal-sub-heading mt-2'>{string.submissionRequest.selectedItemTitle}</h6>
                                    <Input type='text' className='requet-select' value={selectedSubmissionRequest.item_name} disabled={true} />
                                </div>
                                <div className='request-content half-card'>
                                    <div className='custom-checkbox request-btn half-card'>
                                        <h6 className='modal-sub-heading'>{string.submissionRequest.selectedEventType}</h6>
                                        <Input type='text' className='requet-select' value={selectedSubmissionRequest.event_type} disabled={true} />
                                    </div>
                                    <div className='custom-checkbox request-btn half-card'>
                                        <h6 className='modal-sub-heading'>{string.submissionRequest.selectedEventName}</h6>
                                        <Input type='text' className='requet-select' value={selectedSubmissionRequest.event_name} disabled={true} />
                                    </div>
                                </div>
                            </div>
                            <div className='request-body d-flex participant-custom-checkbox justify-content-between'>
                                <div className='request-content half-card'>
                                    <h6 className='modal-sub-heading'>{string.submissionRequest.submissionViewTitle}</h6>
                                    <div className='setting-card setting-content-wrap'>
                                        <div className='chekbox-wrap'>
                                            {selectedSubmissionRequest.selected_users &&
                                                selectedSubmissionRequest.selected_users.map((participant, i) => {
                                                    return (
                                                        <div key={i} className='custom-checkbox'>
                                                            <Checkbox checked={true} id={'participant_' + participant} value={participant} className='notification-check custom-control-input' disabled={true} />
                                                            <label className='custom-control-label' htmlFor={'participant_' + participant}>
                                                                {participant}
                                                            </label>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    </div>
                                </div>
                                {selectedSubmissionRequest.event_type == 'document' && (
                                    <div className='request-content half-card'>
                                        <h6 className='modal-sub-heading'>{string.submissionRequest.submissionAcceptTitle}</h6>
                                        <div className='setting-card setting-content-wrap'>
                                            <div className='chekbox-wrap'>
                                                {selectedSubmissionRequest.selected_doc_users &&
                                                    selectedSubmissionRequest.selected_doc_users.map((participant, i) => {
                                                        return (
                                                            <div key={i} className='custom-checkbox'>
                                                                <Checkbox checked={true} id={'participant_' + participant} value={participant} className='notification-check custom-control-input' disabled={true} />
                                                                <label className='custom-control-label' htmlFor={'participant_' + participant}>
                                                                    {participant}
                                                                </label>
                                                            </div>
                                                        )
                                                    })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className='request-body d-flex justify-content-between'>
                                <div className='half-card request-recipients'>
                                    <div className='recipients-header d-flex justify-content-between'>
                                        <h6 className='modal-sub-heading'>{string.submissionRequest.selectedRecipientTitle}</h6>
                                    </div>
                                    <div className='recipients-fliter-wrap'>
                                        <div className='setting-card selected-participants-list'>
                                            {selectedSubmissionRequest.selected_workers &&
                                                selectedSubmissionRequest.selected_workers.map((worker, i) => {
                                                    return (
                                                        <div key={i}>
                                                            <i className={`selected-participants-mark-${worker.submitted}`}></i>
                                                            <span>{worker.name} </span>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ModalBody>
                    </div>
                </Modal>
            </div>
        </div>
    )
}
export default withAuth(SendSubmissionRequest, { loginRequired: true })
