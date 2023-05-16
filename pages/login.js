import Head from 'next/head'
import { useRouter } from 'next/router'
import NProgress from 'nprogress'
import PropTypes from 'prop-types'
import Button from '../components/common/form-elements/button/Button'
import Checkbox from '../components/common/form-elements/checkbox'
import Input from '../components/common/form-elements/input/Input'
import { decipher } from '../utils/decrypt'
import { login } from '../lib/api/auth'
import { recentProject } from '../lib/api/project'
import notify from '../lib/notifier'
import withAuth from '../lib/withAuth'
import { getLanguage } from '../lib/api/language'
import string from '../utils/LanguageTranslation.js'
import { authVerifyStepOne, authVerifyStepTwo, authLogin, verifyToken } from '../lib/api/user-verification'
import '../static/css/forgetPassword.css'
import ForgotPassword from './forgot-password'
import { Modal, ModalHeader, ModalBody, Spinner } from 'reactstrap'
import jwt from 'jsonwebtoken'
import { useCookies } from 'react-cookie'

const LoginWithData = (props) => {
    const [cookies, setCookie] = useCookies(['authToken'])
    const router = useRouter()
    return <LoginWithDataChild {...props} router={router} setCookie={setCookie} cookies={cookies} />
}

class LoginWithDataChild extends React.Component {
    static getInitialProps() {
        const loginPage = true
        return { loginPage }
    }

    static defaultProps = {
        userData: null,
    }

    static propTypes = {
        userData: PropTypes.shape({
            _id: PropTypes.string.isRequired,
        }),
    }

    initializeRoute(router) {
        if (Object.keys(router.query).length) {
            const emailDeciper = decipher('email-verification')
            const user = JSON.parse(emailDeciper(router.query.email))
            this.setState({
                isSignupOpen: true,
                user,
            })
        }
    }

    async componentDidMount() {
        const routerQuery = this.props.router.query
        if ('refer' in routerQuery) {
            this.setState({
                refer: routerQuery.refer,
                project_id: routerQuery.project,
                item: routerQuery.item,
            })
        } else if ('register' in routerQuery) {
            if (routerQuery) {
                const jwtToken = await jwt.verify(routerQuery.register, 'OBINVITESESECRET!@#$%')
                if (jwtToken?.type == 'user' && jwtToken?.orgType) {
                    localStorage.setItem('orgId', jwtToken.orgType)
                    this.setState({ isSignupOpen: true })
                } else {
                    this.setState({ isSignupOpen: true })
                }
            }
        } else {
            this.initializeRoute(this.props.router)
        }
        NProgress.done()
    }

    constructor(props) {
        super(props)
        this.state = {
            userData: props.userData || {},
            isSignupOpen: false,
            refer: '',
            project_id: '',
            item: '',
            user: null,
            modal: false,
            isLoading: false,
            detail: null,
            transactionPassword: '',
            otp: '',
            step: 1,
        }
        this.toggle = this.toggle.bind(this)
        this.handleclose = this.handleclose.bind(this)
    }

    toggle() {
        this.setState((prevState) => ({
            modal: !prevState.modal,
        }))
    }

    handleclose() {
        this.setState({ modal: false })
    }

    closeSignupModal() {
        this.setState({
            isSignupOpen: false,
        })
    }

    onSubmit = (event) => {
        event.preventDefault()
        const { userData, transactionPassword, otp, step } = this.state
        if (step === 1) {
            // for user verification
            const { username, password } = userData
            if (!username) {
                notify(string.login.usernameIsRequired)
                return
            }
            if (!password) {
                notify(string.passReqNot)
                return
            }
            this.handleValidateUser()
        } else if (step === 2) {
            // for transaction password
            if (!transactionPassword) {
                notify(string.login.transactionPasswordIsRequired)
                return
            }
            this.handleValidateTP()
        } else if (step === 3) {
            // for otp
            if (!otp) {
                notify(string.login.otpIsRequired)
                return
            }
            this.handleValidateOTP()
        }
    }

