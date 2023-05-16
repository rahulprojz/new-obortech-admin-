import { useContext, useRef, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import EventContext from '../../store/event/eventContext'
import WatchallEventContext from '../../store/watchAllEvent/watchAllEventContext'

const StyledDiv = styled.div`
    color: grey;
    border: 1px solid grey;
    max-width: fit-content;
    padding: 0px 5px;
    margin-bottom: ${(props) => (props.marginbottom ? `${props.marginbottom}px` : '0px')};
    border-radius: 10px;
    text-align: ${(props) => props.align};
`
const StyledSpan = styled.span`
    display: block;
    color: grey;
`
const EventHoverPopup = ({ positionTop, project_event }) => {
    const [cssPosition, setCssPosition] = useState(50)

    const divRef = useRef(null)
    const isWatchAll = useSelector((state) => state.watchAll.isWatchAll)
    const { selectedGroup, selectedTruck, selectedContainer, selectedItem, selectedProject } = isWatchAll ? useContext(WatchallEventContext) : useContext(EventContext)

    useEffect(() => {
        if (positionTop) {
            setCssPosition(`-${divRef?.current?.clientHeight || 50}`)
        } else {
            setCssPosition(50)
        }
    }, [positionTop])

    const selectionArray = []
    const isProjectSelected = []
    if (!selectedItem) {
        selectionArray.push(project_event?.itemName)
        isProjectSelected[0] = true
    }
    if (!selectedContainer) {
        selectionArray.push(project_event?.containerName)
        isProjectSelected[1] = true
    }
    if (!selectedTruck && project_event.truck_id != 1 && project_event?.truckName.toLowerCase() != 'no group 2') {
        selectionArray.push(project_event?.truckName)
        isProjectSelected[2] = true
    }
    if (!selectedGroup && project_event.group_id != 1 && project_event?.groupName.toLowerCase() != 'no group 3') {
        selectionArray.push(project_event?.groupName)
        isProjectSelected[3] = true
    }
    if (!selectedProject && isWatchAll && isProjectSelected.length == 4 && isProjectSelected.every((p) => !!p)) {
        selectionArray.push(project_event?.projectName)
    }

    const selectedItems = selectionArray.length > 0 ? selectionArray.filter((selection) => selection).join(' - ') : ''
    const isSystemAlert = project_event.event_category_id == 1

    if (selectedItems || project_event?.description || project_event?.location) {
        return (
            <div ref={divRef} className='even-info-popup text-left' style={{ top: `${cssPosition}px`, right: 'auto' }}>
                {(selectedItems || project_event?.description || project_event?.location) && (
                    <div className='event-info'>
                        {!isSystemAlert && project_event?.description && (
                            <StyledDiv align='left' marginbottom='25'>
                                {project_event?.description}
                            </StyledDiv>
                        )}
                        {!isSystemAlert && project_event?.location && (
                            <StyledDiv align='left' marginbottom={selectedItems ? '20' : '0'}>
                                {project_event?.location}
                            </StyledDiv>
                        )}
                        {selectedItems && <StyledSpan>{selectedItems}</StyledSpan>}
                    </div>
                )}
            </div>
        )
    }
    return null
}

export default EventHoverPopup
