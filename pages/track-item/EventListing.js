import { useCallback, useState, useContext, useMemo } from 'react'
import NProgress from 'nprogress'
import styled from 'styled-components'
import Loader from '../../components/common/Loader'
import Filters from './Filters'
import EventRow from '../../components/events/EventRow'
import { seenProjectEventDocument } from '../../lib/api/project-event'
import EventContext from '../../store/event/eventContext'

const StyledSpan = styled.span`
    display: block;
    color: grey;
`

const EventListing = ({
    item_selection,
    projectEventUsers,
    list,
    user,
    isFetched,
    datetime,
    setDatetime,
    handleScroll,
    setFilteredEvent,
    searchText,
    pdcEvents,
    timeselectorfilter,
    participant_id,
    advanceFilterSelection,
    eventParticipantFilters,
    eventoptions,
    advanceSearchOptions,
    setAdvanceFilterSelection,
    setaddDatePicker,
    setOrganizationId,
    setEventCategory,
    setCreatedBy,
    handleInputChange,
    ondatemonthchange,
    setEventName,
    isLoading,
}) => {
    const [acceptOpen, setAcceptOpen] = useState()
    const [commentOpen, setCommentOpen] = useState()
    const [project, setProject] = useState({ project_selections: [] })
    const { setProjectEventUsers } = useContext(EventContext)

    /**
     * Seen Document
     */
    const _seenDocument = useCallback(
        async (event_submission_id, seenDocument) => {
            NProgress.start()
            try {
                if (!seenDocument) {
                    await seenProjectEventDocument({
                        organization_id: user.organization_id,
                        event_submission_id,
                    })
                }
                NProgress.done()
            } catch (err) {
                NProgress.done()
            }
        },
        [user],
    )

    useMemo(() => {
        setProjectEventUsers(projectEventUsers)
    }, [JSON.stringify(projectEventUsers)])

    const selectionArray = []

    if (item_selection?.group) {
        selectionArray.push(item_selection.group.groupID)
    }
    if (item_selection?.truck) {
        selectionArray.push(item_selection.truck.truckID)
    }
    if (item_selection?.container) {
        selectionArray.push(item_selection.container.containerID)
    }
    if (item_selection?.item) {
        if (Array.isArray(item_selection.item)) {
            if (item_selection.item.length > 1) selectionArray.push(item_selection.item.map((i) => i.itemID).join(', '))
            else selectionArray.push(item_selection.item[0].itemID)
        } else {
            selectionArray.push(item_selection.item.itemID)
        }
    }
    const selectedItems = selectionArray.length > 0 ? selectionArray.join(' - ') : ''
    return (
        <div className='container-fluid'>
            <div className='row d-flex project-listing'>
                <div className='tab-pane fade show active w-100' id='event' role='tabpanel' aria-labelledby='event-listing'>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <StyledSpan>{selectedItems}</StyledSpan>
                    </div>
                    {isFetched && (
                        <Filters
                            datetime={datetime}
                            setDatetime={setDatetime}
                            searchText={searchText}
                            participant_id={participant_id}
                            timeselectorfilter={timeselectorfilter}
                            advanceFilterSelection={advanceFilterSelection}
                            eventParticipantFilters={eventParticipantFilters}
                            eventoptions={eventoptions}
                            advanceSearchOptions={advanceSearchOptions}
                            setAdvanceFilterSelection={setAdvanceFilterSelection}
                            setaddDatePicker={setaddDatePicker}
                            setOrganizationId={setOrganizationId}
                            setEventCategory={setEventCategory}
                            handleInputChange={handleInputChange}
                            ondatemonthchange={ondatemonthchange}
                            setEventName={setEventName}
                            setCreatedBy={setCreatedBy}
                        />
                    )}
                    <div className='row d-flex event-listing' style={{ minHeight: '500px' }}>
                        <div className='col-md-12'>
                            {isLoading && <Loader style={{ height: '35px' }} />}
                            <div className='main-card card' style={{ marginLeft: '130px' }}>
                                <div className='card-body track-item m-0' id='track-item-wrapper'>
                                    {list.length > 0 &&
                                        list?.map((val, filterIndex) =>
                                            val.val?.map((ev, i) => {
                                                ev.user = projectEventUsers.find((user) => user.id == ev.viewUsers[0]?.created_by)
                                                return (
                                                    <React.Fragment key={i}>
                                                        {i == 0 && timeselectorfilter != '' && (
                                                            <div className='vertical-timeline-item vertical-timeline-element timeline-separator-label text-center'>
                                                                <div>
                                                                    <span className='vertical-timeline-element-date' />
                                                                    <span className='vertical-timeline-element-icon bounce-in'>
                                                                        <label>{val.key}</label>
                                                                    </span>
                                                                    <div style={{ height: '50px' }} className='vertical-timeline-element-content row' />
                                                                </div>
                                                            </div>
                                                        )}
                                                        <EventRow
                                                            key={ev.project_event.id}
                                                            isEditableMode={false}
                                                            ev={ev}
                                                            project={project}
                                                            handleScroll={handleScroll}
                                                            setFilteredEvent={setFilteredEvent}
                                                            filteredEvent={list}
                                                            acceptOpen={acceptOpen}
                                                            user={user}
                                                            commentOpen={commentOpen}
                                                            _handleModalEventsAction={() => {}}
                                                            _handleUserAction={() => {}}
                                                            _onDeleteEntry={() => {}}
                                                            _addComment={() => {}}
                                                            _seenDocument={_seenDocument}
                                                            setCommentOpen={(id) => setCommentOpen(id)}
                                                            setAcceptOpen={(id) => setAcceptOpen(id)}
                                                            _updateProjectisViewed={() => {}}
                                                            _fetchEvents={() => {}}
                                                            categoryEvents={pdcEvents}
                                                            parent_id={ev.project_event.id}
                                                            seenDocument={
                                                                ev.documentSeenUsers &&
                                                                ev.documentSeenUsers.filter(function (e) {
                                                                    return e.organization_id === parseInt(user.organization_id)
                                                                }).length != 0
                                                            }
                                                            projectEventUsers={projectEventUsers}
                                                            isLastEvent={list.length - 1 === filterIndex && i === val.val.length - 1}
                                                            isPublicUser
                                                        />
                                                    </React.Fragment>
                                                )
                                            }),
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EventListing
