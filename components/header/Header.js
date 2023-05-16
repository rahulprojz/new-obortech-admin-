import PropTypes from 'prop-types'
import Link from 'next/link'
import NProgress from 'nprogress'
import React, { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import Profile from '../profile/Profile'
import Notification from '../notification/notificationSetting'
import RequestUser from '../requestUser/requestuser'
import { fetchUnseenEvents } from '../../lib/api/project-event'
import string from '../../utils/LanguageTranslation.js'
import ReactFlagsSelect from 'react-flags-select'
import EventContext from '../../store/event/eventContext'
import WatchAllEventContext from '../../store/watchAllEvent/watchAllEventContext'
import { getLanguage } from '../../lib/api/language'
import notify from '../../lib/notifier'
import { getMVSToken } from '../../lib/api/sendRequest'
import { fetchItemProject } from '../../lib/api/item'
import { fetchUnreadNotificationCount } from '../../lib/api/notification'
import NotificationModal from './NotificationModal'
import { updateUserLanguage } from '../../lib/api/user'
import { fetchEventsAction } from '../../redux/actions/eventAction'
import { fetchOrgsAction } from '../../redux/actions/organizationAction'
import { getAccess } from '../../lib/api/network-api'
import { fetchUnSeenCountAction } from '../../redux/actions/unSeenCountAction'
import { getOrgs } from '../../redux/selectors/organizationSelector'
import { getUnSeenCounts } from '../../redux/selectors/unSeenCountSelector'
import { getCategoryEvents } from '../../redux/selectors/eventSelector'
import { fetchUserAgreementHash } from '../../lib/api/user-agreement'
import axios from 'axios'
import { withCookies } from 'react-cookie'
import { updateUser, fetchUserById } from '../../lib/api/user'
import { updateOrganization } from '../../lib/api/organization'
import { checkUserVerification, checkOrganizationVerification } from '../../lib/api/onboarding'

function Header({ user, cookies }) {
    const [eventCount, setEventCount] = useState(0)
    const [notificationCount, setNotificationCount] = useState(0)
    const [language, setLanguage] = useState('en')
    const [users, setUsers] = useState([])
    const [purpose, setPurpose] = useState([])
    const [timer, setTimer] = useState(false)
    const [requestuserModal, setrequestuserModal] = useState(false)
    const [timerNotification, setTimerNotification] = useState(false)
    const [selectedvalues, setSelectedValues] = useState({
        project: null,
        item: null,
    })
    const [isOpen, setOpen] = useState(false)
    const { selectedItem, itemsNames } = useContext(EventContext)
    const { selectedItem: selectedItemWatchall, itemsNames: selectedItemLabel, selectedContainer: selectedContainerWatchall } = useContext(WatchAllEventContext)
    const dispatch = useDispatch()

    const categoryEvents = useSelector(getCategoryEvents)
    const orgList = useSelector(getOrgs)

    const router = useRouter()
    let { project_id, orgStatus, userStatus } = router.query

    //Check if user is admin
    const ifAdmin = user.role_id == process.env.ROLE_ADMIN ? true : false
    const ifManager = user.role_id == process.env.ROLE_MANAGER ? true : false
    const ifSeniorManager = user.role_id == process.env.ROLE_SENIOR_MANAGER
    const ifCeo = user.role_id == process.env.ROLE_CEO
    const ifHost = true //userData?.organization?.organization_type_id == process.env.ORG_TYPE_HOST;
    // const isSubscriber = userData?.organization?.organization_type_id == process.env.ORG_TYPE_SUBSCRIBER;
    if (typeof window === 'undefined') {
        return null
    } else {
        const localStoreProjectID = window.localStorage.getItem(`${user.id}-project_id`)
        // If on another page then fetch project_id from cookie
        if (!project_id) {
            if (localStoreProjectID) {
                project_id = localStoreProjectID
            }
        } else if (!!project_id && project_id != localStoreProjectID) {
            window.localStorage.setItem(`${user.id}-project_id`, project_id)
        }

        const toggle = (props) => {
            if (isOpen && !props) {
                setNotificationCount(0)
            }
            setOpen(!isOpen)
        }

        const handleMVSVerification = async () => {
            try {
                if (orgStatus || userStatus) {
                    const userData = await fetchUserById({ id: user.id })
                    const { organization, role_id, unique_id } = userData
                    const headers = {}
                    if (orgStatus === 'success' || userStatus == 'success') {
                        const verificationToken = await getMVSToken()
                        headers.Authorization = verificationToken.token
                    }

                    if ((role_id == process.env.ROLE_CEO || role_id == process.env.ROLE_SENIOR_MANAGER) && !!orgStatus && !organization.is_mvs_verified) {
                        if (orgStatus === 'success') {
                            const organizationVerificationData = await checkOrganizationVerification(organization.unique_id, { headers })
                            if (organizationVerificationData.approved) {
                                await updateOrganization({ ...organization, is_mvs_verified: true, statusUpdate: true })
                                notify(string.onboarding.validations.verificationSuccess)
                            } else {
                                notify(string.onboarding.validations.verificationReject)
                            }
                        }
                        if (orgStatus === 'failed') notify(string.onboarding.validations.verificationReject)
                    }
                    if (!userData.is_mvs_verified) {
                        if (userStatus == 'success') {
                            const userVerificationData = await checkUserVerification(unique_id, { headers })
                            if (userVerificationData.approved) {
                                await updateUser({ ...user, is_mvs_verified: true })
                                notify(string.onboarding.validations.verificationSuccess)
                            } else {
                                notify(string.onboarding.validations.verificationReject)
                            }
                        }
                        if (userStatus == 'failed') notify(string.onboarding.validations.verificationReject)
                    }
                    if (typeof window !== 'undefined') {
                        window.history.replaceState(null, '', `${window.location.origin}${window.location.pathname}`)
                    }
                }
            } catch (err) {
                console.log(err)
            }
        }

        useEffect(() => {
            handleMVSVerification()
            let eventInterval = null
            let notificationInterval = null
            if (router.pathname != '/event') {
                _fetchEvents(project_id, user.id)
                if (!timer) {
                    setTimer(true)
                    eventInterval = setInterval(async () => {
                        _fetchEvents(project_id, user.id)
                    }, process.env.EVENT_TIMER || 60000)
                }
            }
            _fetchUnreadNotificationsCount(user.id)
            if (!timerNotification) {
                setTimerNotification(true)
                notificationInterval = setInterval(async () => {
                    _fetchUnreadNotificationsCount(user.id)
                }, process.env.NOTIFICATION_TIMER || 60000)
            }
            if (!(window.location.href.indexOf('watchall') > -1)) {
                window.localStorage.setItem('watch_all', false)
            }
            if (!categoryEvents.length) dispatch(fetchEventsAction())
            if (!orgList.length) dispatch(fetchOrgsAction())
            return () => {
                clearInterval(eventInterval)
                clearInterval(notificationInterval)
            }
        }, [])

        const _fetchUnreadNotificationsCount = async (user_id) => {
            const unreadNotificationsCount = await fetchUnreadNotificationCount({ user_id })
            setNotificationCount(unreadNotificationsCount)
        }

        const getProjectByItem = async (selectedItemWatchall, selectedContainerWatchall) => {
            const project = await fetchItemProject({ item_id: selectedItemWatchall, container_id: selectedContainerWatchall })
            if (project) {
                setSelectedValues({ project: project.project_id, item: selectedItemLabel?.selected?.label })
            }
        }

        useEffect(() => {
            setSelectedValues({ project: null, item: null })
            if (selectedItemWatchall && selectedContainerWatchall) {
                getProjectByItem(selectedItemWatchall, selectedContainerWatchall)
            }
        }, [selectedItemWatchall, selectedContainerWatchall])

        useEffect(() => {
            setSelectedValues({ item: null })
            if (selectedItem) {
                setSelectedValues({ item: itemsNames?.selected?.label })
            }
        }, [selectedItem])

        const openExplorer = () => {
            const projectId = selectedvalues.project ? selectedvalues.project : project_id
            let explorerUrl = `/login?refer=explorer&project=${projectId}`
            if (selectedvalues.item) {
                explorerUrl = `/login?refer=explorer&project=${projectId}&item=${selectedvalues.item}`
            }
            window.open(explorerUrl, '_blank')
        }

        const _fetchEvents = async (project_id, user_id) => {
            const unseenEvents = await fetchUnseenEvents({
                project_id: parseInt(project_id),
                user_id: parseInt(user_id),
            })
            setEventCount(unseenEvents.count)
        }

        const handlelanguagechange = async (code) => {
            try {
                setLanguage(code)
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

        async function getUserAgreement() {
            NProgress.start()
            const userAgreementHash = await fetchUserAgreementHash()
            const userData = await fetchUserById({ id: userAgreementHash.user_id })
            const accesstoken = await getAccess(userData.unique_id, userData.organization.blockchain_name)
            if (accesstoken.error) {
                throw accesstoken.error
            }
            await axios(process.env.OBORTECH_API + '/api/v1/document/' + userAgreementHash.file_hash, {
                method: 'GET',
                responseType: 'blob',
                headers: { Authorization: `Bearer ${accesstoken}` },
            }).then((response) => {
                const file = new Blob([response.data], { type: 'application/pdf' })
                const url = window.URL.createObjectURL(file)
                const link = document.createElement('a')
                link.setAttribute('href', url)
                link.setAttribute('target', '_blank')
                link.style.visibility = 'hidden'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            })
            NProgress.done()
        }

        //Language settings
        const countriesList = ['US', 'MN']
        const selectedLang = window.localStorage.getItem('language') && countriesList.includes(window.localStorage.getItem('language')) ? window.localStorage.getItem('language') : countriesList[0]
        return (
            <>
                <nav className={`navbar navbar-expand navbar-light topbar mb-4 static-top`} style={{ padding: 0 }}>
                    <button id='sidebarToggleTop' className='btn btn-link d-md-none rounded-circle mr-3'>
                        <i className='fa fa-bars'></i>
                    </button>
                    <ul className='navbar-nav ml-auto align-items-center'>
                        <li className='menu-item-option'>
                            {project_id && (
                                <>
                                    <Link href={'/event/' + parseInt(project_id)}>
                                        <a className={router.pathname == '/allevent' || router.pathname == '/event' ? 'active' : ''}>
                                            <i className='fa fa-calendar-alt'></i>
                                            <span>
                                                {string.events} <span className={eventCount > 0 ? 'badge badge-danger badge-counter' : 'badge badge-danger badge-counter d-none'}>{eventCount}</span>
                                            </span>
                                        </a>
                                    </Link>
                                    <Link href={'/document/' + parseInt(project_id)}>
                                        <a className={router.pathname == '/alldocument' || router.pathname == '/document' ? 'active' : ''}>
                                            <i className='fa fa-file-alt'></i>
                                            <span>{string.doc} </span>
                                        </a>
                                    </Link>
                                    <Link href={'/iot/' + parseInt(project_id)}>
                                        <a className={router.pathname == '/iot' ? 'active' : ''}>
                                            <i className='fa fa-calendar-alt'></i>
                                            <span>{string.iot}</span>
                                        </a>
                                    </Link>
                                    <button className='btn btn-default explorer-btn' onClick={openExplorer}>
                                        {string.explorer}
                                    </button>
                                </>
                            )}
                            {ifManager && (
                                <Link href={'/inventory'}>
                                    <a className={router.pathname == '/inventory' ? 'active' : ''}>
                                        <i className='fa fa-calendar-alt'></i>
                                        <span>{string.inventory.inventoryText}</span>
                                    </a>
                                </Link>
                            )}
                        </li>

                        <li className='nav-item dropdown no-arrow mx-1'>
                            <a
                                className='nav-link notification'
                                href='#'
                                onClick={(event) => {
                                    event.preventDefault()
                                    toggle()
                                }}
                            >
                                <i className='fas fa-bell fa-fw'></i>
                                <span className={notificationCount > 0 ? 'badge badge-danger badge-counter' : 'd-none'}>{notificationCount}</span>
                            </a>
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
                            {/* Dropdown - User Information */}
                            <div className='dropdown-menu dropdown-menu-right shadow animated--grow-in' aria-labelledby='userDropdown'>
                                <a className='dropdown-item'>
                                    <Profile user={user} cookies={cookies} />
                                </a>
                                {(ifAdmin ? ifHost : ifManager) && (
                                    <>
                                        <Link href='/project' as='/project'>
                                            <a className='dropdown-item'>{string.projects}</a>
                                        </Link>
                                        <Link href='/station'>
                                            <a className='dropdown-item'>{string.stations}</a>
                                        </Link>
                                    </>
                                )}
                                {ifManager && (
                                    <>
                                        <Link href='/nft-management'>
                                            <a className='dropdown-item'>{string.manageNft}</a>
                                        </Link>
                                        <Link href='/group-3'>
                                            <a className='dropdown-item'>{string.group3}</a>
                                        </Link>
                                        <Link href='/group-2'>
                                            <a className='dropdown-item'>{string.group2}</a>
                                        </Link>
                                        <Link href='/group-1'>
                                            <a className='dropdown-item'>{string.group1}</a>
                                        </Link>
                                        <Link href='/item'>
                                            <a className='dropdown-item'>{string.container.items}</a>
                                        </Link>
                                        <Link href='/category'>
                                            <a className='dropdown-item'>{string.categ}</a>
                                        </Link>
                                        <Link href='/inventory-manager'>
                                            <a className='dropdown-item'>{string.inventoryManager}</a>
                                        </Link>
                                    </>
                                )}
                                {ifAdmin && (
                                    <>
                                        <Link href='/group-3'>
                                            <a className='dropdown-item'>{string.group3}</a>
                                        </Link>
                                        <Link href='/group-2'>
                                            <a className='dropdown-item'>{string.group2}</a>
                                        </Link>
                                        <Link href='/group-1'>
                                            <a className='dropdown-item'>{string.group1}</a>
                                        </Link>
                                        <Link href='/item'>
                                            <a className='dropdown-item'>{string.container.items}</a>
                                        </Link>
                                        <Link href='/category'>
                                            <a className='dropdown-item'>{string.categ}</a>
                                        </Link>
                                        <Link href='/device'>
                                            <a className='dropdown-item'>{string.devices}</a>
                                        </Link>

                                        <Link href='/languages' as=''>
                                            <a className='dropdown-item'>{string.languageSelector}</a>
                                        </Link>
                                        <Link href='/type-title'>
                                            <a className='dropdown-item'>{string.userTypeTitle.userTypeTitleTxt}</a>
                                        </Link>
                                    </>
                                )}
                                {(ifAdmin || ifManager || ifSeniorManager || ifCeo) && (
                                    <>
                                        <Link href='/participant'>
                                            <a className='dropdown-item'>{string.organization.organizationAndUser}</a>
                                        </Link>
                                        <Link href='/workers'>
                                            <a className='dropdown-item'>{string.workers}</a>
                                        </Link>
                                        <Link href='/submission-request'>
                                            <a className='dropdown-item'>{string.submissionRequest.submissionRequestsTxt}</a>
                                        </Link>
                                    </>
                                )}
                                {ifAdmin && (
                                    <Link href='/privacy-policy'>
                                        <a className='dropdown-item'>{string.privacyPolicy.privacyPolicy}</a>
                                    </Link>
                                )}

                                {(ifAdmin || ifManager || ifCeo || ifSeniorManager) && (
                                    <>
                                        <Link href='/data-usage-policy'>
                                            <a className='dropdown-item'>{string.requestDatapolicy}</a>
                                        </Link>
                                        <Link href='/form-builder'>
                                            <a className='dropdown-item'>{string.formBuilder.formBuilder}</a>
                                        </Link>
                                    </>
                                )}
                                {!ifAdmin && (
                                    <button className='default-css modal-btn dropdown-item' onClick={getUserAgreement}>
                                        {string.onboarding.userAgreement}
                                    </button>
                                )}
                                {(ifCeo || ifSeniorManager) && (
                                    <Link href='/smart-contracts' as=''>
                                        <a className='dropdown-item'>{string?.smartContract?.title}</a>
                                    </Link>
                                )}

                                <Link href='/user-data-request' as=''>
                                    <a className='dropdown-item'>{string.requestUserdata}</a>
                                </Link>
                                {ifAdmin && (
                                    <Link href='/invitations' as=''>
                                        <a className='dropdown-item'>{string?.invitation?.invitations}</a>
                                    </Link>
                                )}
                                <div as=''>
                                    <a className='dropdown-item'>
                                        <Notification user={user} />
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
                <RequestUser requestuserModal={requestuserModal} toggle={() => setrequestuserModal(!requestuserModal)} userslist={users} purposelist={purpose} />
                {isOpen && <NotificationModal isOpen={isOpen} toggle={toggle} user={user} />}
            </>
        )
    }
}

Header.propTypes = {
    user: PropTypes.shape({
        displayName: PropTypes.string,
        email: PropTypes.string.isRequired,
        isAdmin: PropTypes.number,
        avatarUrl: PropTypes.string,
        isGithubConnected: PropTypes.bool,
    }),
}

Header.defaultProps = {
    user: null,
}

export default withCookies(Header)
