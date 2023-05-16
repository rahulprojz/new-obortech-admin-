import Link from 'next/link'
import { useState } from 'react'
import moment from 'moment-timezone'
import DeleteModal from '../common/DeleteModal'
import AcceptDocumentPopup from './AcceptDocumentPopup'
import BounceCircle from './BounceCircle'
import CommentPopup from './CommentPopup'
import CircleHoverPopup from './CircleHoverPopup'
import string from '../../utils/LanguageTranslation.js'
import ConfirmAccept from './confirmAccept'
import ImageHoverPopup from './ImageHoverPopup'
import EventPreview from './eventpreview'
import notify from '../../lib/notifier'
import { getLocalTime } from '../../utils/globalFunc'

import { fetchFormData } from '../../lib/api/formBuilder'
import { fetchAssets } from '../../lib/api/inventory-assets.js'

const { _momentGetDiff, _momentGetEndDiff } = require('../../utils/globalFunc')

const EventTypeLabel = ({
    keylabel,
    acceptedDocument,
    project_event,
    createdAt,
    id,
    user_id,
    created_by,
    _addComment,
    _seenDocument,
    _acceptDocument,
    seenDocument,
    canSeeDocument,
    user,
    _onDeleteEntry,
    auth_user,
    commentOpen,
    setCommentOpen,
    acceptOpen,
    setAcceptOpen,
    circlePopupOpen,
    setCirclePopupOpen,
    allUsersAccepted,
    _updateProjectisViewed,
}) => {
    if (typeof window === 'undefined') {
        return null
    }

    let bounceClass = 'bg-black black-fill'
    let timer
    // Document events
    if (project_event.event?.type == 'document') {
        bounceClass = 'bg-yellow'
    }

    // Temperature event
    if (project_event.event?.id == process.env.tempAlertEventId) {
        bounceClass = 'bg-blue'
    }

    // Humidity event
    if (project_event.event?.id == process.env.humidityAlertEventId) {
        bounceClass = 'bg-violet'
    }

    // Container open
    if (project_event.event?.id == process.env.sealOpenAlertEventId) {
        bounceClass = 'bg-red red-fill'
    }

    // Container close
    if (project_event.event?.id == process.env.sealLockAlertEventId) {
        bounceClass = 'bg-red'
    }

    // Border in and out
    if (project_event.event?.id == process.env.borderInEventId || project_event.event?.id == process.env.borderOutEventid) {
        bounceClass = 'bg-black'
    }

    const [deleteIndex, setDeleteIndex] = useState(0)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [positionTop, setPositionTop] = useState(20)
    const [mouseOver, setMouseOver] = useState('')
    const [mouseOverAttachment, setMouseOverAttachment] = useState('')
    const [formData, setFormData] = useState([])
    const [previewFormData, setPreviewFormData] = useState([])
    const [formanswers, setFormAnswers] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [assetsData, setAssetsData] = useState([])
    const [orgAssetsData, setOrgAssetsData] = useState([])
    const [readOnly, setReadOnly] = useState(true)

    const currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss')

    const _deleteEvent = (id) => {
        _onDeleteEntry(deleteIndex)
    }

    const _toggleDelete = (id = null) => {
        setDeleteIndex(id)
        setDeleteOpen(!deleteOpen)
    }

    const _toggleComment = (id) => {
        /* Check if event comments is not null */
        if (project_event.project_event_comments.length > 0) {
            /* fetch the last index of project event comment array */
            const project_comment_arr = project_event.project_comment_statuses
            const auth_usr_cmt_arr = project_comment_arr.filter((x) => x.user_id == auth_user.id)
            if (auth_usr_cmt_arr.length > 0 && auth_usr_cmt_arr[0].is_viewed === 0) {
                const data = {
                    id,
                    user_id: auth_user.id,
                    is_viewed: 1,
                }
                _updateProjectisViewed(data)
            }
        }

        setCommentOpen(id)
        setAcceptOpen(null)
    }

    const _openCircle = (e, id) => {
        setCirclePopupOpen(id)
        const wh = window.innerHeight
        if (wh - e.pageY < 190) {
            setPositionTop(-185)
        } else {
            setPositionTop(22)
        }
    }

    const _closeCircle = () => {
        setCirclePopupOpen(null)
    }

    const _openDocument = (e, id, attachment) => {
        if (attachment && mouseOver !== id) {
            timer = setTimeout(() => {
                setMouseOver(id)
                setMouseOverAttachment(attachment)
            }, 500)
        }
    }

    const _closeDocument = () => {
        clearTimeout(timer)
        setMouseOver('')
    }

    const _toggleDocument = (id) => {
        setAcceptOpen(id)
        setCommentOpen(null)
    }

    // Event name, Show road name with border events
    let eventName = (
        <h4 style={{ cursor: 'pointer' }} className='timeline-title'>
            {project_event.event.name}
        </h4>
    )
    if (project_event.event.id == process.env.borderInEventId || project_event.event.id == process.env.borderOutEventid) {
        eventName = (
            <h4 style={{ cursor: 'pointer' }} className='timeline-title'>
                {project_event.event.name}: {project_event.station.name}
            </h4>
        )
    }

    let canDelete = false
    let canComment = false
    let isviewedbyother = ''
    let document_deadline = ''
    let expiredtext = ''
    let eventVisibility = true

    /* Event Visibility test */
    if (user_id != auth_user.id && project_event.event?.type != 'alert') {
        const timedif = _momentGetDiff(currentDateTime, getLocalTime(project_event.createdAt), 'minutes')
        if (timedif < process.env.EVENT_DELAY_TIME) {
            eventVisibility = false
        } else {
            eventVisibility = true
        }
    }

    /* Add document event deadline */
    if (project_event.document_deadline != null && project_event.document_deadline != '') {
        const org_accepted = project_event.document_accepted_users.filter((x) => x.organization_id == auth_user.organization_id)
        document_deadline = project_event.document_deadline
        const createdAt = getLocalTime(project_event.createdAt)
        document_deadline = moment(createdAt).add(document_deadline, 'hours').format('YYYY-MM-DD HH:mm:ss')
        if (org_accepted.length === 0 && new Date(document_deadline) > new Date(currentDateTime)) {
            const hours = _momentGetEndDiff(currentDateTime, document_deadline, 'hours')
            const total_diff_in_days = Math.floor(hours / 24)
            const diff_in_hours = Math.floor(hours - total_diff_in_days * 24)
            expiredtext = `${total_diff_in_days} ${string.emailmessages.days} ${diff_in_hours} ${string.emailmessages.hours}`
        } else if (org_accepted.length > 0) {
            expiredtext = string.acceptedtext
        } else {
            expiredtext = string.expiredtext
        }
    }

    /* If user id is not same but organization is same and viewedbyother organization is 0 */
    if (project_event.project_event_comments.length > 0) {
        /* fetch the last index of project event comment array */
        const project_comment_arr = project_event.project_comment_statuses
        const auth_usr_cmt_arr = project_comment_arr.filter((x) => x.user_id == auth_user.id)
        if (auth_usr_cmt_arr.length > 0 && auth_usr_cmt_arr[0].is_viewed === 0) {
            isviewedbyother = 'event-comment-black color_black'
        } else {
            isviewedbyother = 'event-comment'
        }
    } else {
        isviewedbyother = 'event-comment'
    }

    /* If organization rejected the event */
    let isacceptrejectuser = ''
    if (project_event.document_accepted_users.length > 0) {
        /* fetch the last index of project event comment array */
        const project_doc_accepted_users = project_event.document_accepted_users
        const auth_org_arr = project_doc_accepted_users.filter((x) => x.organization_id == auth_user.organization_id)
        if (auth_org_arr.length > 0 && auth_org_arr[0].is_rejected == '0') {
            isacceptrejectuser = 'event-rejected'
        } else if (auth_org_arr.length > 0 && auth_org_arr[0].is_rejected == '1') {
            isacceptrejectuser = 'event-accepted'
        }
    } else {
        isacceptrejectuser = ''
    }
    // Show/hide delete button
    const createdMins = _momentGetDiff(currentDateTime, getLocalTime(project_event.updatedAt), 'minutes')
    if (created_by == auth_user.organization_id && parseInt(createdMins) < process.env.EVENT_DELAY_TIME) {
        canDelete = true
    }

    if (project_event.event.type == 'document' && canSeeDocument) {
        canComment = true
    } else if (project_event.event.type == 'event' && project_event.event_category_id != process.env.ALERT_EVENTS_CATEGORY) {
        canComment = true
    }

    let acceptBtnClass = 'doc-not-accepted'
    if (allUsersAccepted) {
        acceptBtnClass = 'doc-all-accepted'
    } else if (acceptedDocument) {
        acceptBtnClass = 'doc-accepted'
    }

    const commentsLength = project_event.project_event_comments.length >= 1 ? project_event.project_event_comments.length : ''

    const [isacceptopen, setAcceptopen] = useState(false)
    const [isrejectaccept, setRejectAccept] = useState('accept')

    const _setAccepttoogle = () => {
        setAcceptopen(!isacceptopen)
    }

    const getimage = async () => {
        if (project_event.project_event_answers[0]) {
            const {form_id, form_data} = project_event.project_event_answers[0]
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
                            [].concat.apply(
                                [],
                                answerData.map((data) => data.value),
                            ).filter(i =>i),
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
    if (project_event.project_event_answers.length > 0) {
        canseeform = true
    }

    return (
        <div className='vertical-timeline-item vertical-timeline-element' key={id}>
            {eventVisibility ? (
                <div>
                    <span className='vertical-timeline-element-date'>
                        {project_event.event_category_id == process.env.ALERT_EVENTS_CATEGORY ? (
                            <label>{string.compName}</label>
                        ) : (
                            <label
                                onMouseOver={(e) => {
                                    _openCircle(e, id)
                                }}
                                onMouseOut={() => {
                                    _closeCircle()
                                }}
                            >
                                {created_by == 0 ? string.compName : user == null ? string.compName : user.organization.name}
                            </label>
                        )}
                        {circlePopupOpen === id && <CircleHoverPopup positionTop={positionTop} user={user} />}
                    </span>
                    <BounceCircle eventCategory={project_event.event_category_id} className={bounceClass} />
                    <div className='vertical-timeline-element-content row'>
                        <div className='list-content col-sm-6 pl-0'>
                            {eventName}
                            <p className='event-date'>{getLocalTime(project_event.createdAt, 'YYYY-MM-DD HH:mm:ss')}</p>
                        </div>
                        <div className='action-menu col-sm-5 d-flex justify-content-start align-items-center'>
                            {mouseOver === id && <ImageHoverPopup positionTop={positionTop} user={user} id={id} />}
                            <div className='document-attached' onMouseOver={(e) => _openDocument(e, id, project_event.attachment)} onMouseOut={() => _closeDocument()}>
                                {project_event.attachment ? (
                                    <Link href={`/api/document/view/${project_event.event_submission_id}/${project_event.attachment}`}>
                                        {project_event.event.type == 'document' ? (
                                            <>
                                                {canSeeDocument ? (
                                                    <a href={`/api/document/view/${project_event.event_submission_id}/${project_event.attachment}`} target='_blank' onClick={() => _seenDocument(project_event._id, seenDocument)}>
                                                        <i className='event-document' />
                                                    </a>
                                                ) : (
                                                    <i className='fa fa-camera text-custom-hidden' />
                                                )}
                                            </>
                                        ) : (
                                            <a target='_blank'>
                                                <i className='event-camera' />
                                            </a>
                                        )}
                                    </Link>
                                ) : (
                                    <i className='fa fa-camera text-custom-hidden' />
                                )}
                            </div>

                            {/* DYNAMIC FORM PREVIEW */}
                            <div className='display_document_div'>{canseeform ? <i onClick={() => getimage()} className='display_doc' /> : <i className='fa fa-camera text-custom-hidden' />}</div>

                            {/* COMMENTS */}
                            <div className='comment-added position-relative have-hiden-content'>
                                {canComment ? (
                                    <>
                                        <i className={isviewedbyother} data-name={commentsLength} onClick={() => _toggleComment(id)} />
                                        {commentOpen === id && (
                                            <CommentPopup
                                                toggle={(id) => _toggleComment(id)}
                                                comments={project_event.project_event_comments}
                                                _addComment={_addComment}
                                                project_event_id={project_event._id}
                                                project_event={project_event}
                                                user={auth_user}
                                                isOpen={commentOpen === id}
                                                type='event'
                                                cssClasses='small-action-popup events text-left left-caret'
                                            />
                                        )}
                                    </>
                                ) : (
                                    <i className='fa fa-camera text-custom-hidden' />
                                )}
                            </div>

                            {/* ACCEPT DOCUMENT ONLY FOR DOCUMENT EVENTS */}
                            <div className='accepted-sec position-relative have-hiden-content'>
                                {project_event.event_accept_document_users.filter(function (e) {
                                    return parseInt(e.organization_id) === parseInt(auth_user.organization_id)
                                }).length != 0 &&
                                (project_event.event.type == 'document' || (project_event.event.type == 'event' && canSeeDocument)) ? (
                                    <>
                                        <i className={`${acceptBtnClass} ${isacceptrejectuser}`} onClick={() => _toggleDocument(id)} />
                                        {acceptOpen === id && (
                                            <AcceptDocumentPopup
                                                toggle={(id) => _toggleDocument(id)}
                                                acceptreject={(val) => setRejectAccept(val)}
                                                documentAcceptedUsers={project_event.document_accepted_users}
                                                event_type={project_event.event.type}
                                                isacceptrejectuser={isacceptrejectuser}
                                                _acceptDocument={_acceptDocument}
                                                project_event_id={project_event._id}
                                                user={auth_user}
                                                expiredtext={expiredtext}
                                                isOpen={acceptOpen === id}
                                                toggleClose={_setAccepttoogle}
                                                cssClasses='small-action-popup events text-left left-caret'
                                            />
                                        )}
                                    </>
                                ) : (
                                    <i className='fa fa-check text-custom-hidden' />
                                )}
                            </div>

                            {/* Delete button should be visible to admin only, will be removed after 5 mins if not admin */}
                            <div className='delete-sec'>
                                {canDelete ? (
                                    <i
                                        onClick={() => {
                                            _toggleDelete(id)
                                        }}
                                        className='event-delete'
                                    />
                                ) : (
                                    <i className='event-delete text-custom-hidden' />
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
            <ConfirmAccept
                isacceptopen={isacceptopen}
                documentAcceptedUsers={project_event.document_accepted_users}
                _acceptDocument={_acceptDocument}
                user={auth_user}
                isrejectaccept={isrejectaccept}
                project_event_id={project_event.event_submission_id}
                toggleClose={_setAccepttoogle}
                event_name={project_event.event_name}
            />
            {/* show preview form */}
            {showForm && <EventPreview user_id={auth_user.id} showForm={showForm} toggle={toggleEventPreview} assets={assetsData} formData={formData} previewFormData={previewFormData} answer_data={formanswers} readOnly={readOnly} changeReadOnly={changeReadOnly} />}
        </div>
    )
}

export default EventTypeLabel
