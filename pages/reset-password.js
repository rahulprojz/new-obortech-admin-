import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import NProgress from 'nprogress'
import LoaderButton from '../components/common/form-elements/button/LoaderButton'
import FormHelperMessage from '../components/common/form-elements/formHelperMessage'
import Input from '../components/common/form-elements/input/Input'
import { decipher } from '../utils/decrypt'
import { resetpassword } from '../lib/api/auth'
import notify from '../lib/notifier'
import withAuth from '../lib/withAuth'
import string from '../utils/LanguageTranslation.js'
import '../static/css/forgetPassword.css'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { getLanguage } from '../lib/api/language'

const ResetPassword = (props) => {
    const router = useRouter()
    return <ResetPasswordChild {...props} router={router} />
}

function ResetPasswordChild(props) {
    const [isloading, setloading] = useState(false)
    const [email, setemail] = useState('')
    const [language, setLanguage] = useState(string)

    const initializeRoute = (router) => {
        if (Object.keys(router.query).length) {
            const emailDeciper = decipher('email-verification')
            const user = JSON.parse(emailDeciper(router.query.email))
            setemail(user.id)
        }
    }

    useEffect(() => {
        initializeRoute(props.router)
        NProgress.done()
    })

    useEffect(() => {
        const code = props.router.query?.lang.toLowerCase() || ''
        if (code) {
            getLanguage(code).then((languageJson) => {
                if (languageJson) {
                    setLanguage(languageJson.json)
                }
            })
        }
    }, [])

    const formik = useFormik({
        initialValues: {
            password: '',
            repeatPassword: '',
        },
        validationSchema: Yup.object({
            password: Yup.string()
                .required(`${language.onboarding.passWord} ${language.errors.required}`)
                .min(8, `${language.onboarding.validations.passwordShouldBeEight}`)
                .matches(/[0-9a-zA-Z]/, `${language.onboarding.validations.passwordDoesNotMatch}`),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('password'), null], `${language.onboarding.validations.passwordsMustMatch}`)
                .required(`${language.onboarding.validations.passwordConfirmation} ${language.errors.required}`),
        }),
        onSubmit: (values) => {
            setloading(true)
            onSubmit(values)
        },
    })

    const onSubmit = async (values) => {
        NProgress.start()
        try {
            const data = {
                orgName: 'obortech',
                email: email,
                password: values.password,
            }
            const response = await resetpassword(data)
            if (response.success) {
                //Notify user
                notify(language.passwordChangesSuccess)
                NProgress.done()
                props.router.push('/login')
            } else {
                notify(language.newPaswdCantBeSameAsOld)
            }
        } catch (error) {
            notify(language.passwordChangesErr)
            NProgress.done()
        }
        setloading(false)
    }

    return (
        <div className='bg-gradient-primary'>
            <Head>
                <title>
                    {process.env.APP_NAME} - {language.resetPassword}
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
                                    <div className='col-lg-6 d-none d-lg-block bg-login-image'></div>
                                    <div className='col-lg-6'>
                                        <div className='p-5'>
                                            <div className='text-center'>
                                                <h1 className='h4 text-gray-900 mb-4'>{language.resetYourPassword}</h1>
                                            </div>
                                            <form className='user' onSubmit={formik.handleSubmit}>
                                                <div className='form-group'>
                                                    <Input onChange={formik.handleChange} type='password' className='default-css form-control form-control-user' id='password' name='password' placeholder={language.onboarding.passWord} />
                                                    {formik.errors.password ? <FormHelperMessage className='err' message={formik.errors.password} /> : null}
                                                </div>
                                                <div className='form-group'>
                                                    <Input onChange={formik.handleChange} type='password' className='default-css form-control form-control-user' id='confirm-password' name='confirmPassword' placeholder={language.participant.repeatPassword} />
                                                    {formik.errors.confirmPassword ? <FormHelperMessage className='err' message={formik.errors.confirmPassword} /> : null}
                                                </div>
                                                <div className='form-group'>
                                                    <LoaderButton type='submit' isLoading={isloading} cssClass='btn btn-block btn-primary' text={language.resetPassword} />
                                                </div>
                                                <div className='backsigninbtn'>
                                                    <Link href='/login'>
                                                        <a className='btn-block-option'>{language.BackLOGIN}</a>
                                                    </Link>
                                                </div>
                                            </form>
                                        </div>
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

export default withAuth(ResetPassword, { logoutRequired: true })
