import Link from 'next/link'
import { useState, useContext } from 'react'
import _ from 'lodash'
import DeleteModal from '../common/DeleteModal'
import AcceptDocumentPopup from './AcceptDocumentPopup'
import BounceCircle from './BounceCircle'
import CommentPopup from './CommentPopup'
import string from '../../utils/LanguageTranslation.js'
import moment from 'moment-timezone'
import ConfirmAccept from './confirmAccept'
import ImageHoverPopup from './ImageHoverPopup'
import EventPreview from './eventpreview'
import { getLocalTime } from '../../utils/globalFunc'
import notify from '../../lib/notifier'
import { fetchFormData } from '../../lib/api/formBuilder'
import EventName from './EventName'
import OrganizationName from './OrganizationName'
import OrgApprovalModal from '../../components/events/OrgApprovalModal'
import EventContext from '../../store/event/eventContext'
import WatchAllEventContext from '../../store/watchAllEvent/watchAllEventContext'
import useEventSelectOptionsGroup from '../../utils/customHooks/useEventSelectOptionsGroup'
import useWatchAllEventSelectOptionsGroup from '../../utils/customHooks/useWatchAllEventSelectOptionsGroup'
import { fetchAssets } from '../../lib/api/inventory-assets.js'
import { fetchSelectionProject } from '../../lib/api/project'
import { otherLanguage } from '../../utils/selectedLanguage'
import ClockHoverTooltip from './clockHoverTooltip'
import Styled from 'styled-components'
import ActionButton from '../../components/common/ActionButton'
import { useSelector } from 'react-redux'
import { alertEventsArr } from '../../utils/commonHelper'

const TimeLineDiv = Styled.div`
.vertical-timeline-element-content::before {
  ${(props) => {
      if (props.step == 0 && props.hasSubEvents && props.isOpened) {
          return `
                height: 107% !important;
                top: 26px !important;
            `
      }
      if (props.step == 0) {
          return `
                height: 111% !important;
                top: 26px !important;
            `
      }

      if (props.step > 0 && !props.hasSubEvents && !props.isOpened) {
          return `
                height: 111% !important;
                top: 18px !important;
            `
      }
      if ((props.step > 0 && !props.hasSubEvents) || (props.step > 0 && props.hasSubEvents && props.isOpened)) {
          return `
                height: 102% !important;
                top: 26px !important;`
      }
      if (props.step > 0 && props.hasSubEvents && !props.isOpened) {
          return `
                height: 111% !important;
                top: 19px !important;`
      }
  }}
    ${(props) => !!props.ml && `margin-left: ${props.ml}px !important;`}
    ${(props) => props.isLastEvent && `display: none !important;`}
}
`

let timer
const { _momentGetDiff, _momentGetEndDiff, _momentCheckPastDate, getDateDiffText } = require('../../utils/globalFunc')