    // validating user
    handleValidateUser = async () => {
        NProgress.start()
        this.setState({ isLoading: true })
        try {
            const { userData } = this.state
            const user = { status: true, data: { name: '', email: '' } }
            const userValidation = await authVerifyStepOne(userData)
            if (userValidation.success && !userValidation?.isPublicUser) {
                this.setState({
                    step: 2,
                    detail: user.data,
                    isLoading: false,
                    userData: { ...userData, ...userValidation.userData },
                })
                this.props.setCookie('authToken', userValidation.tempToken)
            } else if (userValidation?.isPublicUser) {
                this.doLogin(userData)
            } else if (userValidation.error) {
                if (userValidation.error == 'Your account is not active.') {
                    notify(string.login.underReview)
                } else {
                    notify(string.login.accountDoesNotExist)
                }
            } else {
                notify(string.login.usernamePasswordMismatch)
            }
        } catch (error) {
            notify(string.login.usernameNotValid)
        }
        NProgress.done()
        this.setState({ isLoading: false })
    }

    // validating transaction password
    handleValidateTP = async () => {
        NProgress.start()
        this.setState({ isLoading: true })
        try {
            const { transactionPassword, userData } = this.state
            const authToken = this.props.cookies.authToken
            const userValidation = await authVerifyStepTwo({ transactionPassword, authToken })
            if (userValidation.success) {
                this.props.setCookie('authToken', userValidation.tempToken, { path: '/', maxAge: 1000000 })
                if (userData.isSMSAuth) {
                    this.setState({
                        step: 3,
                        isLoading: false,
                    })
                } else {
                    this.doLogin(userData)
                }
            } else {
                notify(string.login.transactionMismatch)
            }
        } catch (error) {
            notify(string.login.transactionPasswordNotValid)
        }
        NProgress.done()
        this.setState({ isLoading: false })
    }

    // validating otp
    handleValidateOTP = async () => {
        NProgress.start()
        this.setState({ isLoading: true })
        try {
            const { userData } = this.state
            const { otp } = this.state
            const authToken = this.props.cookies.authToken
            const userValidation = await authLogin({ otp, authToken })
            if (userValidation.success) {
                this.setState({
                    step: 3,
                    isLoading: false,
                })
                this.props.setCookie('authToken', userValidation.jwt, { path: '/', maxAge: 1000000 })
                await this.doLogin(userData)
            } else {
                notify(string.onboarding.validations.wrongOTP)
            }
        } catch (error) {
            notify(string.login.OTPNotValid)
        }
        NProgress.done()
        this.setState({ isLoading: false })
    }

    doLogin = async (data) => {
        NProgress.start()
        try {
            const userdataAll = await login(data)
            const userdata = userdataAll.user
            window.localStorage.setItem('sessionID', userdataAll.session)
            if (data.remember_me != undefined && data.remember_me == true) {
                this.setState({ isLoading: false })
                window.localStorage.setItem('user', JSON.stringify(userdata.username))
            }

            try {
                NProgress.done()
                const code = userdata.language.toLowerCase() == 'en' ? 'US' : 'MN'
                window.localStorage.setItem('language', code)
                getLanguage(code).then((languageJson) => {
                    if (languageJson) {
                        window.localStorage.setItem('languageJson', JSON.stringify(languageJson.json))
                    }
                })
                if (userdata.role_id == process.env.ROLE_PUBLIC_USER) {
                    window.location.href = '/track-item'
                } else if (this.state.refer == 'explorer') {
                    const cleanUsername = userdata.unique_id
                    const jwtToken = jwt.sign(
                        {
                            username: cleanUsername.toLowerCase(),
                            project_id: this.state.project_id,
                            item_id: this.state.item ? this.state.item.toString() : '',
                            organization: userdata.organization.name.toString().toLowerCase(),
                            createdat: Math.round(new Date().getTime() / 1000),
                        },
                        process.env.EXP_LOGIN_SECRET,
                        { expiresIn: '1d' },
                    )

                    window.location.href = `${process.env.EXPLORER_URL}/#/login/${jwtToken}`
                } else {
                    if (this.props.dataRequestFromEmail) {
                        window.location.href = '/user-data-request'
                        return
                    }

                    if (userdata.role_id == process.env.ROLE_ADMIN) {
                        window.location.href = '/project'
                    } else {
                        const latestProject = await recentProject({ user_id: userdata.id })
                        if (latestProject.project_id) {
                            window.location.href = `/event/${latestProject.project_id}`
                        } else {
                            window.location.href = '/project'
                        }
                    }
                }
            } catch (err) {
                notify(string.login.usernamePasswordMismatch)
                this.setState({ isLoading: false })
                NProgress.done()
            }
        } catch (err) {
            notify(string.login.usernamePasswordMismatch)
            this.setState({ isLoading: false })
            NProgress.done()
        }
    }

