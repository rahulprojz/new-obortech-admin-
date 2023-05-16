import React, { useReducer } from 'react'
import withAuth from '../../lib/withAuth'
import { LISTING_PAGE_TAB } from '../../shared/constants'
import string from '../../utils/LanguageTranslation'
import Listing from './Listing'

const TabList = [
    { key: 'projectListing', title: string.project.projectListing, name: LISTING_PAGE_TAB.PROJECT_LISTING },
    { key: 'templateListing', title: string.projectTemplate.templateListing, name: LISTING_PAGE_TAB.TEMPLATE_LISTING },
    { key: 'archiveListing', title: string.project.archiveListing, name: LISTING_PAGE_TAB.ARCHIVED_LISTING },
]

const ListingPage = (props) => {
    const [state, setState] = useReducer((prevState, newState) => ({ ...prevState, ...newState }), {
        user: props.user || {},
        selectedTab: LISTING_PAGE_TAB.PROJECT_LISTING,
    })

    const handleSelectedTab = (event) => {
        setState({ selectedTab: event.target.name })
    }

    const getSelectedTabComponent = () => {
        switch (true) {
        case [LISTING_PAGE_TAB.PROJECT_LISTING, LISTING_PAGE_TAB.TEMPLATE_LISTING, LISTING_PAGE_TAB.ARCHIVED_LISTING].includes(state.selectedTab): {
            return <Listing key={state.selectedTab} {...state} />
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
                        {TabList.map((tab, i) => {
                            const { key, title, name } = tab
                            const active = Boolean(state.selectedTab === name)
                            return (
                                <li key={i} className='nav-item'>
                                    <a className={`nav-link ${active ? 'active' : ''}`} id={key} name={name} data-toggle='tab' href={`#${key}`} role='tab' aria-controls={key} aria-selected={active ? 'true' : ''} onClick={handleSelectedTab}>
                                        {title}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                    <div className='tab-content w-100' id='myTabContent'>
                        {getSelectedTabComponent()}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default withAuth(ListingPage, { loginRequired: true })
