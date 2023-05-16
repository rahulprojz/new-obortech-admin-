import Link from 'next/link'
import CommentPopup from './CommentPopup'
import AcceptDocumentPopup from './AcceptDocumentPopup'
import string from '../../utils/LanguageTranslation.js'
import ConfirmAccept from './confirmAccept'
import { useState, useContext } from 'react'
import _ from 'lodash'
import moment from 'moment-timezone'
import { getLocalTime } from '../../utils/globalFunc'
import notify from '../../lib/notifier'
import EventPreview from './eventpreview'
import { fetchFormData } from '../../lib/api/formBuilder'
import { fetchAssets } from '../../lib/api/inventory-assets.js'
import useEventSelectOptionsGroup from '../../utils/customHooks/useEventSelectOptionsGroup'
import EventContext from '../../store/event/eventContext'
import { otherLanguage } from '../../utils/selectedLanguage'
import { alertEventsArr } from '../../utils/commonHelper'

const { _momentGetDiff, _momentGetEndDiff } = require('../../utils/globalFunc')

const DocumentEvent = ({
    project_event,
    project,
    created_by,
    projectSelections,
    createdAt,
    user,
    _seenDocument,
    _handleUserAction,
    acceptedDocument,
    seenDocument,
    commentOpen,
    setCommentOpen,
    _addComment,
    auth_user,
    _toggleHashView,
    toggleDocument,
    acceptOpen,
    setAcceptOpen,
    _updateProjectisViewed,
    allUsersAccepted,
    _handleModalEventsAction,
    networkDocuments,
}) => {
    const _toggleComment = (id) => {
        if (project_event.comments.length > 0) {
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

    const _toggleDocument = (id) => {
        setAcceptOpen(id)
        setCommentOpen(null)
    }

    const commentsLength = project_event.comments.length >= 1 ? project_event.comments.length : ''
    const currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss')

    let document_deadline = ''
    let isExpired = false
    let expiryDate = ''
    let allAccepted = allUsersAccepted ? true : false
    let allRejected = false
    let eventVisibility = true

    /*Event Visibility test*/
    if (user.id != auth_user.id && project_event.event?.eventType != 'alert') {
        let timedif = _momentGetDiff(currentDateTime, getLocalTime(project_event.createdAt), 'minutes')
        if (timedif < process.env.EVENT_DELAY_TIME) {
            eventVisibility = false
        } else {
            eventVisibility = true
        }
    }

    let canDelete = false

    //Show/hide delete button
    const createdMins = _momentGetDiff(currentDateTime, getLocalTime(project_event.createdAt), 'minutes')
    if (created_by == auth_user.id && parseInt(createdMins) < process.env.EVENT_DELAY_TIME) {
        if (!alertEventsArr.includes(project_event.event?.uniqId)) {
            canDelete = true
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
            expiryDate = `${total_diff_in_days > 0 ? `${total_diff_in_days}  ${string.emailmessages.days}` : ''} ${total_diff_in_days > 0 || diff_in_hours > 0 ? `${diff_in_hours}  ${string.emailmessages.hours}` : ''} ${total_diff_in_days == 0 ? `${diff_in_Mints} ${string.minutes}` : ''}`
            isExpired = false
        } else {
            isExpired = true
        }
    }

    /*If user id is not same but organization is same and viewedbyother organization is 0*/
    let isviewedbyother = ''
    if (project_event.comments.length > 0) {
        /*fetch the last index of project event comment array */
        let project_comment_arr = project_event.commentStatus
        let auth_usr_cmt_arr = project_comment_arr.filter((x) => x.user_id == auth_user.id)
        if (auth_usr_cmt_arr.length > 0 && auth_usr_cmt_arr[0].is_viewed == 0) {
            isviewedbyother = 'event-comment document-comment document-action-btn event-comment-black color_black'
        } else {
            isviewedbyother = 'event-comment document-comment document-action-btn'
        }
    } else {
        isviewedbyother = 'event-comment document-comment document-action-btn'
    }

    /*If any organization rejected the event*/
    const userWhoAccepts = project_event.document_accepted_users?.filter((val) => val?.is_rejected == 0)
    const isCurrentUserAccepted = project_event.document_accepted_users?.some((val) => val?.user_id == auth_user?.id && !Boolean(val?.is_rejected))
    const isCurrentUserRejected = project_event.document_accepted_users?.some((val) => {
        return val?.user_id == auth_user?.id && Boolean(val?.is_rejected)
    })
    const isEventRejected = project_event.document_accepted_users?.some((val) => val?.is_rejected)
    const userNotInAccept = project_event.event_accept_document_users?.some((val) => val?.user_id == auth_user?.id)

    let isacceptrejectuser = ''
    if (project_event.document_accepted_users.length > 0) {
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
    } else {
        isacceptrejectuser = ''
    }

    const [isacceptopen, setAcceptopen] = useState(false)
    const [userAction, setUserAction] = useState('accept')
    const [formData, setFormData] = useState([])
    const [previewFormData, setPreviewFormData] = useState([])
    const [formanswers, setFormAnswers] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [assetsData, setAssetsData] = useState([])
    const [orgAssetsData, setOrgAssetsData] = useState([])
    const [readOnly, setReadOnly] = useState(true)
    const { itemsNames, dispatchItemsNames, filterProjectSelection, updateAllStateAvailable, projectEventUsers } = useContext(EventContext)

    const _setAccepttoogle = () => {
        setAcceptopen(!isacceptopen)
    }

    const getimage = async () => {
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

    const changeReadOnly = (value) => {
        setAssetsData(orgAssetsData)
        setReadOnly(value)
    }

    const toggleEventPreview = () => {
        setReadOnly(true)
        setShowForm(false)
    }

    let canseeform = false
    if (project_event.projectEventAnswer.length > 0) {
        canseeform = true
    }
    const docPathKeys = project_event.attachment ? project_event.attachment.split('/') : []
    const docName = docPathKeys[docPathKeys.length - 1]

    const handleClick = (event_id, seenDocument) => {
        getimage()
        _seenDocument(event_id, seenDocument)
    }

    const onPreviewSubmit = (event) => {
        const selectionFiltration = projectSelections.project_selections.filter(filterProjectSelection)
        updateAllStateAvailable(selectionFiltration, 'item')
        if (itemsNames.selected.value == null) {
            dispatchItemsNames({ type: 'updateAvailable', payload: { available: useEventSelectOptionsGroup(project.project_selections, 'selection_items') } })
        }
        const selectedOption = _.filter(itemsNames.available, (item) => item.value == project_event.item_id)[0]
        dispatchItemsNames({ type: 'onSelect', payload: { selected: selectedOption } })
        const extraEventData = {
            eventType: 'document',
            uniqId: project_event?.event_id,
            event_category_id: project_event?.event_category_id,
            eventName: project_event.event_name,
            mongolianName: project_event.local_event_name,
            formId: project_event.form_id,
        }
        const updatedProjectEvent = { ...project_event, event: extraEventData }
        _handleModalEventsAction(event, updatedProjectEvent)
        setTimeout(() => {
            toggleDocument()
        })
    }
    const pdcEvent = networkDocuments.find(({ uniqId }) => project_event.event_id === uniqId)

    const eventName = otherLanguage && project_event?.local_event_name ? project_event?.local_event_name : project_event?.event_name

    return (
        <>
            {eventVisibility ? (
                <tr>
                    <td width='150' className='document-date'>
                        {getLocalTime(createdAt)}
                    </td>
                    <td className='document-org'>
                        {user.username}
                        <br />
                        {user.organization.name}
                    </td>
                    <td className='document-event'>
                        <b>{eventName}</b>
                        <br />
                        {project_event?.title}
                    </td>
                    <td className='document-name' style={{ wordBreak: 'break-all' }}>
                        {docName}
                    </td>
                    <td className={`document-docfile ${canDelete ? 'disabled-icon' : ''}`}>
                        {project_event.attachment ? (
                            <Link href={`/api/document/view/${project_event.event_submission_id}/${project_event.attachment}`}>
                                <a href={`/api/document/view/${project_event.event_submission_id}/${project_event.attachment}`} target='_blank' onClick={() => _seenDocument(project_event.event_submission_id, seenDocument)}>
                                    <i className='event-document' />
                                </a>
                            </Link>
                        ) : (
                            <a target='_blank' style={{ visibility: 'hidden' }}>
                                <i className='event-document' />
                            </a>
                        )}
                        {canseeform && (
                            <a
                                href='#'
                                onClick={(event) => {
                                    event.preventDefault()
                                    handleClick(project_event.event_submission_id, seenDocument)
                                }}
                            >
                                <i className='display_doc' />
                            </a>
                        )}
                    </td>
                    <td width='200' className={`document-user ${canDelete ? 'disabled-icon' : ''}`}>
                        {!project_event.document_seen_users || project_event.document_seen_users?.length == 0 ? (
                            string.event.noViewer
                        ) : (
                            <select className='form-control'>
                                {project_event.document_seen_users?.map((organization, i) => {
                                    const org = projectEventUsers.find((user) => user.organization_id == organization.organization_id)
                                    return <option key={i}>{org.organization?.name}</option>
                                })}
                            </select>
                        )}
                    </td>
                    <td className='action-menu'>
                        <div className={`comment-added document-actions-btns position-relative have-hiden-content ${canDelete ? 'disabled-icon' : ''}`} id={`comment${project_event._id}`}>
                            <i
                                className={isviewedbyother}
                                data-name={commentsLength}
                                onClick={() => {
                                    project.scrollable = document.getElementById(`comment${project_event._id}`)?.getBoundingClientRect().top < 400
                                    return _toggleComment(project_event._id)
                                }}
                            ></i>
                            {commentOpen === project_event._id && (
                                <CommentPopup
                                    toggle={(id) => _toggleComment(id)}
                                    comments={project_event.comments}
                                    _addComment={_addComment}
                                    project_event={project_event}
                                    project_event_id={project_event._id}
                                    item_id={project_event.item_id || ''}
                                    isOpen={commentOpen === project_event._id}
                                    customCSS={project.scrollable !== undefined && project.scrollable ? { left: '30px', top: '40px' } : { left: '30px', bottom: '5px' }}
                                    type='document'
                                    cssClasses={`small-action-popup documents text-left ${project.scrollable !== undefined && project.scrollable ? 'top-caret' : 'bottom-caret'}`}
                                />
                            )}
                            {project_event.event_type == 'document' ? (
                                <>
                                    <i
                                        className={`${
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
                                        } ${canDelete ? 'disabled-icon' : ''}`}
                                        onClick={() => {
                                            project.scrollable = document.getElementById(`comment${project_event._id}`)?.getBoundingClientRect().top < 400
                                            return _toggleDocument(project_event._id)
                                        }}
                                    />
                                    {acceptOpen === project_event._id && (
                                        <AcceptDocumentPopup
                                            isExpired={isExpired}
                                            expiryDate={expiryDate}
                                            allRejected={allRejected}
                                            allAccepted={allAccepted}
                                            toggle={(id) => _toggleDocument(id)}
                                            acceptreject={(val) => setUserAction(val)}
                                            // documentAcceptedUsers={project_event.acceptUsers}
                                            documentAcceptedUsers={project_event.document_accepted_users}
                                            event_type={pdcEvent.eventType}
                                            isacceptrejectuser={isacceptrejectuser}
                                            project_event_id={project_event.event_submission_id}
                                            project_event={project_event}
                                            user={auth_user}
                                            isOpen={acceptOpen === project_event._id}
                                            customCSS={project.scrollable !== undefined && project.scrollable ? { left: '65px', top: '40px', minWidth: '18em' } : { left: '65px', bottom: '5px', minWidth: '18em' }}
                                            toggleClose={_setAccepttoogle}
                                            cssClasses={`small-action-popup documents text-left ${project.scrollable !== undefined && project.scrollable ? 'top-caret' : 'bottom-caret'}`}
                                        />
                                    )}
                                </>
                            ) : (
                                <i className={'fa fa-check text-custom-hidden'}></i>
                            )}
                        </div>
                    </td>
                    <td className={`document-hash  ${canDelete ? 'disabled-icon' : ''}`}>
                        {project_event.attachment && (
                            <a style={{ cursor: 'pointer' }} onClick={() => _toggleHashView(project_event.file_hash)}>
                                {string.view}
                            </a>
                        )}
                    </td>
                </tr>
            ) : (
                ''
            )}
            {isacceptopen && (
                <ConfirmAccept
                    isacceptopen={isacceptopen}
                    // documentAcceptedUsers={project_event.acceptUsers}
                    documentAcceptedUsers={project_event.document_accepted_users}
                    _handleUserAction={_handleUserAction}
                    user={auth_user}
                    userAction={userAction}
                    item_id={project_event.item_id || ''}
                    project_event_id={project_event.event_submission_id}
                    toggleClose={_setAccepttoogle}
                    event_type={pdcEvent.eventType}
                    // acceptUserList={project_event?.acceptUsers || []}
                    acceptUserList={project_event?.event_accept_document_users || []}
                    event_name={project_event.event_name}
                />
            )}
            {showForm && (
                <EventPreview
                    project={project}
                    user_id={auth_user.id}
                    project_event={project_event}
                    showForm={showForm}
                    toggle={toggleEventPreview}
                    formData={formData}
                    previewFormData={previewFormData}
                    answer_data={formanswers}
                    assets={assetsData}
                    onPreviewSubmit={onPreviewSubmit}
                    readOnly={readOnly}
                    changeReadOnly={changeReadOnly}
                />
            )}
        </>
    )
}

export default DocumentEvent
