import { useEffect, useRef, useState, useContext } from 'react'
import { useOutsideClick } from '../../utils/customHooks/useClickOutside'
import string from '../../utils/LanguageTranslation.js'
import notify from '../../lib/notifier'
import EventContext from '../../store/event/eventContext'

const { getLocalTime } = require('../../utils/globalFunc')

const CommentPopup = ({ toggle, project, comments, _addComment, project_event, item_id, isOpen, customCSS = {}, type, cssClasses }) => {
    const eventSubmissionId = project_event.event_submission_id
    const [comment, setComment] = useState('')
    const [disableComment, setDisableComment] = useState(false)
    const commentRef = useRef(null)
    const isOutside = useOutsideClick(commentRef)
    const { projectEventUsers } = useContext(EventContext)

    const _onSubmit = async (comment) => {
        setDisableComment(true)
        if (comment != '' && !/^\s*$/.test(comment)) {
            const new_comment = await _addComment(comment, eventSubmissionId, item_id, type, project_event)
            setDisableComment(false)
            comments.unshift({
                comment,
                createdAt: new_comment.createdAt,
                is_viewed: new_comment.is_viewed,
                user: {
                    username: new_comment.username,
                    organization: {
                        name: new_comment.organization_name,
                    },
                },
            })
            setComment('')
        } else {
            notify(string.errors.enterComment)
            setDisableComment(false)
            return false
        }
    }

    useEffect(() => {
        if (!!isOpen && !!isOutside) {
            toggle(null)
        }
    }, [isOutside])
    const isNotCompleted = !project?.is_completed

    return (
        <div className={cssClasses} style={customCSS} ref={commentRef}>
            <i className='fa fa-times-circle document-action-btn close-btn' onClick={() => toggle(null)} />
            <div className={`${type} main-content-body`}>
                <div className='comments-list'>
                    {comments.map((comment, i) => {
                        if (!comment.user) comment.user = projectEventUsers.find((user) => user.id === comment.user_id)
                        return (
                            <div key={i} className='comment-box'>
                                <p className='text-dark-50'>
                                    <label style={{ color: '#E68B00', margin: 0 }}>{comment?.user?.username}</label> <label style={{ color: '#A56F32', margin: 0 }}>{comment?.user?.organization?.name}</label>
                                </p>
                                <p className='text-dark' style={{ wordBreak: 'break-word' }}>
                                    {comment.comment}
                                </p>
                                <p className='text-dark-50'>{getLocalTime(comment.createdAt)}</p>
                            </div>
                        )
                    })}
                    {comments.length == 0 && <p className='no-comment-found'>{string.noComment}</p>}
                </div>

                {isNotCompleted && (
                    <>
                        <div className='add-comment d-flex align-items-center'>
                            <input
                                type='text'
                                name='comment'
                                value={comment || ''}
                                onChange={(event) => {
                                    setComment(event.target.value)
                                }}
                                placeholder={string.addComment}
                            />
                            <button
                                disabled={disableComment}
                                onClick={() => {
                                    _onSubmit(comment)
                                }}
                            >
                                <i className='fa fa-arrow-right' style={disableComment ? { color: '#858796', cursor: 'not-allowed', pointerEvents: 'none' } : {}} />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default CommentPopup
