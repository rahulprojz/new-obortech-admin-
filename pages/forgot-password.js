import React, { useState, useEffect, useCallback } from 'react'
import LoaderButton from '../components/common/form-elements/button/LoaderButton'
import FormHelperMessage from '../components/common/form-elements/formHelperMessage'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import NProgress from 'nprogress'
import notify from '../lib/notifier'
import string from '../utils/LanguageTranslation.js'
import withAuth from '../lib/withAuth'
import { forgotpassword, validateEmail, sendOtp } from '../lib/api/auth'
import { fetchUserSecurityAnswers } from '../lib/api/user-security-answers'
import Input from '../components/common/form-elements/input/Input'
import '../static/css/forgetPassword.css'

let timeout

function ForgotPassword(props) {
    const [isloading, setloading] = useState(false)
    const [isOtpBtnPressed, setIsOtpBtnPressed] = useState(false)
    const [step, setStep] = useState(1)
    const [userId, setUserId] = useState('')
    const [isSendingOTP, setSendingOtp] = useState(false)
    const [userSecurityQuestion, setUserSecurityQuestion] = useState({})
    const [indexOfSecurityAnswer, setIndexOfSecurityAnswer] = useState(0)

    useEffect(() => {
        NProgress.done()
    })

    const formik = useFormik({
        initialValues: {
            email: '',
            questionAnswer: '',
            otp: '',
            passwordType: 'profile_password',
        },
        validationSchema: Yup.object({
            email: Yup.string().email(`${string.onboarding.email} ${string.errors.email}`).required(`${string.onboarding.email} ${string.errors.required}`),
            questionAnswer: Yup.string().required(`${string.answer} ${string.errors.required}`),
            otp: Yup.string()
                .required(`${string.forgetOTPtext} ${string.errors.required}`)
                .matches(/^[0-9]+$/i, string.onlyDigits)
                .test('len', `${string.forgetOTPtext} ${string.errors.email}`, (val) => val && val.length === 6),
        }),
        onSubmit: (values) => {
            setloading(true)
            onSubmit(values)
        },
    })

    const onSubmit = useCallback(
        async (values) => {
            NProgress.start()
            try {
                const data = {
                    email: values.email,
                    questionAnswer: values.questionAnswer,
                    passwordType: values.passwordType,
                    otp: values.otp,
                }
                const userdata = await forgotpassword(data)
                if (userdata.userNotExists) {
                    notify(string.apiResponses.userNotFound)
                } else if (userdata.otpInvalid) {
                    notify(`${string.forgetOTPtext} ${string.errors.email}`)
                } else if (userdata.code == 200) {
                    if (values.passwordType == 'profile_password') {
                        notify(string.passwordEmailSentSuccess)
                        props.handleclose()
                    } else {
                        notify(string.transactionEmailSentSuccess)
                        props.handleclose()
                    }
                } else {
                    notify(string.statusResponses.serverError)
                }
                setloading(false)
                NProgress.done()
            } catch (error) {
                props.handleclose()
                setloading(false)
                notify(error)
                NProgress.done()
            }
            setloading(false)
        },
        [props.handleclose],
    )

    const handleGetOtp = useCallback(async () => {
        NProgress.start()
        setSendingOtp(true)
        try {
            const { email, questionAnswer } = formik.values
            if (!email) {
                notify(string.forgetemailtext)
            } else if (!questionAnswer) {
                notify(string.questionAnswertext)
            }
            const result = await sendOtp({
                id: userId,
                questionId: userSecurityQuestion.question_id,
                questionAnswer,
            })
            if (result.status) {
                formik.setErrors({})
                setIsOtpBtnPressed(true)
                notify(string.otpSuccess)
            } else {
                notify(result.error || string.otpError)
            }
        } catch (error) {
            notify(error)
        }
        NProgress.done()
        setSendingOtp(false)
    }, [userId, formik.values, userSecurityQuestion.question_id])

    const handelOnNextBtn = async (event) => {
        event.preventDefault()
        if (indexOfSecurityAnswer >= 2) {
            setIndexOfSecurityAnswer(0)
        } else {
            setIndexOfSecurityAnswer((iAnswer) => iAnswer + 1)
        }
        const securityQuestion = await fetchUserSecurityAnswers({ email: formik.values.email, index: indexOfSecurityAnswer })
        formik.setErrors({})
        setUserSecurityQuestion(securityQuestion)
        formik.setErrors({})
        setUserId(securityQuestion.user_id)
        formik.setFieldValue('questionAnswer', '')
    }

    const handleGetSecurityQuestion = useCallback(async () => {
        if (formik.values.email && !formik.errors.email) {
            let result = ''
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(async () => {
                result = await validateEmail(formik.values.email)
                if (result && result.validEmail) {
                    const securityQuestion = await fetchUserSecurityAnswers({ email: formik.values.email, index: indexOfSecurityAnswer })
                    formik.setErrors({})
                    setUserSecurityQuestion(securityQuestion)
                    setStep(2)
                    setUserId(securityQuestion.user_id)
                    setIndexOfSecurityAnswer(1)
                } else {
                    formik.setErrors({ email: string.apiResponses.emailNotExist })
                    setStep(1)
                }
            }, 300)
        }
    }, [formik.values.email, formik.errors.email])

    return (
        <div className='px-lg-4'>
            <form className='js-validation-reminder' onSubmit={formik.handleSubmit}>
                <div className='form-group'>
                    <div className='form-group'>
                        <label htmlFor='groupID' className='col-md-12 col-form-label pl-0'>
                            {string.forgetemailtext}
                        </label>
                        <Input onChange={formik.handleChange} type='text' className='form-control form-control-alt form-control-lg' id='login-email' name='email' placeholder={string.login.email} onKeyUp={handleGetSecurityQuestion} />
                        {formik.errors.email ? <FormHelperMessage className='err' message={formik.errors.email} /> : null}
                    </div>
                    {step === 2 && !formik.errors.email && (
                        <>
                            <div className='form-group'>
                                <input type='radio' value='profile_password' name='passwordType' className='mr-2' onChange={formik.handleChange} checked={formik.values.passwordType === 'profile_password'} />
                                <span className='mr-5'>{string.onboarding.passWord}</span>
                                <input type='radio' value='transaction_password' name='passwordType' className='mr-2' onChange={formik.handleChange} checked={formik.values.passwordType === 'transaction_password'} />
                                <span>{string.onboarding.transactionPassword}</span>
                            </div>
                            <div className='form-group'>
                                <span>
                                    <span>
                                        <label htmlFor='question_answer' className='col-md-12 col-form-label pl-0'>
                                            {userSecurityQuestion?.security_question?.questions}
                                        </label>
                                    </span>
                                </span>

                                <div className='row'>
                                    <div className='col-md-9 col-lg-9 col-xl-9 pl-0'>
                                        <Input onChange={formik.handleChange} type='text' className='form-control form-control-alt form-control-lg' id='login-question-answer' name='questionAnswer' value={formik.values.questionAnswer} placeholder={string.login.questionAnswer} />
                                        {formik.errors.questionAnswer ? <FormHelperMessage className='err' message={formik.errors.questionAnswer} /> : null}
                                    </div>
                                    <div className=' col-md-3 col-lg-6 col-xl-3 pl-0'>
                                        <img title={string.onboarding.btn.nextQuestion} className='ob-refreshImg' src='/static/img/reload.png' onClick={handelOnNextBtn}></img>
                                    </div>
                                </div>
                            </div>
                            <div className='form-group'>
                                <div className='row'>
                                    <div className='col-md-9 col-lg-9 col-xl-9 pl-0'>
                                        <Input onChange={formik.handleChange} type='text' className='form-control form-control-alt form-control-lg' id='login-otp' name='otp' placeholder={string.login.otp} />
                                        {isOtpBtnPressed && formik.errors.otp ? <FormHelperMessage className='err' message={formik.errors.otp} /> : null}
                                    </div>
                                    <div className='col-md-3 col-lg-3 col-xl-3 pl-0'>
                                        <LoaderButton
                                            type='button'
                                            text={string.onboarding.btn.getOtp}
                                            className='btn btn-block btn-primary get-otp-btn-padding'
                                            style={{ opacity: !formik.values.questionAnswer || !formik.values.email ? 0.65 : '' }}
                                            onClick={handleGetOtp}
                                            isLoading={isSendingOTP}
                                            disabled={!formik.values.questionAnswer || !formik.values.email}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className='form-group'>
                    <div className='text-center forgetsubmitbtn'>
                        <LoaderButton type='submit' isLoading={isloading} cssClass='btn btn-block btn-primary' text={string.onboarding.btn.sendEmail} disabled={!(formik.values.otp && isOtpBtnPressed && !formik.errors.otp)} />
                    </div>
                </div>
            </form>
        </div>
    )
}

export default withAuth(ForgotPassword, { logoutRequired: true })
