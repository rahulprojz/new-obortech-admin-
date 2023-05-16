import { useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { TRACK_ITEM_PAGE } from './Config'
import { setTrackItemDetail, toggleTrackItemModal } from '../../redux/actions/publicUser'
import string from '../../utils/LanguageTranslation.js'
import { updateUserLanguage } from '../../lib/api/user'
import { getLanguage } from '../../lib/api/language'
import ReactFlagsSelect from 'react-flags-select'

const PublicHeader = ({ user }) => {
    const dispatch = useDispatch()
    const trackItemStore = useSelector((state) => state.publicUser)
    const { projectId, page } = trackItemStore

    const handleTrackDetail = useCallback(
        (type) => {
            dispatch(setTrackItemDetail({ projectId, page: type }))
        },
        [projectId],
    )

    const handlelanguagechange = async (code) => {
        try {
            const userLang = code.toLowerCase() == 'us' ? 'en' : code
            await updateUserLanguage({ id: user.id, code: userLang })
            window.localStorage.setItem('language', code)
            const languageJson = await getLanguage(code)
            if (languageJson) {
                window.localStorage.setItem('languageJson', JSON.stringify(languageJson.json))
            }
            window.location.reload()
        } catch (error) {
            return
        }
    }

    //Language settings
    const countriesList = ['US', 'MN']
    const selectedLang = window.localStorage.getItem('language') && countriesList.includes(window.localStorage.getItem('language')) ? window.localStorage.getItem('language') : countriesList[0]

    return (
        <nav className='navbar navbar-expand navbar-light topbar mb-4 static-top w-100' style={{ padding: 0 }}>
            <ul className='navbar-nav ml-auto align-items-center'>
                <img src='/static/img/logo.png' style={{ marginLeft: '10px', marginRight: '20px' }} alt='OBORTECH' />
                <hr className='sidebar-divider my-0' />
                <li className='menu-item-option'>
                    {!!projectId && (
                        <>
                            <a
                                className={page === TRACK_ITEM_PAGE.EVENTS ? 'active' : ''}
                                onClick={() => {
                                    handleTrackDetail(TRACK_ITEM_PAGE.EVENTS)
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <span>{string.events}</span>
                            </a>
                            <a
                                className={page === TRACK_ITEM_PAGE.IOT ? 'active' : ''}
                                onClick={() => {
                                    handleTrackDetail(TRACK_ITEM_PAGE.IOT)
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <span>{string.iot}</span>
                            </a>
                        </>
                    )}
                </li>
                <li className='nav-item language-selection dropdown no-arrow mx-1'>
                    <ReactFlagsSelect selected={selectedLang} countries={countriesList} customLabels={{ US: string.local_language, MN: string.mong_language }} placeholder={string.selectLang} onSelect={handlelanguagechange} />
                </li>
                <div className='topbar-divider d-none d-sm-block'></div>
                <li className='nav-item dropdown no-arrow'>
                    <a className='nav-link dropdown-toggle' href='#' id='userDropdown' role='button' data-toggle='dropdown' aria-haspopup='true' aria-expanded='false'>
                        <span className='mr-2 d-none d-lg-inline  profile-text small text-capitalize'>{user.username}</span>
                        <i className='fas fa-angle-down fa-sm'></i>
                    </a>
                    <div className='dropdown-menu dropdown-menu-right shadow animated--grow-in' aria-labelledby='userDropdown'>
                        <div
                            as=''
                            onClick={() => {
                                dispatch(toggleTrackItemModal())
                            }}
                        >
                            <a style={{ cursor: 'pointer', color: '#3a3b45' }} className='dropdown-item'>
                                {string.trackItem.trackItem}
                            </a>
                        </div>
                        <div className='dropdown-divider'></div>
                        <a className='dropdown-item' href='#' data-toggle='modal' data-target='#logoutModal'>
                            <i className='fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400'></i>
                            {string.logout}
                        </a>
                    </div>
                </li>
            </ul>
        </nav>
    )
}

export default PublicHeader
