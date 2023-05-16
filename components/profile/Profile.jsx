import React, { useEffect, useState } from 'react'
import { Modal, ModalBody, ModalHeader, ModalFooter, Spinner } from 'reactstrap'
import { uniqBy } from 'lodash'
import ProfileCard from './ProfileCard'
import DataView from './DataView'
import NProgress from 'nprogress'
import Button from '../common/form-elements/button/Button'
import string from '../../utils/LanguageTranslation'
import { otherLanguage } from '../../utils/selectedLanguage'
import UpdateProfile from './UpdateProfile'
import DeleteAccount from './DeleteAccount'
import { getApprovers } from '../../lib/api/organization'
import { callNetworkApi } from '../../lib/api/network-api'
import { fetchUserById } from '../../lib/api/user'
import { sanitize } from '../../utils/globalFunc'
import { login, sendOtpApi, verifyOtpApi } from '../../lib/api/auth'
import InvalidateWarningModal from './modals/InvalidateWarning'
import UpdateMobileEmail from './modals/UpdateMobileEmail'
import ResetPassword from './modals/ResetPassword'
import notify from '../../lib/notifier'
import './profile.css'
import '../../static/css/modal.css'
import VerifyOtpModal from '../common/verifyOtpModal'
import LoginModal from '../common/LoginModal'
import OrgCard from './OrgCard'
import UserProfileCard from './UserProfileCard'
import { authVerifyStepOne } from '../../lib/api/user-verification'

