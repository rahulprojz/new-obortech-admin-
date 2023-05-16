import React, { useState, useContext } from 'react'
import _ from 'lodash'
// import Sortable from 'sortablejs'
import string from '../../utils/LanguageTranslation'
import EventContext from '../../store/event/eventContext'
import WatchAllEventContext from '../../store/watchAllEvent/watchAllEventContext'
import { fetchProjectEvents } from '../../lib/api/project-event'
import { getGroupedData } from '../../utils/eventHelper'
import AddSubEventModal from './AddSubEventModal'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import notify from '../../lib/notifier'

const SubEventsComponent = ({ watchall = false, title, subEvents, updateSubEvents, eventType, user_id, user_role_id, organization_id, categoryEvents }) => {
    const [filteredEvents, setFilteredEvents] = useState([])
    const [searchText, setSearchText] = useState([])
    const [showModal, setModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { project_id, projectEventUsers, setProjectEventUsers } = useContext(EventContext)
    const { selectedProject: wSelectedProject } = useContext(WatchAllEventContext)
    const toggleModal = () => {
        setModal(!showModal)
    }

    const fetchSubEventsByParentIdAndSearch = async () => {
        try {
            let eventIds = []
            if (searchText) {
                const eventsArr = categoryEvents?.filter((event) => event.eventName.toLowerCase().indexOf(searchText.toLowerCase()) == !-1)
                eventIds = eventsArr?.map((event) => event.uniqId)
            }
            let pEventUsers = projectEventUsers
            const data = {
                project_id: watchall ? wSelectedProject : parseInt(project_id),
                user_id: parseInt(user_id),
                user_role_id,
                organization_id: null,
                eventId: 0,
                created_by: 0,
                start_date_time: null,
                end_date_time: null,
                search_text: searchText.trim(),
                searchEventId: eventIds,
                isAddedInBlockchain: true,
            }
            const events = await fetchProjectEvents(data)
            const filteredEventList = getGroupedData(events.projectEvents, '', categoryEvents, events.eventUsers)
            if (events?.eventUsers?.length) {
                pEventUsers = _.unionBy([].concat.apply(pEventUsers, events.eventUsers), 'id')
                setProjectEventUsers(pEventUsers)
            }
            return filteredEventList
        } catch (err) {
            console.log(err)
        }
    }

    const searchEventName = async () => {
        try {
            setIsLoading(true)
            if (searchText?.toString()?.trim()) {
                const filteredEventList = await fetchSubEventsByParentIdAndSearch()
                if (filteredEventList?.length > 0) {
                    setFilteredEvents(filteredEventList)
                    toggleModal()
                } else {
                    notify(string.event.projectEventNotAvailable)
                }
            }
            setIsLoading(false)
        } catch (err) {
            setIsLoading(false)
            console.log(err)
        }
    }

    const _handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            searchEventName()
        }
    }

    return (
        <>
            <div className='row ml-0 mr-0 content-block'>
                <h6 className='col-3 font-weight-bold pt-2 text-uppercase'>{eventType == 'event' ? string.searchEvent : string.searchDocument}</h6>
                <input className='form-control col-md-6 title-field' type='search' value={searchText} onChange={(e) => setSearchText(e.target.value)} onKeyDown={_handleKeyDown} />
                <LoaderButton style={{ height: '35px', lineHeight: '20px' }} type='button' isLoading={isLoading} disabled={searchText?.length == 0 || !searchText?.toString()?.trim()} className='btn btn-primary col-2 ml-3' onClick={searchEventName} text={string.project.search} />
            </div>
            {showModal && <AddSubEventModal title={title} availableSubEvents={subEvents} updateSubEvents={updateSubEvents} isOpen={showModal} toggleModal={toggleModal} filteredEvents={filteredEvents} />}
        </>
    )
}

export default SubEventsComponent
