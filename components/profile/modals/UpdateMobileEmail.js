import React, { useState, useRef } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import PhoneInput from 'react-phone-input-2'
import OtpInput from 'react-otp-input'
import NProgress from 'nprogress'
import { Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'reactstrap'
import string from '../../../utils/LanguageTranslation.js'
import Input from '../../common/form-elements/input/Input'
import FormHelperMessage from '../../common/form-elements/formHelperMessage'
import '../../../static/css/modal.css'
import notify from '../../../lib/notifier'
import { updateUserProfile, invalidateUserProfile } from '../../../lib/api/user'
import { getAccess, callNetworkApi } from '../../../lib/api/network-api'
import { sendEmailOtp, verifyEmailOtp, sendOtpApi, verifyOtpApi } from '../../../lib/api/auth'
import { checkEmail, checkMobile } from '../../../lib/api/onboarding'
import 'react-phone-input-2/lib/style.css'

let emailIdVaildation
let mobileNoVaildation
let allowOtp = false

function UpdateMobileEmail(props) {
    const { userData, openMobileEmailModal, _getProfileData, toggleMobileEmailModal, toggle, ipfsData, updateType } = props
    const isMongolianUser = userData?.country_id == 146
    const [otpSent, setOtpSent] = useState(false)
    const [emailVerified, setEmailVerified] = useState(false)
    const [mobileVerified, setMobileVerified] = useState(false)
    const refSendOtp = useRef()
    const refVerifyMobile = useRef()
    const [verifying, setVerifying] = useState(false)
    const [resending, setResending] = useState(false)
    const refVerifyEmail = useRef()
    const resendBtnDisabled = updateType == 'email' ? (emailVerified == false ? false : true) : mobileVerified == false ? false : true

    const sendOTP = async ({ resend }) => {
        resend ? setResending(true) : setVerifying(true)
        let payload =
            updateType == 'email'
                ? {
                      email: formikEmail.values.emailId.trim(),
                      lang: isMongolianUser ? 'mn' : 'en',
                  }
                : {
                      number: parseInt(formikMobile.values.mobile.trim()),
                      countrycode: formikMobile.values.country_code.trim(),
                      ismobile: 'false',
                      lang: isMongolianUser ? 'mn' : 'en',
                  }
        try {
            if (updateType == 'email') {
                const response = await sendEmailOtp(payload)
                if (response?.status) {
                    notify(`${string.emailSentTxt}`)
                    setOtpSent(true)
                } else {
                    notify(string.onboarding.validations.wrongOTP)
                    setOtpSent(false)
                }
            } else {
                const response = await sendOtpApi(payload)
                if (response.code === 1) {
                    setOtpSent(true)
                    notify(`${string.onboarding.VerificationCodeSent}`)
                } else {
                    notify(`${string.onboarding.validations.invalidNumber}`)
                }
            }
        } catch (err) {
            if (updateType == 'mobile') {
                notify(`${string.onboarding.validations.invalidNumber}`)
            }
            console.log(err)
        }
        setResending(false)
        setVerifying(false)
    }
    const handleVerify = async () => {
        if (otpSent) {
            updateType == 'email' ? refVerifyEmail.current.click() : refVerifyMobile.current.click()
        } else {
            if (updateType == 'email') {
                if (!formikEmail.touched.emailId) {
                    await checkEmailId()
                }
                if (!!emailIdVaildation?.emailId) {
                    setTimeout(() => {
                        formikEmail.setFieldError('emailId', emailIdVaildation.emailId)
                    }, 300)
                } else {
                    refSendOtp.current.click()
                }
            } else {
                if (!formikMobile.touched.mobile) {
                    await checkMobileNo()
                }
                if (!!mobileNoVaildation?.mobile) {
                    setTimeout(() => {
                        formikMobile.setFieldError('mobile', mobileNoVaildation.mobile)
                    }, 300)
                } else {
                    refSendOtp.current.click()
                }
            }
        }
    }

    const verifyOTP = async () => {
        setVerifying(true)
        let payload =
            updateType == 'email'
                ? {
                      email: formikEmail.values.emailId.trim(),
                      otp: parseInt(`${formikOTP.values.otp}`),
                  }
                : {
                      number: parseInt(formikMobile.values.mobile.trim()),
                      otp: formikOTP.values.otp,
                      ismobile: 'false',
                  }
        try {
            if (updateType == 'email') {
                const { verified } = await verifyEmailOtp(payload)
                setEmailVerified(verified)
                if (verified) {
                    await _handleUpdateProfile({ ...userData, email: formikEmail.values.emailId, user_id: userData?.id, updateType: 'email', uniq_id: userData?.unique_id })
                    notify(`${string.apiResponses.emailUpdatedSuccessfully}`)
                } else {
                    notify(`${string.onboarding.validations.wrongCode}`)
                }
            } else {
                const response = await verifyOtpApi(payload)
                if (response.code === 1) {
                    await _handleUpdateProfile({ ...userData, country_code: formikMobile.values.country_code, mobile: formikMobile.values.mobile, user_id: userData?.id, updateType: 'mobile', uniq_id: userData?.unique_id })
                    setMobileVerified(true)
                    notify(`${string.apiResponses.phoneNoUpdatedSuccessfully}`)
                } else {
                    setMobileVerified(false)
                    notify(`${string.onboarding.validations.wrongOTP}`)
                }
            }
        } catch (err) {
            setEmailVerified(false)
            setMobileVerified(false)
            notify(`${string.onboarding.validations.errorOccurred}`)
        }
        setResending(false)
        setVerifying(false)
    }

    const checkEmailId = async () => {
        try {
            formikEmail.setFieldTouched('emailId', true)
            allowOtp = false
            if (!formikEmail.errors.emailId) {
                const { code } = await checkEmail({ email: formikEmail.values.emailId ?? '' })
                if (code == 400) {
                    formikEmail.setFieldError('emailId', string.apiResponses.emailAlreadyExists)
                    emailIdVaildation = { emailId: string.apiResponses.emailAlreadyExists }
                    setResending(false)
                    setVerifying(false)
                } else {
                    emailIdVaildation = {}
                    allowOtp = true
                    setResending(false)
                    setVerifying(false)
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    const checkMobileNo = async () => {
        try {
            formikMobile.setFieldTouched('mobile', true)
            allowOtp = false
            if (!formikMobile.errors.mobile && formikMobile.values.mobile.length > 4) {
                const { code } = await checkMobile({ mobile: formikMobile.values.mobile, country_code: formikMobile.values.country_code ?? '' })
                if (code == 400) {
                    formikMobile.setFieldError('mobile', string.onboarding.validations.phoneAlreadyUsed)
                    mobileNoVaildation = { mobile: string.onboarding.validations.phoneAlreadyUsed }
                    setResending(false)
                    setVerifying(false)
                } else {
                    mobileNoVaildation = {}
                    allowOtp = true
                    setResending(false)
                    setVerifying(false)
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    const formikEmail = useFormik({
        initialValues: {
            emailId: ipfsData?.email ?? '',
        },
        validationSchema: Yup.object({
            emailId: Yup.string().trim().email(`${string.onboarding.email} ${string.errors.email}`).required(`${string.onboarding.email} ${string.errors.required}`),
        }),
        onSubmit: (values) => {
            if (!emailIdVaildation?.emailId && allowOtp) {
                sendOTP({ resend: false })
            }
        },
    })

    const formikMobile = useFormik({
        initialValues: {
            country_code: userData.country_code ?? '',
            mobile: ipfsData?.phoneNumber ?? '',
        },
        validationSchema: Yup.object({
            mobile: Yup.string().trim().required(`${string.cellNo} ${string.errors.required}`),
        }),
        onSubmit: (values) => {
            if (!mobileNoVaildation?.mobile && allowOtp) {
                sendOTP({ resend: false })
            }
        },
    })

    const formikOTP = useFormik({
        initialValues: {
            otp: '',
        },
        validationSchema: Yup.object({
            otp: Yup.number()
                .test('len', `${string.otp} ${string.errors.required}`, (val) => val?.toString().length === 6)
                .required(`${string.otp} ${string.errors.required}`),
        }),
        onSubmit: (values) => {
            verifyOTP()
        },
    })

    const _handleUpdateProfile = async (formData) => {
        NProgress.start()

        try {
            const response = await updateUserProfile(formData)
            if (response.emailAlreadyExists) {
                throw string.apiResponses.sameEmailExists
            }

            if (response.usernameAlreadyExists) {
                throw string.apiResponses.sameUsernameExists
            }

            // Get access token
            const accesstoken = await getAccess(formData.uniq_id)
            if (accesstoken.error) {
                throw accesstoken.error
            }

            // Store data on IPFS
            const ipfsDataObj = {
                firstName: formData.first_name,
                lastName: formData.last_name,
                userId: formData.uniq_id,
                email: formData.email,
                phoneNumber: formData.mobile,
                orgName: userData.organization.blockchain_name,
            }
            const ipfsResponse = await callNetworkApi(accesstoken, 'update-details', ipfsDataObj)
            if (!ipfsResponse.success) {
                throw ipfsResponse
            }
            await _getProfileData()
            toggleMobileEmailModal()
            toggle()
            if (process.env.ROLE_CEO != String(userData.role_id) && process.env.ROLE_SENIOR_MANAGER != String(userData.role_id) && process.env.ROLE_ADMIN != String(userData.role_id)) {
                const result = await invalidateUserProfile()
                if (result.status) {
                    window.location.href = `${process.env.SITE_URL}/logout`
                }
            }
        } catch (err) {
            notify(err.error || err.toString())
        }

        NProgress.done()
    }

    return (
        <Modal isOpen={openMobileEmailModal} toggle={toggleMobileEmailModal} className='customModal'>
            <ModalHeader cssModule={{ 'modal-title': 'modal-title text-uppercase text-dark font-weight-bold' }} toggle={toggleMobileEmailModal}>
                {updateType == 'email' ? `${string.updateBtnTxt} ${string.login.email}` : `${string.updateBtnTxt} ${string.cellNo}`}
            </ModalHeader>
            <ModalBody>
                <div>
                    {updateType == 'email' ? (
                        <form onSubmit={formikEmail.handleSubmit}>
                            <div className={`form-group col-md-12 p-0${otpSent ? ' mb-3' : ' mb-0'}`}>
                                <label htmlFor='email' className='col-md-12 col-form-label pl-0'>
                                    {string.participant.email}
                                </label>
                                <Input type='text' name='emailId' autoComplete='off' id='emailId' className='form-control' disabled={otpSent} value={formikEmail.values.emailId} onChange={formikEmail.handleChange} onBlur={checkEmailId} placeholder={string.participant.email} />
                                {formikEmail.errors.emailId && formikEmail.touched.emailId ? <FormHelperMessage message={formikEmail.errors.emailId} className='error mt-2' /> : null}
                            </div>
                            <button ref={refSendOtp} className='hidden-btn' type='submit'>
                                Submit
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={formikMobile.handleSubmit}>
                            <div className='form-group col-md-12 p-0'>
                                <label htmlFor='tel-input' className='col-md-12 col-form-label pl-0'>
                                    {string.cellNo}
                                </label>
                                <PhoneInput
                                    inputClass={'update-tel-input'}
                                    id='tel-input'
                                    country={'mn'}
                                    placeholder={`${string.worker.phone}`}
                                    specialLabel={`${string.onboarding.yourPhoneNo}`}
                                    value={formikMobile.values.country_code + formikMobile.values.mobile}
                                    disabled={otpSent}
                                    inputProps={{
                                        name: 'mobile',
                                    }}
                                    onChange={(number, selectedData) => {
                                        let dialCode = selectedData.dialCode
                                        formikMobile.setFieldValue('country_code', '+' + dialCode)
                                        let contactNo = number.substring(dialCode.length)
                                        formikMobile.setFieldValue('mobile', contactNo)
                                    }}
                                    onBlur={checkMobileNo}
                                />
                                <div style={{ display: 'block' }}>{formikMobile.errors.mobile && formikMobile.touched.mobile ? <div className='error mt-2'>{formikMobile.errors.mobile}</div> : null}</div>
                            </div>
                            <button ref={refSendOtp} style={{ visibility: 'hidden' }} type='submit' className='hidden-btn'>
                                Send OTP
                            </button>
                        </form>
                    )}
                    <form onSubmit={formikOTP.handleSubmit}>
                        {otpSent && (
                            <>
                                <div className='form-group col-md-12 p-0 m-0'>
                                    <label className='col-md-12 col-form-label pl-0'>{string.otp}</label>
                                    <div className='d-flex otp-number'>
                                        <OtpInput
                                            value={formikOTP.values.otp}
                                            onChange={(e) => formikOTP.setFieldValue('otp', e)}
                                            numInputs={6}
                                            isInputNum={true}
                                            isDisabled={emailVerified}
                                            disabledStyle={{ backgroundColor: 'transparent' }}
                                            separator={<span>&nbsp;</span>}
                                            hasErrored={formikOTP.errors.otp && formikOTP.touched.otp ? true : false}
                                            inputStyle={{ fontSize: '20px', marginRight: '30px', borderLeft: 'none', borderTop: 'none', borderRight: 'none' }}
                                        />
                                    </div>
                                    {formikOTP.errors.otp && formikOTP.touched.otp && <p className='error mt-2 mb-0'>{formikOTP.errors.otp}</p>}
                                </div>
                                <button ref={updateType == 'email' ? refVerifyEmail : refVerifyMobile} className='hidden-btn' type='submit'>
                                    Verify mobile
                                </button>
                            </>
                        )}
                    </form>
                </div>
            </ModalBody>
            <ModalFooter>
                <div className='profile-btns'>
                    <button onClick={handleVerify} className='btn btn-primary large-btn mr-3' disabled={emailVerified || mobileVerified}>
                        {verifying ? <Spinner size='sm' /> : `${string.onboarding.btn.Verify}`}
                    </button>
                    <button onClick={() => sendOTP({ resend: true })} className='btn btn-primary large-btn' disabled={otpSent == false ? true : resendBtnDisabled}>
                        {resending ? <Spinner size='sm' /> : `${string.onboarding.btn.resendCode}`}
                    </button>
                </div>
            </ModalFooter>
        </Modal>
    )
}

export default UpdateMobileEmail
