import React, { useState, useContext } from 'react'
import { Collapse } from 'reactstrap'
import _ from 'lodash'
import EventType from './EventType'
import { fetchProjectSubEventsMongoose } from '../../lib/api/project-event'
import { getGroupedData } from '../../utils/eventHelper'
import EventContext from '../../store/event/eventContext'

const EventRow = ({
    ev,
    project,
    handleScroll,
    setFilteredEvent,
    filteredEvent,
    acceptOpen,
    user,
    commentOpen,
    setDocumentOpen,
    documentOpen,
    setEventOpen,
    eventOpen,
    _handleModalEventsAction,
    _handleUserAction,
    _onDeleteEntry,
    _addComment,
    _seenDocument,
    setCommentOpen,
    setAcceptOpen,
    _updateProjectisViewed,
    _fetchEvents,
    categoryEvents,
    parent_id = 0,
    subEvent = false,
    iconPadding = 0,
    namePadding = 0,
    step = 0,
    watchall,
    pageHeight,
    topPosition,
    isLastEvent = false,
    seenDocument,
    updateFilter,
    acceptedDocument,
    isPublicUser = false,
    isEditableMode = true,
    handleIntegrity,
    activeIntegerity,
}) => {
    const [isCollapsed, setCollapsed] = useState(false)
    const [subEventsList, setSubEventsList] = useState([])
    const { projectEventUsers, setProjectEventUsers, showHiddenEvents } = useContext(EventContext)
    const _fetchSubEvents = async (event_submission_id) => {
        try {
            let peventUsers = projectEventUsers
            const subEventsList = await fetchProjectSubEventsMongoose({ event_submission_id })
            peventUsers = _.uniqBy([].concat.apply(peventUsers, subEventsList.eventUsers), 'id')
            setProjectEventUsers(peventUsers)
            const subEvents = getGroupedData(subEventsList.projectEvents, '', categoryEvents)
            setSubEventsList([...subEvents])
        } catch (err) {
            console.log(err)
        }
    }

    const isAllUsersAccepted = () => {
        const docAccept = _.uniqBy(ev.project_event.document_accepted_users, (user) => user.user_id)
        const eventUsers = _.uniqBy(ev.project_event.event_accept_document_users, (user) => user.user_id)
        return docAccept.length == eventUsers.length
        // const allAccepted = ev.project_event.acceptUsers.every((user) => user.accepted == true)
        // return allAccepted
    }

    return (
        <>
            <EventType
                handleIntegrity={handleIntegrity}
                activeIntegerity={activeIntegerity}
                key={ev._id}
                project_event={ev.project_event}
                project={project}
                id={parent_id ? `${parent_id}-${ev.project_event._id}` : ev.project_event._id}
                // checkTrue={checkTrue}
                created_by={ev.viewUsers[0].created_by}
                user_id={ev.user_id}
                road_id={ev.road_id}
                user={ev.user}
                acceptOpen={acceptOpen}
                auth_user={user}
                allUsersAccepted={isAllUsersAccepted()}
                canSeeDocument
                commentOpen={commentOpen}
                toggleDocument={() => setDocumentOpen(!documentOpen)}
                toggleEvent={() => setEventOpen(!eventOpen)}
                _handleModalEventsAction={_handleModalEventsAction}
                _handleUserAction={_handleUserAction}
                _onDeleteEntry={_onDeleteEntry}
                _addComment={_addComment}
                _seenDocument={_seenDocument}
                seenDocument={seenDocument}
                acceptedDocument={acceptedDocument}
                setCommentOpen={(id) => setCommentOpen(id)}
                setAcceptOpen={(id) => setAcceptOpen(id)}
                _updateProjectisViewed={_updateProjectisViewed}
                _fetchEvents={_fetchEvents}
                watchall={watchall}
                fetchSubEvents={_fetchSubEvents}
                isCollapsed={isCollapsed}
                hanldleCollapse={setCollapsed}
                subEvent={subEvent}
                step={step}
                rootFolderPadding={step ? iconPadding + 30 : 0}
                isLastEvent={isLastEvent}
                pageHeight={pageHeight}
                topPosition={topPosition}
                parent_id={parent_id}
                updateFilter={updateFilter}
                isPublicUser={isPublicUser}
                isEditableMode={isEditableMode}
                showHiddenEvents={showHiddenEvents}
            />
            {!!ev.project_event.has_sub_events && (showHiddenEvents || !ev.project_event?.hiddenEvent) && (
                <Collapse isOpen={isCollapsed} key={`${parent_id}-${ev.project_event._id}`} className='sub-events' id={`parent_id_${parent_id}_event_id_${ev.project_event._id}`}>
                    {subEventsList
                        .map((subEvent, i) => {
                            if (subEvent.project_event.has_sub_events)
                                subEvent.project_event.style = {
                                    iconPadding,
                                    namePadding,
                                }
                            if (projectEventUsers.length) {
                                subEvent.user = projectEventUsers.find((user) => user.id == subEvent.viewUsers[0].created_by)
                            }

                            return subEvent
                        })
                        .map((subEvent, i) => (
                            <EventRow
                                ev={subEvent}
                                project={project}
                                handleScroll={handleScroll}
                                setFilteredEvent={setFilteredEvent}
                                filteredEvent={filteredEvent}
                                acceptOpen={acceptOpen}
                                user={user}
                                commentOpen={commentOpen}
                                setDocumentOpen={setDocumentOpen}
                                documentOpen={documentOpen}
                                setEventOpen={setEventOpen}
                                eventOpen={eventOpen}
                                _handleModalEventsAction={_handleModalEventsAction}
                                _handleUserAction={_handleUserAction}
                                _onDeleteEntry={_onDeleteEntry}
                                _addComment={_addComment}
                                _seenDocument={_seenDocument}
                                seenDocument={seenDocument}
                                acceptedDocument={acceptedDocument}
                                setCommentOpen={setCommentOpen}
                                setAcceptOpen={setAcceptOpen}
                                watchall={watchall}
                                _updateProjectisViewed={_updateProjectisViewed}
                                _fetchEvents={_fetchEvents}
                                categoryEvents={categoryEvents}
                                subEvent
                                iconPadding={iconPadding}
                                namePadding={namePadding}
                                step={step + 1}
                                parent_id={`${parent_id}-${ev.project_event._id}`}
                                isLastEvent={i === subEventsList.length - 1}
                                updateFilter={updateFilter}
                                isPublicUser={isPublicUser}
                                isEditableMode={isEditableMode}
                            />
                        ))}
                </Collapse>
            )}
        </>
    )
}

export default EventRow
