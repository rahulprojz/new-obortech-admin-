import React, { useState } from 'react'
import PropTypes from 'prop-types'
import string from '../../utils/LanguageTranslation.js'
import withAuth from '../../lib/withAuth'
import ProjectCategory from './projectCategory/index'
import EventCategory from './eventCategory/index'
import DocumentCategory from './documentCategory/index'
import ParticipantCategory from './participantCategory/index'

import { CATEGORY_PAGE_TAB, INITIAL_PAGINATION_STATE } from '../../shared/constants'

const CATEGORY_TAB_LIST = [
    {
        title: string.projectCatTitle,
        key: 'projectCategory',
        name: CATEGORY_PAGE_TAB.PROJECT,
    },
    {
        title: string.eventCatTitle,
        key: 'eventCategory',
        name: CATEGORY_PAGE_TAB.EVENT,
    },
    {
        title: string.docCatTitle,
        key: 'documentCategory',
        name: CATEGORY_PAGE_TAB.DOCUMENT,
    },
    {
        title: string.participant.participantCategories,
        key: 'participantCategory',
        name: CATEGORY_PAGE_TAB.PARTICIPANT,
    },
]
const EventCategoryPage = (props) => {
    const { user } = props
    const [selectedTab, setSelectedTab] = useState(CATEGORY_PAGE_TAB.PROJECT)
    const [formmodallist, setformmodallist] = useState([])
    const [orgList, setOrgList] = useState([])

    const [project_categories, setProject_categories] = useState(INITIAL_PAGINATION_STATE)
    const [eventCategories, setEventCategories] = useState(INITIAL_PAGINATION_STATE)
    const [document_categories, setDocument_categories] = useState(INITIAL_PAGINATION_STATE)
    const [participantCategories, setParticipantCategories] = useState(INITIAL_PAGINATION_STATE)

    const handleSelectedTab = (event) => {
        const tab = event.target.name
        setSelectedTab(tab)
    }

    const getSelectedTabData = () => {
        const { PROJECT, EVENT, DOCUMENT, PARTICIPANT } = CATEGORY_PAGE_TAB
        switch (selectedTab) {
            case PROJECT: {
                return <ProjectCategory user={user} project_categories={project_categories} setProject_categories={setProject_categories} orgList={orgList} setOrgList={setOrgList} />
            }
            case EVENT: {
                return <EventCategory user={user} orgList={orgList} setOrgList={setOrgList} formmodallist={formmodallist} setformmodallist={setformmodallist} eventCategories={eventCategories} setEventCategories={setEventCategories} />
            }
            case DOCUMENT: {
                return <DocumentCategory user={user} orgList={orgList} setOrgList={setOrgList} formmodallist={formmodallist} setformmodallist={setformmodallist} document_categories={document_categories} setDocument_categories={setDocument_categories} />
            }
            case PARTICIPANT: {
                return <ParticipantCategory participantCategories={participantCategories} setParticipantCategories={setParticipantCategories} />
            }
            default:
                return null
        }
    }

    return (
        <div>
            <div className='container-fluid'>
                <div className='row d-flex project-listing'>
                    <ul className='nav nav-tabs w-100' id='myTab' role='tablist'>
                        {CATEGORY_TAB_LIST.map(({ key, title, name }) => (
                            <li className='nav-item'>
                                <a className={`nav-link ${selectedTab === name ? 'active' : ''}`} id={key} name={name} data-toggle='tab' href={`#${key}`} role='tab' aria-controls={`#${key}`} aria-selected={selectedTab === name} onClick={handleSelectedTab}>
                                    {title}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <div className='tab-content w-100' id='myTabContent'>
                        {getSelectedTabData()}
                    </div>
                </div>
            </div>
        </div>
    )
}

EventCategoryPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.string,
    }),
}

export default withAuth(EventCategoryPage, { loginRequired: true })
