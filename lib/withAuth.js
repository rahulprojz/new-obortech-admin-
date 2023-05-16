import React from 'react'
import PropTypes from 'prop-types'
import Router, { withRouter } from 'next/router'
import { connect } from 'react-redux'
import jwt from 'jsonwebtoken'
import { getOrg } from './api/organization'
import { decipher } from '../utils/decrypt'
import { toggleDataRequestFromEmail } from '../redux/actions/gdprActions'
import { adminURL, userURL, ceoURL, managerURL, seniorManagerURL, publicUserURL } from './constants'

let globalUser = null

export default function withAuth(BaseComponent, { loginRequired = true, logoutRequired = false, adminRequired = false } = {}) {
    class App extends React.PureComponent {
        static propTypes = {
            user: PropTypes.shape({
                id: PropTypes.string,
                isAdmin: PropTypes.number,
            }),
            isFromServer: PropTypes.bool.isRequired,
        }

        static defaultProps = {
            user: null,
        }

        static async getInitialProps(ctx) {
            const isFromServer = !!ctx.req
            const user = ctx.req ? ctx.req.user : globalUser

            if (isFromServer && user) {
                user.id = user.id.toString()
            }

            const props = { user, isFromServer }
            if (BaseComponent.getInitialProps) {
                Object.assign(props, (await BaseComponent.getInitialProps(ctx)) || {})
            }

            return props
        }

        urlHelper = (urls) => {
            const path = Router.pathname
            if (!urls.includes(path) && path !== '/') {
                window.location.href = '/project'
            }
        }
        urlPublicHelper = (urls) => {
            const path = Router.pathname
            if (!urls.includes(path) && path !== '/') {
                window.location.href = '/track-item'
            }
        }
        urlRestHelper = (urls) => {
            const path = Router.pathname
            const pathCheck = path.split('/');
            if (!urls.includes(`/${pathCheck[1]}`) && path !== '/') {
                window.location.href = '/allevent'
            }
        }

        adminManager = () => {
            const path = Router.pathname
            if (path.includes('inventory')) {
                window.location.href = '/project'
            }
        }

        async componentDidMount() {
            const { user, router } = this.props
            const queryParams = new URLSearchParams(window.location.search)
            const uid = queryParams.get('uid')
            const ruid = queryParams.get('ruid')
            const rejectType = queryParams.get('rejectType')
            const { isUserApproval, project_id } = router.query
            const isRejectApproval = queryParams.get('isRejectApproval')
            const isShareProfile = queryParams.get('isShareProfile')
            if (user) {
                switch (user?.role_id) {
                    case parseInt(process.env.ROLE_PUBLIC_USER):
                        this.urlPublicHelper(publicUserURL)
                        break
                    case parseInt(process.env.ROLE_USER):
                        this.urlRestHelper(userURL)
                        break
                    case parseInt(process.env.ROLE_ADMIN):
                        this.adminManager()
                        this.urlHelper(adminURL)
                        break
                    case parseInt(process.env.ROLE_CEO):
                        this.adminManager()
                        this.urlRestHelper(ceoURL)
                        break
                    case parseInt(process.env.ROLE_SENIOR_MANAGER):
                        this.adminManager()
                        this.urlRestHelper(seniorManagerURL)
                        break
                    case parseInt(process.env.ROLE_MANAGER):
                        this.urlHelper(managerURL)
                        break
                    default:
                        break
                }
            }
            const isFromEmail = !!window.location.href.includes('/user-data-request')
            if (isFromEmail) this.props.toggleDataRequestFromEmail()
            const { isFromServer } = this.props
            if (isFromServer) {
                globalUser = user
            }

            if (isUserApproval === 'true') {
                localStorage.setItem('isUserApproval', isUserApproval)
            }

            if (project_id && (isRejectApproval === 'true' || isShareProfile === 'true')) {
                localStorage.setItem('rejectApprovalProjectId', project_id)
                localStorage.setItem('rejectApprovalUserId', uid)
                localStorage.setItem('rejectApprovalReceiverUserId', ruid)
                localStorage.setItem('rejectType', rejectType)
                localStorage.setItem('approvalModalType', isRejectApproval === 'true' ? 'rejectApproval' : 'shareProfile')
            }

            if (loginRequired && !logoutRequired && !user) {
                Router.push('/login')
                return
            }

            if (localStorage.getItem('isUserApproval') === 'true' && user) {
                if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', '/participant')
                }
                localStorage.setItem('isUserApproval', 'false')
                return
            }

            const projectId = localStorage.getItem('rejectApprovalProjectId')
            const approvalModalType = localStorage.getItem('approvalModalType')
            if (projectId && user && localStorage.getItem('isOpenRejectApprovalModal') !== 'true' && approvalModalType === 'rejectApproval' && user.id == ruid) {
                localStorage.setItem('rejectApprovalProjectId', '')
                localStorage.setItem('isOpenRejectApprovalModal', 'true')
                Router.push(`/event/${projectId}`)
                return
            }

            if (projectId && user && localStorage.getItem('isOpenShareProfileModal') !== 'true' && approvalModalType === 'shareProfile' && user.id == ruid) {
                localStorage.setItem('rejectApprovalProjectId', '')
                localStorage.setItem('isOpenShareProfileModal', 'true')
                Router.push(`/event/${projectId}`)
                return
            }

            if (adminRequired && (!user || !user.isAdmin)) {
                if (window?.location?.search?.includes('email') && !window?.location?.search?.includes('isOnBoard=true')) {
                    const emailDeciper = decipher('email-verification')
                    const userEmail = JSON.parse(emailDeciper(window?.location?.search?.split('=')[1]))
                    if (userEmail?.email !== user.email) {
                        window.location.href = `${process.env.SITE_URL}/logout?${window?.location?.search}&isOnBoard=true`
                    } else {
                        Router.push('/project')
                    }
                }
                Router.push('/project')
            }

            if (logoutRequired && user) {
                if (location.search.search('refer=explorer') !== -1) {
                    const routerQuery = Router.query
                    const organization = await getOrg({ id: user?.organization_id })

                    // JWT token for Exp login
                    const jwtToken = jwt.sign(
                        {
                            username: user.unique_id,
                            project_id: routerQuery.project,
                            item_id: routerQuery.item ? routerQuery.item.toString() : '',
                            organization: organization.name.toString().toLowerCase(),
                            createdat: Math.round(new Date().getTime() / 1000),
                        },
                        process.env.EXP_LOGIN_SECRET,
                        { expiresIn: '1d' },
                    )

                    window.location.href = `${process.env.EXPLORER_URL}/#/login/${jwtToken}`
                } else if (window?.location?.search?.includes('email')) {
                    if (!window?.location?.search?.includes('isOnBoard=true')) {
                        const emailDeciper = decipher('email-verification')
                        const userEmail = JSON.parse(emailDeciper(window?.location?.search?.split('=')[1]))
                        if (userEmail?.email !== user.email) {
                            window.location.href = `${process.env.SITE_URL}/logout${window?.location?.search}&isOnBoard=true`
                        } else {
                            Router.push('/project')
                        }
                    } else {
                        window.location.href = `${process.env.SITE_URL}/logout`
                        return true
                    }
                } else {
                    Router.push('/project')
                }
            }
        }

        render() {
            const { user } = this.props

            if (loginRequired && !logoutRequired && !user) {
                return null
            }

            if (adminRequired && (!user || !user.isAdmin)) {
                return null
            }

            if (logoutRequired && user) {
                return null
            }

            return (
                <React.Fragment>
                    <BaseComponent {...this.props} />
                </React.Fragment>
            )
        }
    }

    function mapStateToProps(state) {
        return { dataRequestFromEmail: state.gdpr.dataRequestFromEmail }
    }

    function mapDispatchToProps(dispatch) {
        return {
            // dispatching plain actions
            toggleDataRequestFromEmail: () => dispatch(toggleDataRequestFromEmail()),
        }
    }

    return connect(mapStateToProps, mapDispatchToProps)(withRouter(App))
}