const EventType = ({
    isLastEvent = false,
    isEditableMode = true,
    project_event,
    id,
    user_id,
    created_by,
    _addComment,
    _seenDocument,
    _handleUserAction,
    seenDocument,
    canSeeDocument,
    user,
    _onDeleteEntry,
    auth_user,
    commentOpen,
    setCommentOpen,
    acceptOpen,
    setAcceptOpen,
    allUsersAccepted,
    _updateProjectisViewed,
    _fetchEvents,
    _handleModalEventsAction,
    toggleDocument,
    toggleEvent,
    project,
    watchall,
    checkTrue,
    canAccept,
    acceptedDocument,
    updateFilter,
    isPublicUser = false,
    isCollapsed = false,
    fetchSubEvents,
    subEvent,
    step,
    parent_id,
    hanldleCollapse,
    rootFolderPadding,
    handleIntegrity,
    activeIntegerity,
    showHiddenEvents,
}) => {
    // console.log(project_event)
    let bounceClass = 'bg-black black-fill'

    //Document events
    if (project_event.event?.eventType == 'document') {
        bounceClass = 'bg-yellow'
    }

    //Temperature event
    if (project_event.event?.uniqId == process.env.tempAlertEventId) {
        bounceClass = 'bg-blue'
    }

    //Humidity event
    if (project_event.event?.uniqId == process.env.humidityAlertEventId) {
        bounceClass = 'bg-violet'
    }

    //Container open
    if (project_event.event?.uniqId == process.env.sealOpenAlertEventId) {
        bounceClass = 'bg-red red-fill'
    }

    //Container close
    if (project_event.event?.uniqId == process.env.sealLockAlertEventId) {
        bounceClass = 'bg-red'
    }

    //Border in and out
    if (project_event.event?.uniqId == process.env.borderInEventId || project_event.event?.uniqId == process.env.borderOutEventid) {
        bounceClass = 'bg-black'
    }

    const [deleteIndex, setDeleteIndex] = useState(0)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [positionTop, setPositionTop] = useState(20)
    const [mouseOver, setMouseOver] = useState('')
    const [formData, setFormData] = useState([])
    const [previewFormData, setPreviewFormData] = useState([])
    const [formanswers, setFormAnswers] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [isOpenModal, setIsOpenModal] = useState(false)
    const [isOpened, setOpen] = useState(false)
    const [openTooltip, setOpenTooltip] = useState(false)
    const currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss')
    const [openTimeTooltip, setOpenTimeTooltip] = useState(false)
    const [assetsData, setAssetsData] = useState([])
    const [orgAssetsData, setOrgAssetsData] = useState([])
    const [readOnly, setReadOnly] = useState(true)
    // const acceptedDocument = project_event?.acceptUsers.filter((e) => e.accepted == true).length > 0
    const _deleteEvent = (id) => {
        _onDeleteEntry(deleteIndex)
    }

    const _toggleDelete = (id = null) => {
        setDeleteIndex(id)
        setDeleteOpen(!deleteOpen)
    }

    const _openApproveModal = () => {
        setIsOpenModal(true)
    }

    const changeReadOnly = (value) => {
        setAssetsData(orgAssetsData)
        setReadOnly(value)
    }

    const _toggleComment = (eid) => {
        /*Check if event comments is not null */
        if (project_event.comments.length > 0) {
            /*fetch the last index of project event comment array */
            let project_comment_arr = project_event.commentStatus
            let auth_usr_cmt_arr = project_comment_arr.filter((x) => x.user_id == auth_user.id)
            if (auth_usr_cmt_arr.length > 0 && auth_usr_cmt_arr[0].is_viewed == 0) {
                const data = {
                    event_submission_id: project_event.event_submission_id,
                    user_id: auth_user.id,
                    is_viewed: 1,
                }
                _updateProjectisViewed(data)
            }
        }

        setCommentOpen(id)
        setAcceptOpen(null)
    }
    const _openDocument = (e, id, attachment) => {
        const pageY = e.pageY
        if (attachment && mouseOver !== id) {
            timer = setTimeout(() => {
                const wh = window.innerHeight
                if (pageY < 300) {
                    setPositionTop(150)
                } else if (wh - pageY < 250) {
                    setPositionTop(-150)
                } else {
                    setPositionTop(0)
                }
                setMouseOver(id)
                setOpenTooltip(true)
            }, 600)
        }
    }

    const _closeDocument = () => {
        clearTimeout(timer)
        setOpenTooltip(false)
        setMouseOver('')
    }

    const _toggleDocument = (id) => {
        setAcceptOpen(id)
        setCommentOpen(null)
    }

    const toggleEventPreview = () => {
        setReadOnly(true)
        setShowForm(false)
    }

    let canDelete = false
    let canComment = false
    let isviewedbyother = ''
    let document_deadline = ''
    let isExpired = false
    let expiryDate = ''
    let allAccepted = allUsersAccepted ? true : false
    let allRejected = false
    let eventVisibility = true

    /*Event Visibility test*/
    if (created_by != auth_user.id && project_event.event?.eventType != 'alert') {
        let timedif = _momentGetDiff(currentDateTime, getLocalTime(project_event.createdAt), 'minutes')
        if (timedif < process.env.EVENT_DELAY_TIME) {
            eventVisibility = false
        } else {
            eventVisibility = true
        }
    }

    /*Add document event deadline*/
    if (project_event.document_deadline != null && project_event.document_deadline != '') {
        document_deadline = project_event.document_deadline
        let createdAt = getLocalTime(project_event.createdAt)
        document_deadline = moment(createdAt).add(document_deadline, 'hours').format('YYYY-MM-DD HH:mm:ss')
        if (new Date(document_deadline) > new Date(currentDateTime)) {
            let hours = _momentGetEndDiff(currentDateTime, document_deadline, 'hours')
            let minutes = _momentGetEndDiff(currentDateTime, document_deadline, 'minutes')
            let total_diff_in_days = Math.floor(hours / 24)
            let diff_in_hours = Math.floor(hours - total_diff_in_days * 24)
            let diff_in_Mints = Math.floor(minutes - hours * 60)
            // expiryDate = `${total_diff_in_days > 0 ? `${total_diff_in_days}  ${string.emailmessages.days}` : ''} ${diff_in_hours > 0 ? `${diff_in_hours}  ${string.emailmessages.hours}` : ''} ${total_diff_in_days == 0 ? `${diff_in_Mints} ${string.minutes}` : ''}`
            expiryDate = `${total_diff_in_days > 0 ? `${total_diff_in_days}  ${string.emailmessages.days}` : ''} ${total_diff_in_days > 0 || diff_in_hours > 0 ? `${diff_in_hours}  ${string.emailmessages.hours}` : ''} ${total_diff_in_days == 0 ? `${diff_in_Mints} ${string.minutes}` : ''}`

            isExpired = false
        } else {
            isExpired = true
        }
    }

    /*If user id is not same but organization is same and viewedbyother organization is 0*/
    if (project_event.comments.length > 0) {
        /*fetch the last index of project event comment array */
        let project_comment_arr = project_event.commentStatus
        let auth_usr_cmt_arr = project_comment_arr.filter((x) => x.user_id == auth_user.id)
        if (auth_usr_cmt_arr.length > 0 && auth_usr_cmt_arr[0].is_viewed == 0) {
            isviewedbyother = 'event-comment-black color_black'
        } else {
            isviewedbyother = 'event-comment'
        }
    } else {
        isviewedbyother = 'event-comment'
    }
    const userWhoAccepts = project_event.document_accepted_users?.filter((val) => val?.is_rejected == 0)
    const isCurrentUserAccepted = project_event.document_accepted_users?.some((val) => val?.user_id == auth_user?.id && !Boolean(val?.is_rejected))
    const isCurrentUserRejected = project_event.document_accepted_users?.some((val) => {
        return val?.user_id == auth_user?.id && Boolean(val?.is_rejected)
    })
    const isEventRejected = project_event.document_accepted_users?.some((val) => val?.is_rejected)
    const userNotInAccept = project_event.event_accept_document_users?.some((val) => val?.user_id == auth_user?.id)

    /*If any organization rejected the event*/
    let isacceptrejectuser = ''
    if (project_event.document_accepted_users?.length > 0) {
        let project_doc_accepted_users = project_event.document_accepted_users
        let rejectedUsers = project_doc_accepted_users.filter((x) => x.is_rejected == 1)

        if (project_event.event_accept_document_users.length == rejectedUsers.length) {
            allRejected = true
        }

        if (project_event.document_accepted_users.length === project_event.event_accept_document_users.length) {
            if (isEventRejected) {
                isacceptrejectuser = 'doc-one-rejects'
            }
            if (userWhoAccepts.length === project_event.event_accept_document_users.length) {
                isacceptrejectuser = 'doc-all-accepted'
            }
        }

        if (rejectedUsers.length > 0 && isCurrentUserRejected) {
            isacceptrejectuser = 'doc-one-rejects'
        } else if (rejectedUsers.length > 0 && isCurrentUserAccepted) {
            isacceptrejectuser = 'doc-one-rejects'
        } else if (rejectedUsers.length > 0 && !userNotInAccept && isEventRejected) {
            isacceptrejectuser = 'doc-one-rejects'
        } else if (rejectedUsers.length > 0) {
            isacceptrejectuser = 'event-rejected'
        }

        //Hide all rejected events from public users
        if (isPublicUser && rejectedUsers.length) {
            eventVisibility = false
        }
    } else {
        isacceptrejectuser = ''
    }

    //Show/hide delete button
    const createdMins = _momentGetDiff(currentDateTime, getLocalTime(project_event.createdAt), 'minutes')
    if (created_by == auth_user.id && parseInt(createdMins) < process.env.EVENT_DELAY_TIME) {
        if (!alertEventsArr.includes(project_event.event?.uniqId)) {
            canDelete = true
        }
    }

    if (project_event.event?.eventType == 'document' && canSeeDocument) {
        canComment = true
    } else if (project_event.event?.eventType == 'event' && project_event.event_category_id != process.env.ALERT_EVENTS_CATEGORY) {
        canComment = true
    }

    let acceptBtnClass = 'doc-not-accepted'
    if (allUsersAccepted) {
        acceptBtnClass = 'doc-all-accepted'
    }

    const { itemsNames, selectedItem, dispatchItemsNames, filterProjectSelection, updateAllStateAvailable, advanceFilterSelection } = useContext(EventContext)
    const {
        dispatchProjectNames,
        itemsNames: watchAllItemsNames,
        selectedItem: watchAllSelectedItem,
        dispatchItemsNames: watchAllDispatchItemsNames,
        filterProjectSelection: watchAllFilterProjectSelection,
        updateAllStateAvailable: watchAllUpdateAllStateAvailable,
        advanceFilterSelection: wAdvanceFilterSelection,
    } = useContext(WatchAllEventContext)

    const commentsLength = project_event.comments.length >= 1 ? project_event.comments.length : ''
    const [isacceptopen, setAcceptopen] = useState(false)
    const [userAction, setUserAction] = useState('accept')

    const _setAccepttoogle = () => {
        setAcceptopen(!isacceptopen)
    }

    const previewForm = async () => {
        if (project_event.projectEventAnswer[0]) {
            const { form_id, form_data } = project_event.projectEventAnswer[0]
            const previewData = form_data ? JSON.parse(form_data) : await fetchFormData(form_id)
            if (form_id) {
                const response = await fetchFormData(form_id)
                if (response.length > 0) {
                    if (response.some((i) => i.element.includes('Asset'))) {
                        let assetList = await fetchAssets({ isInventory: true })
                        assetList = assetList.map((assetData) => ({ ...assetData, quantity: assetData.assets_quantity ? assetData.assets_quantity.available_quantity : 0 }))
                        setOrgAssetsData(assetList)
                        const answerData = JSON.parse(project_event.projectEventAnswer[0].answers)
                        setAssetsData(
                            [].concat
                                .apply(
                                    [],
                                    answerData.map((data) => data.value),
                                )
                                .filter((i) => i),
                        )
                    }
                    setFormData(response)
                    setPreviewFormData(previewData)
                    setFormAnswers(project_event.projectEventAnswer[0].answers)
                    setShowForm(true)
                } else {
                    notify(string.event.formBuilderNotAvail)
                }
            } else {
                setFormData([])
                setPreviewFormData([])
                setShowForm(true)
            }
        } else {
            setFormData([])
            setPreviewFormData([])
            setShowForm(true)
        }
    }

    let canseeform = false
    if (project_event.projectEventAnswer.length > 0) {
        canseeform = true
    }
    let didApprove = true
    if (user?.organization_id != auth_user.organization_id) {
        if (!user?.organization?.organization_approvals?.find((ap) => ap.approved_by == auth_user.organization_id)) {
            didApprove = false
        }
    }

    const onPreviewSubmit = async (event) => {
        if (watchall) {
            const selectionFiltration = project.map((proj) => proj.project_selections?.filter(watchAllFilterProjectSelection))
            watchAllUpdateAllStateAvailable(selectionFiltration, 'item')

            dispatchProjectNames({ type: 'updateAvailable', payload: { available: useWatchAllEventSelectOptionsGroup(project, 'selection_project', 'selection_project') } })
            if (watchAllItemsNames.selected?.value == null) {
                watchAllDispatchItemsNames({
                    type: 'updateAvailable',
                    payload: {
                        available: useWatchAllEventSelectOptionsGroup(
                            project.map((proj) => proj.project_selections),
                            'selection_items',
                            'selectionsOnly',
                        ),
                    },
                })
            }
            watchAllDispatchItemsNames({ type: 'onSelect', payload: { selected: _.find(watchAllItemsNames.available, (item) => item.value == project_event.item_id) } })
        } else {
            const projectSelection = await fetchSelectionProject({ project_id: project.id })
            const selectionFiltration = projectSelection.project_selections.filter(filterProjectSelection)
            updateAllStateAvailable(selectionFiltration, 'item')
            if (itemsNames.selected?.value == null) {
                dispatchItemsNames({ type: 'updateAvailable', payload: { available: useEventSelectOptionsGroup(project.project_selections, 'selection_items') } })
            }
            dispatchItemsNames({ type: 'onSelect', payload: { selected: _.find(itemsNames.available, (item) => item.value == project_event.item_id) } })
        }
        _handleModalEventsAction(event, project_event)
        localStorage.setItem('resubmitId', project_event._id)
        setTimeout(() => {
            if (project_event.event.eventType === 'event') {
                toggleEvent()
            } else if (project_event.event.eventType === 'document') {
                toggleDocument()
            }
        })
    }

    const renderClockIcon = () => {
        let date_Status = true
        if (project_event.due_date?.indexOf('0001-01-01') > -1) {
            date_Status = false
        }
        const actionTime = getLocalTime(project_event.due_date)
        const isPastDate = _momentCheckPastDate(actionTime)
        const isEvent = project_event.event.eventType === 'event'
        let dateDiffText = ''
        const { dateDiff, dateFormat } = getDateDiffText(actionTime, new Date(), isPastDate)
        if (dateDiff) {
            dateDiffText = `${dateDiff} ${dateFormat}${dateDiff > 1 ? 's' : ''} ${isPastDate ? 'ago' : 'left'}`
        }
        return (
            <>
                <div className='action-date' id={`action-date-${id}`} style={{ visibility: date_Status && !!project_event.due_date && isEvent ? 'visible' : 'hidden' }}>
                    <i className={`${isPastDate ? 'past-clock' : 'clock'}`} onMouseOver={(e) => setOpenTimeTooltip(true)}></i>
                </div>
                {openTimeTooltip && <ClockHoverTooltip id={id} openTooltip={openTimeTooltip} setOpenTooltip={setOpenTimeTooltip} actionTime={actionTime} dateDiffText={dateDiffText} isPastDate={isPastDate} />}
            </>
        )
    }

    const getMargin = () => {
        if (subEvent && project_event.has_sub_events && isOpened) {
            return step >= 2 ? 20 : 20 * Math.floor(step)
        }
    }
    const handleIntegrityCheck = (project_event) => {
        let integrityIcon = `fa fa-refresh`
        if (activeIntegerity?._id === project_event?._id) {
            integrityIcon = 'fas fa-sync fa-spin'
        }
        if (canDelete || (activeIntegerity !== null && activeIntegerity?._id !== project_event?._id)) {
            integrityIcon = 'fa fa-refresh text-muted disable'
        }
        return integrityIcon
    }

    const integrityIcon = handleIntegrityCheck(project_event)
    return (
        <TimeLineDiv
            step={step}
            isOpened={isOpened}
            hasSubEvents={project_event.has_sub_events}
            isLastEvent={project_event.has_sub_events ? isLastEvent && !isOpened : isLastEvent}
            ml={getMargin()}
            className={`vertical-timeline-item vertical-timeline-element ${project_event.has_sub_events ? 'has-sub-events ' : ''} ${project_event.checked ? 'project-event-selected' : ''}`}
            key={id}
        >
            {eventVisibility && (showHiddenEvents || !project_event?.hiddenEvent) ? (
                <div>
                    <OrganizationName project_event={project_event} user={user} openApproveModal={_openApproveModal} created_by={created_by} id={id} didApprove={didApprove} auth_user={auth_user} />
                    <BounceCircle
                        rootFolderPadding={rootFolderPadding}
                        hanldleCollapse={hanldleCollapse}
                        isCollapsed={isCollapsed}
                        isOpened={isOpened}
                        setOpen={setOpen}
                        project_event={project_event}
                        eventCategory={project_event.event_category_id}
                        className={bounceClass}
                        fetchSubEvents={fetchSubEvents}
                        subEvent={subEvent}
                        step={step}
                    />
                    <div className='vertical-timeline-element-content row'>
                        <EventName project_event={project_event} subEvent={subEvent} />
                        <div className='col-sm-4'>
                            {/* {!!project_event.due_date && (
                                <div className={`text-left d-flex position-relative ${isPublicUser ? 'public-due-date' : otherLanguage ? 'local-due-date' : 'due-date'}`} style={{ fontSize: '14px' }}>
                                    <b className='flex-shrink-0 mr-2'>{`${string.dueDate}: `}</b>
                                    <span className='flex-shrink-0'>{getLocalTime(project_event.due_date)}</span>
                                </div>
                            )} */}
                            <div className='action-menu d-flex justify-content-start align-items-center'>
                                {renderClockIcon()}
                                {mouseOver && mouseOver === id && <ImageHoverPopup project_event={project_event} positionTop={positionTop} id={id} openTooltip={openTooltip} setOpenTooltip={setOpenTooltip} />}
                                {!isPublicUser && (watchall ? wAdvanceFilterSelection.value == 'hideEvents' : advanceFilterSelection.value == 'hideEvents') && step == 0 && (
                                    <div>
                                        <input
                                            className='event-checkbox'
                                            type='checkbox'
                                            onChange={(e) => {
                                                project_event.checked = !project_event.checked
                                                updateFilter()
                                            }}
                                            checked={checkTrue || !!project_event.checked}
                                        />
                                    </div>
                                )}
                                <div className={`document-attached ${canDelete ? 'disabled-icon' : ''}`} id={`document-attached-${id}`} onMouseOver={(e) => _openDocument(e, id, project_event.attachment)} onMouseOut={() => _closeDocument()}>
                                    {project_event.attachment ? (
                                        <Link href={`/api/document/view/${project_event.event_submission_id}/${project_event.attachment}`}>
                                            {project_event.event_type == 'document' ? (
                                                <>
                                                    {canSeeDocument ? (
                                                        <a
                                                            href={`/api/document/view/${project_event.event_submission_id}/${project_event.attachment}`}
                                                            target='_blank'
                                                            onClick={() => {
                                                                _seenDocument(project_event.event_submission_id, seenDocument)
                                                            }}
                                                        >
                                                            <i className='event-document'></i>
                                                        </a>
                                                    ) : (
                                                        <i className='fa fa-camera text-custom-hidden'></i>
                                                    )}
                                                </>
                                            ) : (
                                                <a target='_blank'>
                                                    <i className='event-camera'></i>
                                                </a>
                                            )}
                                        </Link>
                                    ) : (
                                        <i className={'fa fa-camera text-custom-hidden'}></i>
                                    )}
                                </div>
                                {/* DYNAMIC FORM PREVIEW */}
                                <div className={`display_document_div ${canDelete ? 'disabled-icon' : ''}`}>{canseeform ? <i onClick={() => previewForm()} className='display_doc'></i> : <i className='fa fa-camera text-custom-hidden'></i>}</div>
                                {/* COMMENTS */}
                                {isEditableMode && !isPublicUser && (
                                    <div className={`comment-added position-relative have-hiden-content ${canDelete ? 'disabled-icon' : ''}`} id={`comment${id}`}>
                                        {canComment && !subEvent ? (
                                            <>
                                                <i
                                                    className={isviewedbyother}
                                                    data-name={commentsLength}
                                                    onClick={() => {
                                                        project.scrollable = document.getElementById(`comment${id}`)?.getBoundingClientRect().top < 500
                                                        return _toggleComment(project_event._id)
                                                    }}
                                                />
                                                {commentOpen === id && (
                                                    <CommentPopup
                                                        toggle={(id) => setCommentOpen(id)}
                                                        project={project}
                                                        comments={project_event.comments}
                                                        _addComment={_addComment}
                                                        parent_id={parent_id}
                                                        project_event={project_event}
                                                        project_event_id={project_event._id}
                                                        item_id={project_event.item_id || ''}
                                                        isOpen={commentOpen === id}
                                                        type={project_event.event.eventType}
                                                        customCSS={project.scrollable !== undefined && project.scrollable ? { left: '30px', top: '40px' } : { left: '30px', bottom: '35px' }}
                                                        cssClasses={`small-action-popup documents text-left ${project.scrollable !== undefined && project.scrollable ? 'top-caret' : 'bottom-caret'}`}
                                                    />
                                                )}
                                            </>
                                        ) : (
                                            <i className={'fa fa-camera text-custom-hidden'}></i>
                                        )}
                                    </div>
                                )}
                                {/* ACCEPT DOCUMENT ONLY FOR DOCUMENT EVENTS */}
                                <div className={`accepted-sec position-relative have-hiden-content ${canDelete ? 'disabled-icon' : ''}`} id={`acceptDocs${id}`}>
                                    {project_event.event?.eventType == 'document' || (project_event.event?.eventType == 'event' && canSeeDocument) ? (
                                        <>
                                            <i
                                                // className={`${acceptBtnClass} ${isacceptrejectuser}`}
                                                className={
                                                    project_event.event_accept_document_users.length === project_event.document_accepted_users.length
                                                        ? `doc-not-accepted document-accept document-action-btn  ${isacceptrejectuser}`
                                                        : !userNotInAccept && isEventRejected
                                                        ? 'doc-one-rejects'
                                                        : isCurrentUserRejected
                                                        ? 'doc-one-rejects'
                                                        : isEventRejected && !isCurrentUserRejected
                                                        ? `event-others-rejected ${isacceptrejectuser}`
                                                        : isCurrentUserAccepted
                                                        ? 'doc-accepted-common'
                                                        : !userNotInAccept
                                                        ? 'not-in-accept'
                                                        : acceptedDocument
                                                        ? `doc-not-accepted document-accept document-accept document-action-btn ${isacceptrejectuser}`
                                                        : `doc-not-accepted document-accept document-action-btn ${isacceptrejectuser}`
                                                }
                                                onClick={() => {
                                                    if (!canDelete) {
                                                        project.scrollable = document.getElementById(`acceptDocs${id}`)?.getBoundingClientRect().top < 500
                                                        return _toggleDocument(id)
                                                    }
                                                }}
                                            />
                                            {acceptOpen === id && (
                                                <AcceptDocumentPopup
                                                    isEditableMode={isEditableMode}
                                                    project={project}
                                                    isExpired={isExpired}
                                                    expiryDate={expiryDate}
                                                    allRejected={allRejected}
                                                    allAccepted={allAccepted}
                                                    toggle={(id) => _toggleDocument(id)}
                                                    acceptreject={(val) => setUserAction(val)}
                                                    documentAcceptedUsers={project_event.document_accepted_users || []}
                                                    isacceptrejectuser={isacceptrejectuser}
                                                    parent_id={parent_id}
                                                    project_event={project_event}
                                                    project_event_id={project_event.event_submission_id}
                                                    user={auth_user}
                                                    isOpen={acceptOpen === id}
                                                    subEvent={subEvent}
                                                    toggleClose={_setAccepttoogle}
                                                    customCSS={project.scrollable !== undefined && project.scrollable ? { left: '28px', top: '40px' } : { left: '27px', bottom: '33px' }}
                                                    cssClasses={`small-action-popup documents text-left ${project.scrollable !== undefined && project.scrollable ? 'top-caret' : 'bottom-caret'}`}
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <i className={'fa fa-check text-custom-hidden'}></i>
                                    )}
                                </div>
                                <ActionButton activeItem={project_event} icon={integrityIcon} width={30} title='Check Integrity' onClick={() => handleIntegrity(project_event)} />
                                {/* Delete button should be visible to admin only, will be removed after 5 mins if not admin */}
                                {isEditableMode && (
                                    <div className='delete-sec'>
                                        {canDelete && !subEvent ? (
                                            <i
                                                onClick={() => {
                                                    _toggleDelete(project_event.event_submission_id)
                                                }}
                                                className='event-delete'
                                            ></i>
                                        ) : (
                                            <i className={'event-delete text-custom-hidden'}></i>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                ''
            )}
            <DeleteModal
                isOpen={deleteOpen}
                toggle={() => {
                    _toggleDelete()
                }}
                onDeleteEntry={() => {
                    _deleteEvent()
                }}
            />
            {isacceptopen && (
                <ConfirmAccept
                    isacceptopen={isacceptopen}
                    // documentAcceptedUsers={project_event.acceptUsers}
                    documentAcceptedUsers={project_event.document_accepted_users}
                    _handleUserAction={_handleUserAction}
                    user={auth_user}
                    userAction={userAction}
                    parent_id={parent_id}
                    project_event_id={project_event.event_submission_id}
                    item_id={project_event.item_id || ''}
                    toggleClose={_setAccepttoogle}
                    event_type={project_event.event.eventType}
                    // acceptUserList={project_event?.acceptUsers || []}
                    acceptUserList={project_event?.event_accept_document_users || []}
                    event_name={project_event.event_name}
                />
            )}
            {/* show preview form */}
            {showForm && (
                <EventPreview
                    project={project}
                    user_id={auth_user.id}
                    isEditableMode={isEditableMode}
                    showForm={showForm}
                    readOnly={readOnly}
                    changeReadOnly={changeReadOnly}
                    toggle={toggleEventPreview}
                    formData={formData}
                    previewFormData={previewFormData}
                    answer_data={formanswers}
                    assets={assetsData}
                    project_event={project_event}
                    onPreviewSubmit={onPreviewSubmit}
                    subEvent={subEvent}
                    watchall={watchall}
                />
            )}
            {isOpenModal && <OrgApprovalModal isOpen={isOpenModal} user={user} didApprove={didApprove} onToggle={() => setIsOpenModal(false)} auth_user={auth_user} onFetchEvents={_fetchEvents} />}
        </TimeLineDiv>
    )
}

export default EventType
