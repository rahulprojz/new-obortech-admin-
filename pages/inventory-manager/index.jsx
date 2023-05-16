import React, { useReducer, useRef } from 'react'
import NProgress from 'nprogress'
import { INVENTORY_PAGE_TAB } from '../../shared/constants'
import Listing from './Listing'
import withAuth from '../../lib/withAuth'

import string from '../../utils/LanguageTranslation'

const TabList = [
    { key: 'myAssetsClasses', title: string.inventory.myAssetsClasses, name: INVENTORY_PAGE_TAB.MY_ASSETS_CLASSES },
    { key: 'categories', title: string.inventory.categories, name: INVENTORY_PAGE_TAB.CATEGORIES },
    { key: 'uncategorizedAsssetClasses', title: string.inventory.uncategorizedAssetClasses, name: INVENTORY_PAGE_TAB.UNCATEGORIZED_ASSET_CLASSES },
]

const InventoryManager = ({ user }) => {
    const [state, setState] = useReducer((prevState, newState) => ({ ...prevState, ...newState }), {
        user: user || {},
        unSeenCount: 0,
        selectedTab: INVENTORY_PAGE_TAB.MY_ASSETS_CLASSES,
    })

    React.useEffect(() => {
        NProgress.done()
    }, [])

    const handleSelectedTab = (event) => {
        setState({ selectedTab: event.target.name })
    }

    const updateUnSeenCount = (unSeenCount) => {
        setState({ unSeenCount })
    }

    const getSelectedTabComponent = () => {
        switch (true) {
            case [INVENTORY_PAGE_TAB.MY_ASSETS_CLASSES, INVENTORY_PAGE_TAB.CATEGORIES, INVENTORY_PAGE_TAB.UNCATEGORIZED_ASSET_CLASSES].includes(state.selectedTab): {
                return <Listing key={state.selectedTab} updateUnSeenCount={updateUnSeenCount} {...state} />
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
                        {TabList.map((tab) => {
                            const { key, title, name } = tab
                            const active = Boolean(state.selectedTab === name)

                            return (
                                <li key={name} className='nav-item'>
                                    <a className={`nav-link ${active ? 'active' : ''}`} id={key} name={name} data-toggle='tab' href={`#${key}`} role='tab' aria-controls={key} aria-selected={active ? 'true' : ''} onClick={handleSelectedTab}>
                                        {title}
                                        {name == INVENTORY_PAGE_TAB.UNCATEGORIZED_ASSET_CLASSES && state.unSeenCount > 0 && (
                                            <span style={{ width: 'fit-content', verticalAlign: 'middle' }} className='badge badge-danger badge-counter ml-1'>
                                                {state.unSeenCount}
                                            </span>
                                        )}
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

export default withAuth(InventoryManager, { loginRequired: true })