function Profile({ user, cookies }) {
    const [modal, setModal] = useState(false)
    const [updateType, setUpdateType] = useState('')
    const [openEditModal, setOpenEditModal] = useState(false)
    const [openMobileEmailModal, setOpenMobileEmailModal] = useState(false)
    const [openConfirmModal, setOpenConfirmModal] = useState(false)
    const [approverOrgs, setApproverOrgs] = useState({})
    const [ipfsData, setIpfsData] = useState({})
    const [userData, setUserData] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingLoginModal, setIsLoadingLoginModal] = useState(false)
    const [isOpenWarningModal, setIsOpenWarningModal] = useState(false)
    const [isOpenOtpModal, setIsOpenOtpModal] = useState(false)
    const [isOpenLoginModal, setIsOpenLoginModal] = useState(false)
    const [isLoadingOtpModal, setIsLoadingOtpModal] = useState(false)
    const [isVerified, setIsVerified] = useState(false)
    const [isOpenResetPwdModal, setIsOpenResetPwdModal] = useState(false)
    const isAdminUser = process.env.ROLE_ADMIN === String(user.role_id)
    const isCEOUser = process.env.ROLE_CEO === String(user.role_id)
    const isSeniorManager = process.env.ROLE_SENIOR_MANAGER === String(user.role_id)
    const isUser = process.env.ROLE_USER === String(user.role_id)
    const isManager = process.env.ROLE_MANAGER === String(user.role_id)

    const _getProfileData = async () => {
        try {
            setIsLoading(true)
            const userUniqId = user.unique_id.toLowerCase()
            const userData = await fetchUserById({ id: user.id })

            setUserData(userData)

            //Get user details
            const getUserObj = {
                userId: userUniqId,
                orgName: sanitize(userData.organization.blockchain_name),
            }
            const userResponse = await callNetworkApi(cookies.cookies.authToken, '', getUserObj)
            if (!userResponse.success) {
                console.log(userResponse.error)
            }

            setIpfsData(userResponse.data)

            const approverOrgs = await getApprovers({
                orgId: user.organization_id,
            })
            // For avoid the duplicate organization data
            setApproverOrgs(uniqBy(approverOrgs, 'approver.name'))

            setIsLoading(false)
        } catch (err) {
            notify(err.message || err.toString())
        }
    }

    const handleResetPwdModal = () => setIsOpenResetPwdModal((isOpen) => !isOpen)

    const toggle = () => setModal(!modal)

    const toggleMobileEmailModal = () => {
        setOpenMobileEmailModal(!openMobileEmailModal)
        _handleWarningOnToggle(false)
    }

    const toggleEdit = () => {
        setOpenEditModal(!openEditModal)
        _handleWarningOnToggle(false)
    }

    const toggleDeleteAcc = () => setOpenConfirmModal(!openConfirmModal)

    const _handleWarningOnToggle = (val) => {
        setIsOpenWarningModal(val === true ? true : false)
    }

    const sendOTP = async ({ country_code, mobile, isMongolianUser }) => {
        let payload = {
            number: parseInt(mobile.trim()),
            countrycode: country_code.trim(),
            ismobile: 'false',
            lang: isMongolianUser ? 'mn' : 'en',
        }
        try {
            const response = await sendOtpApi(payload)
            if (response.code === 1) {
                notify(`${string.onboarding.VerificationCodeSent}`)
            } else {
                notify(`${string.onboarding.validations.invalidNumber}`)
            }
            return true
        } catch (err) {
            notify(`${string.onboarding.validations.invalidNumber}`)
            console.log(err)
            return false
        }
    }

    const verifyOTP = async ({ otp }) => {
        setIsVerified(false)
        setIsLoadingOtpModal(true)
        const payload = {
            // eslint-disable-next-line radix
            number: parseInt(user?.mobile.trim()),
            otp,
            ismobile: 'false',
        }
        try {
            const response = await verifyOtpApi(payload)
            if (response.code === 1) {
                setIsVerified(true)
                setIsOpenOtpModal(false)
            } else {
                notify(`${string.onboarding.validations.wrongOTP}`)
            }
            setIsLoadingOtpModal(false)
        } catch (err) {
            setIsLoadingOtpModal(false)
            notify(`${string.onboarding.validations.errorOccurred}`)
        }
    }

    const handleLogin = async (data) => {
        setIsLoadingLoginModal(true)
        setIsVerified(false)
        try {
            // Check user status in LOCAL db
            const userdata = data
            const userValidation = await authVerifyStepOne(userdata)
            if (!userValidation.success) {
                notify(userStatus.message)
                setIsLoadingLoginModal(false)
                NProgress.done()
                return false
            }

            if (userValidation.success) {
                const { country_id, country_code, mobile } = user
                const isMongolianUser = country_id == 146
                await sendOTP({ country_code, mobile, isMongolianUser })
                setIsLoadingLoginModal(false)
                setIsOpenOtpModal(true)
                setIsOpenLoginModal(false)
            }
        } catch (err) {
            notify(string.login.usernamePasswordMismatch)
            setIsLoadingLoginModal(false)
        }
    }

    const loginHandler = (formdata) => {
        const { username, password } = formdata

        if (!username) {
            notify(string.login.usernameIsRequired)
            return
        }

        if (!password) {
            notify(string.passReqNot)
            return
        }

        handleLogin(formdata)
    }

    useEffect(() => {
        if (modal) {
            _getProfileData()
        }
    }, [modal])

    useEffect(() => {
        if (isVerified) {
            setUpdateType('')
            if (isCEOUser || isUser || isManager || isSeniorManager) {
                _handleWarningOnToggle(true)
            } else {
                toggleEdit()
            }
        }
    }, [isVerified])

    return (
        <div className='profile-modal-wrap'>
            <Button className='modal-btn' onClick={toggle}>
                {string.profile}
            </Button>

            {/* LOGIN MODAL */}
            {isOpenLoginModal && <LoginModal isOpen={isOpenLoginModal} username={userData?.username} toggle={() => setIsOpenLoginModal(!isOpenLoginModal)} onSubmit={loginHandler} isLoading={isLoadingLoginModal} />}

            {/* VERIFY OTP MODAL */}
            {isOpenOtpModal && <VerifyOtpModal isOpen={isOpenOtpModal} toggle={() => setIsOpenOtpModal(!isOpenOtpModal)} isLoading={isLoadingOtpModal} onSubmit={verifyOTP} />}
            {/* VIEW PROFILE MODAL */}
            <Modal isOpen={modal} toggle={toggle} className='modal-lg profile-modal customModal'>
                <ModalHeader cssModule={{ 'modal-title': 'modal-title text-uppercase text-dark font-weight-bold' }} toggle={toggle}>
                    {string.profile}
                </ModalHeader>
                <ModalBody>
                    <div className='d-flex flex-column align-items-center'>
                        {isLoading && (
                            <div className='loader-profiledata'>
                                <Spinner size='sm' />
                            </div>
                        )}
                        <div className={isLoading ? 'details-wrap disabled-block' : 'details-wrap'}>
                            <div className='card-wrap'>
                                <OrgCard
                                    userData={userData?.organization?.country_id == 146 ? userData : ''}
                                    from='profile'
                                    heading={otherLanguage && userData?.organization?.local_name ? userData?.organization?.local_name : userData?.organization?.name}
                                    caption={userData?.organization?.user_type?.name}
                                    stateRegId={userData?.organization?.state_registration_id || ''}
                                    showVerified='1'
                                    icon='frieght-icon'
                                    idData={userData?.organization?.unique_id ? { label: string.onboarding.orgId, id: userData?.organization?.unique_id } : ''}
                                    approverOrgs={approverOrgs}
                                />

                                <UserProfileCard
                                    userData={userData?.country_id == 146 ? userData : ''}
                                    from='profile'
                                    heading={userData?.username}
                                    caption={userData?.user_title?.name}
                                    showVerified='0'
                                    user={user}
                                    icon='admin-icon'
                                    idData={userData?.unique_id ? { label: string.onboarding.userId, id: userData?.unique_id } : ''}
                                    regData={userData?.registration_number ? { label: string.onboarding.regNumber, id: userData?.registration_number } : ''}
                                    approverOrgs={approverOrgs}
                                />
                            </div>
                            <div className='profile-details'>
                                {ipfsData?.firstName && !otherLanguage && <DataView heading={string.onboarding.firstName} caption={ipfsData?.firstName} />}
                                {userData?.local_first_name && otherLanguage && <DataView heading={string.onboarding.localFirstName} caption={userData?.local_first_name} />}
                                {ipfsData?.lastName && !otherLanguage && <DataView heading={string.onboarding.lastName} caption={ipfsData?.lastName} />}
                                {userData?.local_last_name && otherLanguage && <DataView heading={string.onboarding.localLastName} caption={userData?.local_last_name} />}
                                {ipfsData?.email && (
                                    <div className='row'>
                                        <DataView heading={string.participant.email} caption={ipfsData?.email} className='mr-2' />
                                        <i
                                            className='fa fa-pencil-alt cursor-pointer'
                                            onClick={() => {
                                                setUpdateType('email')
                                                if (isAdminUser) {
                                                    toggleMobileEmailModal()
                                                } else {
                                                    _handleWarningOnToggle(true)
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                                {ipfsData?.phoneNumber && (
                                    <div className='row'>
                                        <DataView heading={string.participant.mobile} caption={`${userData?.country_code || '376'}-${ipfsData?.phoneNumber} `} className='mr-2' />
                                        <i
                                            className='fa fa-pencil-alt cursor-pointer'
                                            onClick={() => {
                                                setUpdateType('mobile')
                                                if (isAdminUser) {
                                                    toggleMobileEmailModal()
                                                } else {
                                                    _handleWarningOnToggle(true)
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                                <DataView heading={string.onboarding.city} caption={userData?.city?.name} />
                                <DataView heading={string.onboarding.state} caption={userData?.state?.name} />
                                <DataView heading={string.onboarding.country} caption={userData?.country?.name} />
                            </div>
                            <div className='profile-authentication d-flex justify-content-between'>
                                <DataView heading={string.organization.smsAuthentication} caption={userData.isSMSAuth ? string.enabled : string.disabled} />
                            </div>
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <div className={isLoading ? 'profile-btns disabled-block' : 'profile-btns'}>
                        <Button
                            className='btn btn-primary large-btn'
                            onClick={() => {
                                setIsOpenLoginModal(true)
                            }}
                        >
                            {string.editProfile}
                        </Button>
                        {ipfsData?.email && (
                            <Button className='btn btn-primary ml-2 large-btn' onClick={toggleDeleteAcc}>
                                {string.deleteAccBtn}
                            </Button>
                        )}
                        <Button className='btn btn-primary large-btn ml-2' onClick={handleResetPwdModal}>
                            {string.profilePwd?.resetPwdBtn}
                        </Button>
                    </div>
                </ModalFooter>
            </Modal>

            {/* UPDATE PROFILE MODAL */}
            {openEditModal && <UpdateProfile cookies={cookies} openEditModal={openEditModal} toggleEdit={toggleEdit} toggle={toggle} userData={userData} ipfsData={ipfsData} _getProfileData={_getProfileData} />}

            {/* UPDATE EMAIL AND MOBILE NUMBER MODAL */}
            {openMobileEmailModal && <UpdateMobileEmail openMobileEmailModal={openMobileEmailModal} toggleMobileEmailModal={toggleMobileEmailModal} toggle={toggle} ipfsData={ipfsData} userData={userData} _getProfileData={_getProfileData} updateType={updateType} />}

            {/* DELETE ACCOUNT MODAL */}
            {openConfirmModal && <DeleteAccount cookies={cookies} userData={userData} openConfirmModal={openConfirmModal} toggleDeleteAcc={toggleDeleteAcc} />}

            {isOpenWarningModal && <InvalidateWarningModal isOpen={isOpenWarningModal} onToggle={_handleWarningOnToggle} onSubmit={updateType ? toggleMobileEmailModal : toggleEdit} />}
            <ResetPassword isOpen={isOpenResetPwdModal} user={user} onToggle={handleResetPwdModal} />
        </div>
    )
}

export default Profile
