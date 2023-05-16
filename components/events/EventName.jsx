import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { getLocalTime } from '../../utils/globalFunc'
import EventHoverPopup from './EventHoverPopup'
import { otherLanguage } from '../../utils/selectedLanguage'
import { useSelector } from 'react-redux'
import TransactionModal from './TransactionPopup'

const StyledDiv = styled.span`
    padding-left: ${(props) => `${props.left}px`};
`

const EventName = ({ project_event, hideHoverPopup = false, isSubEvent = false}) => {
    if (typeof window === 'undefined') {
        return null
    }

    const [openInfo, setOpenInfo] = useState(null)
    const [positionTop, setPositionTop] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const bottomSpace = 100

    const deviceName = project_event.deviceName ? project_event.deviceName : ''
    const deviceTag = project_event.deviceTag ? project_event.deviceTag : ''
    const isDevice = project_event?.event?.eventType === 'alert' && deviceName

    const showInfo = (e, id) => {
        setOpenInfo(id)
        const wh = window.innerHeight
        if (wh - e.clientY < bottomSpace) {
            setPositionTop(true)
        } else {
            setPositionTop(false)
        }
    }

    const toggle = () => {
        setIsOpen(prev => !prev)
    }

    const hideInfo = () => {
        setOpenInfo(null)
    }

    let eventName = otherLanguage == 'MN' && project_event?.local_event_name ? project_event?.local_event_name : project_event?.event_name
    if (project_event.event?.uniqId == process.env.borderInEventId || project_event.event?.uniqId == process.env.borderOutEventid) {
        eventName = `${eventName}: ${project_event?.stationName}`
    }

    const [currentSubmitErrors, setCurrentSubmitErrors] = useState([])
    const submissionEventsError = useSelector((state) => state.integrityChecker.submissionEventsError)
    useEffect(() => setCurrentSubmitErrors(submissionEventsError), [submissionEventsError])
    const currentIntegrity = currentSubmitErrors.find(({ id }) => id === project_event?._id)

    return (
        <StyledDiv className={`list-content col-sm-7 ${isDevice || project_event?.title ? 'm-0' : ''}`} left={project_event?.style?.namePadding}>
            <h4
                onMouseOver={(e) => {
                    showInfo(e, project_event.event?.uniqId)
                }}
                onFocus={(e) => {
                    showInfo(e, project_event.event?.uniqId)
                }}
                onMouseOut={() => {
                    hideInfo()
                }}
                onBlur={() => {
                    hideInfo()
                }}
                className={(currentIntegrity && currentIntegrity.status)? `timeline-title ob-event-pass`
                : ((currentIntegrity && !currentIntegrity.status) ? `timeline-title ob-event-fail` : `timeline-title`)}
                style={{ cursor: 'pointer', wordBreak: 'break-all' }}
            >
                <span onClick={toggle}>{eventName}</span>
            </h4>
            {(isDevice || project_event?.title) && (
                <h6 style={{ wordBreak: 'break-all' }} className='my-2'>
                    {isDevice ? deviceTag : project_event?.title}
                </h6>
            )}
            <p className='event-date date-after-line'>{getLocalTime(project_event.createdAt, 'YYYY-MM-DD HH:mm:ss')}</p>
            {openInfo === project_event.event?.uniqId && !hideHoverPopup && <EventHoverPopup positionTop={positionTop} project_event={project_event} />}
            {isOpen && <TransactionModal  isOpen={isOpen} toggle={toggle} transaction_id={project_event?.tx_id}/>}
        </StyledDiv>
    )
}

export default EventName