    render() {
        const { userData, isLoading, modal, step } = this.state
        return (
            <div className='bg-gradient-primary'>
                <Head>
                    <title>
                        {process.env.APP_NAME} - {string.login.adminLogin}
                    </title>
                </Head>
                <div className='container'>
                    {/* Outer Row */}
                    <div className='row justify-content-center'>
                        <div className='col-xl-10 col-lg-12 col-md-9'>
                            <div className='card o-hidden border-0 shadow-lg my-5'>
                                <div className='card-body p-0'>
                                    {/* Nested Row within Card Body */}
                                    <div className='row'>
                                        <div className='col-lg-6 d-none d-lg-block bg-login-image' />
                                        <div className='col-lg-6'>
                                            <div className='p-5'>
                                                <div className='text-center'>
                                                    <h1 className='h4 text-gray-900 mb-4'>{string.login.welcomeBack}</h1>
                                                </div>
                                                <form className='user' onSubmit={this.onSubmit}>
                                                    {step === 1 && (
                                                        <>
                                                            <div className='form-group'>
                                                                <Input
                                                                    type='text'
                                                                    onChange={(event) => {
                                                                        this.setState({
                                                                            userData: Object.assign({}, userData, {
                                                                                username: event.target.value,
                                                                            }),
                                                                        })
                                                                    }}
                                                                    className='form-control form-control-user'
                                                                    id='login-username'
                                                                    name='username'
                                                                    placeholder={string.login.username}
                                                                />
                                                            </div>
                                                            <div className='form-group'>
                                                                <Input
                                                                    type='password'
                                                                    onChange={(event) => {
                                                                        this.setState({
                                                                            userData: Object.assign({}, userData, {
                                                                                password: event.target.value,
                                                                            }),
                                                                        })
                                                                    }}
                                                                    name='password'
                                                                    className='form-control form-control-user'
                                                                    id='login-password'
                                                                    placeholder={string.onboarding.passWord}
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                    {step === 2 && (
                                                        <div className='form-group'>
                                                            <Input
                                                                type='password'
                                                                onChange={(event) => {
                                                                    this.setState({ transactionPassword: event.target.value })
                                                                }}
                                                                name='transactionPassword'
                                                                className='form-control form-control-user'
                                                                id='transaction-password'
                                                                placeholder={string.onboarding.transactionPassword}
                                                            />
                                                        </div>
                                                    )}
                                                    {step === 3 && (
                                                        <div className='form-group'>
                                                            <Input
                                                                type='password'
                                                                onChange={(event) => {
                                                                    this.setState({ otp: event.target.value })
                                                                }}
                                                                name='otp'
                                                                className='form-control form-control-user'
                                                                id='otp'
                                                                placeholder={string.onboarding.otp}
                                                            />
                                                        </div>
                                                    )}
                                                    <div className='form-group'>
                                                        <div className='custom-control custom-checkbox small'>
                                                            <Checkbox
                                                                onChange={(event) => {
                                                                    this.setState({
                                                                        userData: Object.assign({}, userData, {
                                                                            remember_me: !userData.remember_me,
                                                                        }),
                                                                    })
                                                                }}
                                                                className='custom-control-input'
                                                                name='login-remember'
                                                                id='login-remember'
                                                            />
                                                            <label className='custom-control-label' htmlFor='login-remember'>
                                                                {string.login.rememberMe}
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <Button type='submit' className='btn btn-primary btn-block'>
                                                        {isLoading ? <Spinner size='sm' /> : string.login.login}
                                                    </Button>

                                                    <div className='block-options'>
                                                        <a onClick={this.toggle}>{string.forgotPassword}</a>
                                                    </div>
                                                </form>
                                            </div>

                                            <Modal isOpen={modal} toggle={this.toggle} className={this.props.className}>
                                                <ModalHeader toggle={this.toggle}>{string.passwordReminder}</ModalHeader>
                                                <ModalBody>
                                                    <ForgotPassword handleclose={this.handleclose} />
                                                </ModalBody>
                                            </Modal>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default withAuth(LoginWithData, { logoutRequired: true })
