import React from 'react'
import string from '../../utils/LanguageTranslation.js'
import SubEventList from './SubEventList'

const AddedSubEventsList = ({ title, subEvents, removeFromSubEvent }) => {
    const bounceClass = (event) => {
        let bounceClassName = 'bg-black black-fill'

        // Document events
        if (event?.eventType == 'document') {
            bounceClassName = 'bg-yellow'
        }

        return bounceClassName
    }
    return (
        <>
            <h5 className='modal-title text-dark font-weight-bold'>
                {title === 'EVENTS' ? string.event.selectedSubEvents : string.event.selectedSubDocuments} <span className={subEvents.length > 0 ? 'badge badge-danger badge-counter' : 'd-none'}>{subEvents.length}</span>
            </h5>
            <div className='mt-3 border  sub-event-container'>{subEvents.length > 0 && subEvents.map((event) => <SubEventList event={event} bounceClass={bounceClass} onClickAction={removeFromSubEvent} />)}</div>
        </>
    )
}

export default AddedSubEventsList
