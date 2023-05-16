import { useFormik } from 'formik'
import { useContext, useRef, useState, useMemo } from 'react'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { sendOtpApi, verifyOtpApi } from '../../lib/api/auth'
import OnBoardContext from '../../store/onBoard/onBordContext'
import string from '../../utils/LanguageTranslation.js'
import * as Yup from 'yup'
import { Spinner } from 'reactstrap'
import notify from '../../lib/notifier'
import { checkMobile } from '../../lib/api/onboarding'
import OtpInput from 'react-otp-input'

let mobileNoVaildation
let allowOtp = false

const VerifyMobile = () => {
    const { setSelectedStep, setOnboarding, onboarding, decodedToken } = useContext(OnBoardContext)
    const [otpSent, setOtpSent] = useState(onboarding.mobileOtpSent ?? false)
    const [mobileVerified, setMobileVerified] = useState(onboarding.mobileVerified ?? false)
    const refSendOtp = useRef()
    const refVerifyMobile = useRef()
    const [verifying, setVerifying] = useState(false)
    const [resending, setResending] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleNext = () => {
        if (mobileVerified) {
            setOnboarding({ type: 'updateOrgInfo', payload: { mobileOtpSent: otpSent, mobileVerified, country_code: formik.values.country_code, mobile: formik.values.mobile } })
            setSelectedStep('step4')
        } else {
            if (formik.values.mobile) {
                notify(`${string.plzVerify}`)
            } else {
                notify(`${string.onboarding.verify} ${string.onboarding.validations.mobileNo}`)
            }
        }
    }
    const handlePrevious = () => {
        setSelectedStep('step2')
    }
    const sendOTP = async ({ resend }) => {
        if (resend) {
            toggleLoading('resend')
        } else {
            toggleLoading('verify')
        }
        let payload = {
            number: parseInt(formik.values.mobile.trim()),
            countrycode: formik.values.country_code.trim(),
            ismobile: 'false',
            lang: decodedToken.language,
        }
        try {
            if ((!loading && !otpSent) || resend) {
                const response = await sendOtpApi(payload)
                if (response.code === 1) {
                    setOtpSent(true)
                    notify(`${string.onboarding.VerificationCodeSent}`)
                } else {
                    notify(`${string.onboarding.validations.invalidNumber}`)
                }
                setLoading(false)
            }
        } catch (err) {
            console.log(err)
            setLoading(false)
            notify(`${string.onboarding.validations.invalidNumber}`)
        }
        setResending(false)
        setVerifying(false)
    }

    const verifyOTP = async () => {
        toggleLoading('verify')
        let payload = {
            number: parseInt(formik.values.mobile.trim()),
            otp: formikOTP.values.otp,
            ismobile: 'false',
        }
        try {
            const response = await verifyOtpApi(payload)
            if (response.code === 1) {
                setMobileVerified(true)
                notify(`${string.apiResponses.phoneNoVerifiedSuccessfully}`)
            } else {
                setMobileVerified(false)
                notify(`${string.onboarding.validations.wrongOTP}`)
            }
        } catch (err) {
            setMobileVerified(false)
            notify(`${string.onboarding.validations.wrongOTP}`)
        }
        setResending(false)
        setVerifying(false)
    }

    const sendOTPfuntion = async () => {
        try {
            setLoading(true)
            if (!loading) {
                const { code } = await checkMobile({ mobile: formik.values.mobile, country_code: formik.values.country_code ?? '' })
                if (code == 400) {
                    formik.setFieldError('mobile', string.onboarding.validations.phoneAlreadyUsed)
                    mobileNoVaildation = { mobile: string.onboarding.validations.phoneAlreadyUsed }
                    setResending(false)
                    setVerifying(false)
                    setLoading(false)
                } else {
                    mobileNoVaildation = {}
                    allowOtp = true
                    setResending(false)
                    setVerifying(false)
                }
                if (!mobileNoVaildation?.mobile && allowOtp) {
                    sendOTP({ resend: false })
                }
            }
        } catch (err) {
            setLoading(false)
            console.log(err)
        }
    }

    const formik = useFormik({
        initialValues: {
            country_code: onboarding.country_code ?? '',
            mobile: onboarding.mobile ?? '',
        },
        validationSchema: Yup.object({
            mobile: Yup.string().trim().required(`${string.cellNo} ${string.errors.required}`),
        }),
        onSubmit: async (values) => {
            toggleLoading('verify')
            sendOTPfuntion()
        },
    })

    const formikOTP = useFormik({
        initialValues: {
            otp: '',
        },
        validationSchema: Yup.object({
            otp: Yup.string()
                .test('len', `${string.onboarding.validations.otp} ${string.errors.required}`, (val) => val?.toString().length === 6)
                .required(`${string.onboarding.validations.otp} ${string.errors.required}`),
        }),
        onSubmit: (values) => {
            verifyOTP()
        },
    })
    const handleVerify = () => {
        if (otpSent) {
            refVerifyMobile.current.click()
        } else {
            if (!!mobileNoVaildation?.mobile && !formik.errors.mobile) {
                formik.setFieldError('mobile', string.onboarding.validations.phoneAlreadyUsed)
                mobileNoVaildation = { mobile: string.onboarding.validations.phoneAlreadyUsed }
                setResending(false)
                setVerifying(false)
            } else {
                refSendOtp.current.click()
            }
        }
    }

    const checkMobileNo = async (mobile, countryCode) => {
        try {
            allowOtp = false
            if (!formik.errors.mobile && mobile > 4) {
                formik.setFieldTouched('mobile', true)
                const { code } = await checkMobile({ mobile, country_code: countryCode ?? '' })
                if (code == 400) {
                    formik.setFieldError('mobile', string.onboarding.validations.phoneAlreadyUsed)
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

    useMemo(() => {
        checkMobileNo(formik.values.mobile)
    }, [formik.values.mobile, formik.errors.mobile])

    const toggleLoading = (type) => {
        if (type == 'verify') {
            setVerifying(true)
        } else {
            setResending(true)
        }
    }

    return (
        <>
            <div className='angry-grid verify-mobile-wrapper'>
                <div className='verify-phone-left-column'>
                    <div className='d-flex align-items-end verify-heading'>
                        <img style={{ width: '70px' }} src='/static/img/onboarding/phone-call.png' />
                        <h3 className='mb-0'>{`${string.onboarding.verifyMobile}`}</h3>
                    </div>
                    <div className='mt-5'>
                        <form onSubmit={formik.handleSubmit}>
                            <div className='d-flex'>
                                <div className='w-100 d-flex align-items-center verify-phone-input'>
                                    <PhoneInput
                                        inputClass={'tel-form-control'}
                                        country={'mn'}
                                        placeholder={`${string.worker.phone}`}
                                        specialLabel={`${string.onboarding.yourPhoneNo}`}
                                        value={formik.values.country_code + formik.values.mobile}
                                        disabled={otpSent}
                                        inputProps={{
                                            name: 'mobile',
                                            autoFocus: true,
                                        }}
                                        onChange={(number, selectedData) => {
                                            let dialCode = selectedData.dialCode
                                            const countryCode = '+' + dialCode
                                            formik.setFieldValue('country_code', countryCode)
                                            let contactNo = number.substring(dialCode.length)
                                            formik.setFieldValue('mobile', contactNo)
                                            checkMobileNo(contactNo, countryCode)
                                        }}
                                        onFocus={() => checkMobileNo(formik.values.mobile)}
                                        onBlur={() => checkMobileNo(formik.values.mobile)}
                                    />
                                    {mobileVerified && <img style={{ width: '32px', height: '32px' }} src='/static/img/onboarding/correct.png' />}
                                </div>
                            </div>
                            <div style={{ display: 'block' }}>{formik.errors.mobile && formik.touched.mobile ? <div className='error'>{formik.errors.mobile}</div> : null}</div>
                            {formik.errors.otp1 && formik.touched.otp1 && <div className='error'>{formik.errors.mobile}</div>}
                            <button ref={refSendOtp} style={{ visibility: 'hidden' }} type='submit' className='hidden-btn'>
                                Send OTP
                            </button>
                        </form>
                        <form onSubmit={formikOTP.handleSubmit}>
                            {otpSent && (
                                <>
                                    {' '}
                                    <div className='d-flex mt-4 otp-number' style={{ maxWidth: '600px' }}>
                                        <OtpInput
                                            value={formikOTP.values.otp}
                                            onChange={(e) => formikOTP.setFieldValue('otp', e)}
                                            numInputs={6}
                                            isDisabled={mobileVerified}
                                            disabledStyle={{ backgroundColor: 'transparent' }}
                                            isInputNum={true}
                                            separator={<span>&nbsp;</span>}
                                            hasErrored={formikOTP.errors.otp && formikOTP.touched.otp ? true : false}
                                            inputStyle={{ fontSize: '40px', marginRight: '30px', borderLeft: 'none', borderTop: 'none', borderRight: 'none' }}
                                        />
                                    </div>
                                    {formikOTP.errors.otp && formikOTP.touched.otp && <p className='error'>{formikOTP.errors.otp}</p>}
                                    <button ref={refVerifyMobile} className='hidden-btn' type='submit'>
                                        Verify mobile
                                    </button>
                                    <div className='verify-msg'>
                                        <p>{`${string.onboarding.validations.enterSmsCode}`}</p>
                                    </div>
                                </>
                            )}
                        </form>
                        <div className='d-flex btn-groups'>
                            <button disabled={mobileVerified} type='button' onClick={handleVerify} className='btn red-btn'>
                                {verifying ? <Spinner size='sm' /> : `${string.onboarding.btn.Verify}`}
                            </button>
                            <button type='button' disabled={otpSent == false ? true : mobileVerified == false ? false : true} className='btn red-outline-btn' onClick={() => !resending && sendOTP({ resend: true })}>
                                {resending ? <Spinner size='sm' /> : `${string.onboarding.btn.resendSMS}`}
                            </button>
                        </div>
                    </div>
                </div>
                <div className='d-flex navigation'>
                    <button type='button' onClick={handlePrevious}>
                        <img style={{ transform: 'scaleX(-1)', width: '60px' }} src='/static/img/onboarding/next.png' />
                    </button>
                    <button type='button' onClick={handleNext}>
                        <img style={{ width: '60px' }} src='/static/img/onboarding/next.png' />
                    </button>
                </div>
            </div>
            <style jsx>{`
                .navigation button {
                    border: 0;
                    background: transparent;
                }
                .btn-color {
                    color: #fff;
                    background-color: #ff0000 !important;
                    border-color: #ff0000;
                    padding: 0.5rem 5rem !important;
                    margin-top: 25px;
                    font-weight: bold;
                    font-size: 20px;
                }
                .phoneNumberCls input {
                    border: 0px;
                }
            `}</style>
        </>
    )
}

export default VerifyMobile
