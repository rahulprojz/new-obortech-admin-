import React, { useContext } from 'react'
import BounceCircle from './BounceCircle'
import Button from '../common/form-elements/button/Button'
import EventName from './EventName'
import EventPath from './EventPath'
import EventContext from '../../store/event/eventContext'
import string from '../../utils/LanguageTranslation.js'

const SubEventList = ({ event, bounceClass, onClickAction, isAdd }) => {
    const { projectEventUsers } = useContext(EventContext)
    const user = projectEventUsers.find((userData) => userData.id == event.viewUsers[0].created_by)

    return (
        <>
            <div className='sub-event-list'>
                <EventPath project_event={event.project_event} />
                <div className='border-top'>
                    <span className='vertical-timeline-element-date'>
                        {event.project_event.event_category_id === process.env.ALERT_EVENTS_CATEGORY ? (
                            <label>{string.compName}</label>
                        ) : (
                            <label>
                                {event.viewUsers[0].created_by == 0 ? (
                                    string.compName
                                ) : user == null ? (
                                    string.compName
                                ) : (
                                    <>
                                        <span>{user.username}</span>
                                        <br /> <span>{user.organization.name}</span>
                                    </>
                                )}
                            </label>
                        )}
                    </span>
                    <BounceCircle project_event={event.project_event} eventCategory={event.project_event.event?.event_category_id} className={bounceClass(event.project_event.event)} />
                    <div className='vertical-timeline-element-content row'>
                        <EventName project_event={event.project_event} hideHoverPopup />
                        <Button type='button' className='btn btn-primary font-weight-bold small-btn' onClick={() => onClickAction(event)}>
                            {isAdd ? string.project.add : string.event.remove}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default SubEventList
