import { round } from 'lodash'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const StyledSpan = styled.span`
    & {
        margin-left: ${(props) => `${props.left}px`};
    }
    &:before {
        ${(props) =>
            props.subEvent
                ? `content: '';
                position: absolute;
                top: 8px;
                left: ${props.beforeLeft}px;
                height: 5px;
                width: 11px;
                background: #dddddd;
                z-index: 0;`
                : `display: none`}
    }
    i {
        ${(props) => {
            return `margin-left: ${props.iconLeft}px;`
        }}
    }
`

const BounceCircle = ({ rootFolderPadding, project_event, isOpened, setOpen, eventCategory, className, fetchSubEvents, hanldleCollapse, subEvent, step }) => {
    let iconClass = `badge badge-dot badge-dot-xl ${className}`
    const isEvent = project_event?.event?.eventType === 'event'
    if (project_event?.has_sub_events) {
        let icon = 'fa fa-folder'
        if (isOpened) {
            icon = 'fa fa-folder-open'
        }
        iconClass = `${icon} ${isEvent ? 'color-black' : 'color-yellow'}`
    }

    const typeClass = `${iconClass}`

    const beforeLeft = (type) => {
        const spaceCal = step / 2

        if (step !== 0 && step % 2 === 0 && type === 'icon' && subEvent) {
            return 41
        }
        if (type === 'icon' && subEvent) {
            return 41
        }
        if (step !== 0 && type === 'folder' && subEvent) {
            const margin = Math.floor(spaceCal) ? (step > 2 ? 20 * Math.round(step - 1) : 20 * Math.floor(spaceCal)) : 0
            return margin
        }
        if ((step !== 0 && step % 2 && !type && subEvent) || (step > 1 && !project_event.has_sub_events) || (step > 1 && project_event.has_sub_events)) {
            return 28
        }
        return 0
    }

    return (
        <a
            key={project_event._id}
            onClick={() => {
                hanldleCollapse(!isOpened)
                if (project_event?.has_sub_events && typeof fetchSubEvents === 'function') {
                    fetchSubEvents(project_event.event_submission_id)
                    setOpen(!isOpened)
                }
            }}
        >
            {eventCategory == process.env.ALERT_EVENTS_CATEGORY ? (
                <>
                    <span className='vertical-timeline-element-icon bounce-in'>
                        <i className={typeClass}> </i>
                    </span>
                </>
            ) : (
                <>
                    <StyledSpan className='vertical-timeline-element-icon bounce-in' left={beforeLeft('folder')} iconLeft={beforeLeft('icon')} subEvent={subEvent} beforeLeft={beforeLeft()}>
                        <i className={typeClass}> </i>
                    </StyledSpan>
                </>
            )}
        </a>
    )
}

BounceCircle.propTypes = {
    project_event: PropTypes.object,
    isOpened: PropTypes.bool,
    setOpen: PropTypes.func,
}
BounceCircle.defaultProps = {
    project_event: {},
    isOpened: false,
    setOpen: () => {},
}

export default BounceCircle
