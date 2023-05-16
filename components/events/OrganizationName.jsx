import { useState } from 'react'
import string from '../../utils/LanguageTranslation'
import CircleHoverPopup from './CircleHoverPopup'
import { alertEventsArr } from '../../utils/commonHelper'

const OrganizationName = ({ project_event, user, created_by, id, didApprove, openApproveModal, auth_user }) => {
    if (typeof window === 'undefined') {
        return null
    }

    const [circlePopupOpen, setCirclePopupOpen] = useState()
    const [positionTop, setPositionTop] = useState(20)

    const deviceName = project_event.deviceName ? project_event.deviceName : ''
    const isDevice = project_event?.event?.eventType === 'alert' && deviceName

    const bottomSpace = 200
    const topPosition = isDevice ? -60 : -145

    const openCircle = (e, eid) => {
        setCirclePopupOpen(eid)
        const wh = window.innerHeight
        if (wh - e.clientY < bottomSpace) {
            setPositionTop(topPosition)
        } else {
            setPositionTop(isDevice ? 22 : 48)
        }
    }

    const closeCircle = () => {
        setCirclePopupOpen(null)
    }

    //Don't show new button for automatic events
    let showNewBtn = true
    let systemEvents = false
    if (alertEventsArr.includes(project_event.event?.uniqId)) {
        showNewBtn = false
        systemEvents = true
    }

    //Don't show new button for public users
    if (auth_user.role_id == process.env.ROLE_PUBLIC_USER) {
        showNewBtn = false
    }

    return (
        <span className='vertical-timeline-element-date'>
            {project_event?.event_category_id === process.env.ALERT_EVENTS_CATEGORY ? (
                <label style={{ cursor: 'pointer' }}>{string.compName}</label>
            ) : (
                <label
                    onMouseOver={(e) => {
                        openCircle(e, id)
                    }}
                    onMouseOut={() => {
                        closeCircle()
                    }}
                    onClick={() => {
                        openApproveModal()
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    {!didApprove && showNewBtn && <span style={{ color: 'red', marginRight: '5px' }}>{string.new}</span>}
                    {created_by == 0 ? (
                        string.compName
                    ) : user == null ? (
                        string.compName
                    ) : (
                        <>
                            {!systemEvents && (
                                <>
                                    <span>{user.username}</span>
                                    <br />
                                </>
                            )}{' '}
                            <span>{user.organization.name}</span>
                        </>
                    )}
                </label>
            )}
            {circlePopupOpen === id && <CircleHoverPopup positionTop={positionTop} project_event={project_event} user={user} />}
        </span>
    )
}

export default OrganizationName
