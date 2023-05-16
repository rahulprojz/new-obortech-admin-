import { TextField } from '@material-ui/core'
import { useFormik } from 'formik'
import { useRef } from 'react'
import { useContext, useState } from 'react'
import OnBoardContext from '../../store/onBoard/onBordContext'
import * as Yup from 'yup'
import string from '../../utils/LanguageTranslation.js'
import { sendEmailOtp, verifyEmailOtp } from '../../lib/api/auth'
import { checkEmail } from '../../lib/api/onboarding'
import { Spinner } from 'reactstrap'
import notify from '../../lib/notifier'
import OtpInput from 'react-otp-input'

let emailIdVaildation
let allowOtp = false
let timeout
const VerifyEmail = () => {
    const { setSelectedStep, setOnboarding, onboarding, decodedToken } = useContext(OnBoardContext)
    const [otpSent, setOtpSent] = useState(onboarding.emailOtpSent ?? false)
    const [emailVerified, setEmailVerified] = useState(onboarding.emailVerified ?? false)
    const [verifying, setVerifying] = useState(false)
    const [resending, setResending] = useState(false)
    const [loading, setLoading] = useState(false)
    const refSendOtp = useRef()
    const refVerifyEmail = useRef()

    const handleNext = () => {
        if (otpSent && emailVerified) {
            setOnboarding({ type: 'updateOrgInfo', payload: { emailOtpSent: otpSent, emailVerified, email: formik.values.emailId } })
            setSelectedStep('step3')
        } else {
            if (formik.values.emailId) {
                notify(`${string.plzVerify}`)
            } else {
                notify(`${string.onboarding.verifyemail}`)
            }
        }
    }
    const handlePrevious = () => {
        setSelectedStep('step1')
    }
    const sendOTP = async ({ resend }) => {
        if (resend) {
            toggleLoading('resend')
        } else {
            toggleLoading('verify')
        }
        let payload = {
            email: formik.values.emailId.trim(),
            lang: decodedToken.language,
        }
        try {
            setLoading(true)
            if ((!loading && !otpSent) || resend) {
                const { code } = await checkEmail({ email: formik.values.emailId ?? '' })
                if (code == 400) {
                    formik.setFieldError('emailId', string.apiResponses.emailAlreadyExists)
                    emailIdVaildation = { emailId: string.apiResponses.emailAlreadyExists }
                    setResending(false)
                    setVerifying(false)
                } else {
                    const response = await sendEmailOtp(payload)
                    if (response?.status) {
                        notify(`${string.emailSentTxt}`)
                        setOtpSent(true)
                        setLoading(false)
                    } else {
                        setOtpSent(false)
                        setLoading(false)

                        notify(string.onboarding.validations.wrongOTP)
                    }
                }
            }
        } catch (err) {
            setLoading(false)
            console.log(err)
        }
        setResending(false)
        setVerifying(false)
    }
    const handleVerify = () => {
        if (otpSent) {
            refVerifyEmail.current.click()
        } else {
            if (!!emailIdVaildation?.emailId) {
                setTimeout(() => {
                    formik.setFieldError('emailId', emailIdVaildation.emailId)
                }, 300)
            } else {
                refSendOtp.current.click()
            }
        }
    }
    const toggleLoading = (type) => {
        if (type == 'verify') {
            setVerifying(true)
        } else {
            setResending(true)
        }
    }
    const verifyOTP = async () => {
        toggleLoading('verify')
        let payload = {
            email: formik.values.emailId.trim(),
            otp: parseInt(`${formikOTP.values.otp}`),
        }
        try {
            const { verified } = await verifyEmailOtp(payload)
            setEmailVerified(verified)
            if (verified) {
                notify(`${string.onboarding.validations.emailId} ${string.onboarding.validations.verified}`)
            } else {
                notify(`${string.onboarding.validations.wrongCode}`)
            }
        } catch (err) {
            setEmailVerified(false)
            notify(`${string.onboarding.validations.errorOccurred}`)
        }
        setResending(false)
        setVerifying(false)
    }

    const checkEmailId = async () => {
        try {
            formik.setFieldTouched('emailId', true)
            allowOtp = false
            if (!formik.errors.emailId && !!formik.values.emailId) {
                const { code } = await checkEmail({ email: formik.values.emailId ?? '' })
                if (code == 400) {
                    formik.setFieldError('emailId', string.apiResponses.emailAlreadyExists)
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

    const formik = useFormik({
        initialValues: {
            emailId: onboarding.email ?? '',
        },
        validationSchema: Yup.object({
            emailId: Yup.string().trim().email(`${string.onboarding.email} ${string.errors.email}`).required(`${string.onboarding.email} ${string.errors.required}`),
        }),
        onSubmit: (values) => {
            toggleLoading('verify')
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
                if (!emailIdVaildation?.emailId && allowOtp) {
                    sendOTP({ resend: false })
                }
            }, 800)
        },
    })
    const formikOTP = useFormik({
        initialValues: {
            otp: '',
        },
        validationSchema: Yup.object({
            otp: Yup.number()
                .test('len', `${string.errors.required}`, (val) => val?.toString().length === 6)
                .required(`${string.errors.required}`),
        }),
        onSubmit: (values) => {
            verifyOTP()
        },
    })

    return (
        <>
            <div className='angry-grid verify-mail-wrapper'>
                <div className='verify-mail-left-column'>
                    <div className='d-flex align-items-end verify-heading'>
                        <img style={{ width: '70px' }} src='/static/img/onboarding/email.png' />
                        <h3 className='mb-0'>{`${string.onboarding.verifyemail}`}:</h3>
                    </div>
                    <div className='mt-5'>
                        <form onSubmit={formik.handleSubmit}>
                            <div className='d-flex align-items-center'>
                                <TextField
                                    className='verify-mail-input'
                                    id='emailId'
                                    label={`${string.onboarding.verifyEmail}`}
                                    disabled={otpSent}
                                    variant='standard'
                                    autoComplete='off'
                                    value={formik.values.emailId}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/^\s+/g, '')
                                        e.target.value = value
                                        formik.handleChange(e)
                                    }}
                                    error={formik.errors.emailId && formik.touched.emailId ? true : false}
                                    helperText={formik.errors.emailId && formik.touched.emailId ? formik.errors.emailId : null}
                                    onFocus={checkEmailId}
                                    onBlur={checkEmailId}
                                />
                                {emailVerified && <img style={{ width: '32px', height: '32px', marginTop: '15px' }} src='/static/img/onboarding/correct.png' />}
                            </div>
                            <button ref={refSendOtp} className='hidden-btn' type='submit'>
                                Submit
                            </button>
                        </form>
                        <form onSubmit={formikOTP.handleSubmit}>
                            {otpSent && (
                                <>
                                    <div className='d-flex mb-3 mt-5 otp-number' style={{ maxWidth: '300px' }}>
                                        <OtpInput
                                            value={formikOTP.values.otp}
                                            onChange={(e) => formikOTP.setFieldValue('otp', e)}
                                            numInputs={6}
                                            isInputNum={true}
                                            isDisabled={emailVerified}
                                            disabledStyle={{ backgroundColor: 'transparent' }}
                                            separator={<span>&nbsp;</span>}
                                            hasErrored={formikOTP.errors.otp && formikOTP.touched.otp ? true : false}
                                            inputStyle={{ fontSize: '40px', marginRight: '30px', borderLeft: 'none', borderTop: 'none', borderRight: 'none' }}
                                        />
                                    </div>
                                    {formikOTP.errors.otp && formikOTP.touched.otp && <p className='error'>{formikOTP.errors.otp}</p>}
                                    <div className='verify-msg'>
                                        <p>
                                            {string.emailSentTxt}
                                            <b> {formik.values.emailId}</b>. {string.inOrderTxt}
                                        </p>
                                        <p>{string.checkYourEmailTxt}</p>
                                    </div>
                                    <button ref={refVerifyEmail} className='hidden-btn' type='submit'>
                                        Verify mobile
                                    </button>
                                </>
                            )}
                        </form>
                        <div className='d-flex btn-groups'>
                            <button type='button' onClick={handleVerify} className='btn red-btn' disabled={emailVerified}>
                                {verifying ? <Spinner size='sm' /> : `${string.onboarding.btn.Verify}`}
                            </button>
                            <button type='button' onClick={() => !resending && sendOTP({ resend: true })} className='btn red-outline-btn' disabled={otpSent == false ? true : emailVerified == false ? false : true}>
                                {resending ? <Spinner size='sm' /> : `${string.onboarding.btn.resendCode}`}
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
                #addUserForm {
                    width: 125% !important;
                }
            `}</style>
        </>
    )
}

export default VerifyEmail
