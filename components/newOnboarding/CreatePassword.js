import { MenuItem, TextField } from '@material-ui/core'
import { useFormik } from 'formik'
import { useContext, useRef } from 'react'
import OnBoardContext from '../../store/onBoard/onBordContext'
import { checkUserNameIsAvailable } from '../../lib/api/auth'
import * as Yup from 'yup'
import string from '../../utils/LanguageTranslation.js'

const Schema = Yup.object({
    userName: Yup.string()
        .required(`${string.onboarding.username} ${string.errors.required}`)
        .matches(/^(\S+$)/, `${string.onboarding.validations.alphanumeric}`),
    password: Yup.string()
        .required(`${string.onboarding.passWord} ${string.errors.required}`)
        .min(8, `${string.onboarding.validations.passwordShouldBeEight}`)
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/, `${string.onboarding.validations.passwordDoesNotMatch}`),
    confirmPassword: Yup.string()
        .when('password', {
            is: (val) => (val && val.length > 0 ? true : false),
            then: Yup.string().oneOf([Yup.ref('password')], `${string.onboarding.validations.passwordsMustMatch}`),
        })
        .required(`${string.onboarding.validations.passwordConfirmation} ${string.errors.required}`),
})

let userNameVaildation

const CreatePassword = () => {
    const { setSelectedStep, setOnboarding, onboarding } = useContext(OnBoardContext)
    const refVerifyPass = useRef()

    const checkUserName = async () => {
        try {
            formik.setFieldTouched('userName', true)
            const { isExist } = await checkUserNameIsAvailable({ name: formik.values.userName ?? '' })
            if (isExist) {
                formik.setFieldError('userName', string.onboarding.validations.usernameAlreadyUsed )
                userNameVaildation = { userName: string.onboarding.validations.usernameAlreadyUsed }
            } else {
                userNameVaildation = {}
            }
        } catch (error) {
            console.log(error)
        }
    }

    const checkUserNameValidation = () => {
        if (!!userNameVaildation?.userName) {
            setTimeout(() => {
                formik.setFieldError('userName', userNameVaildation.userName)
            }, 300)
        }
    }

    const customHandleBlur = (e) => {
        formik.handleBlur(e)
        checkUserNameValidation()
    }

    const customHandleChange = (e) => {
        const errors = formik.errors.userName
        formik.handleChange(e)
        checkUserNameValidation()
    }

    const handleNext = () => {
        refVerifyPass.current.click()
        checkUserNameValidation()
    }
    const handlePrevious = () => {
        setSelectedStep('step3')
    }
    const formik = useFormik({
        initialValues: {
            userName: onboarding.userName ?? '',
            password: onboarding.password ?? '',
            confirmPassword: onboarding.password ?? '',
        },
        validationSchema: Schema,
        onSubmit: (values) => {
            if (!userNameVaildation?.userName) {
                setOnboarding({ type: 'updateOrgInfo', payload: { userName: formik.values.userName  , password: formik.values.password } })
                setSelectedStep('step5')
            }
        }
    })

    return (
        <>
            <div className='angry-grid create-password-wrapper'>
                <div className='create-password-left-column'>
                    <div className='d-flex align-items-end verify-heading'>
                        <img style={{ width: '70px' }} src='/static/img/onboarding/password.png' />
                        <h3 className='mb-0'>{`${string.onboarding.createUsernamePassword}`}</h3>
                    </div>
                    <div className='mt-5'>
                        <form id='addUser' onSubmit={formik.handleSubmit}>
                            <div className='d-flex' style={{ maxWidth: '600px' }}>
                                <TextField
                                    className='add-user-info-input username-input w-100 customFontSize'
                                    label={`${string.onboarding.username}`}
                                    id='userName'
                                    name='userName'
                                    variant='standard'
                                    value={formik.values.userName}
                                    onChange={formik.handleChange}
                                    onBlur={checkUserName}
                                    error={formik.errors.userName && formik.touched.userName ? true : false}
                                    helperText={formik.errors.userName && formik.touched.userName ? formik.errors.userName : `${string.onboarding.useUserNameToLogin}`}
                                />
                            </div>
                            <div className='d-flex mt-5' style={{ maxWidth: '600px' }}>
                                <TextField
                                    className='create-password-input w-100'
                                    label={`${string.onboarding.typePassword}`}
                                    id='password'
                                    name='password'
                                    type='password'
                                    variant='standard'
                                    value={formik.values.password}
                                    onChange={customHandleChange}
                                    onBlur={customHandleBlur}
                                    error={formik.errors.password && formik.touched.password ? true : false}
                                    helperText={formik.errors.password && formik.touched.password ? formik.errors.password : null}
                                />
                            </div>
                            <div className='d-flex align-items-center password-info mt-5' style={{ maxWidth: '600px' }}>
                                <i style={{ fontSize: '32px', paddingRight: '15px' }} className='fa fa-exclamation-triangle'></i>
                                <p className='m-0'>{string.passwordReqText}</p>
                            </div>
                            <div className='d-flex confirm-password mt-5' style={{ maxWidth: '600px' }}>
                                <TextField
                                    className='create-password-input w-100'
                                    id='confirmPassword'
                                    name='confirmPassword'
                                    type='password'
                                    label={`${string.onboarding.validations.passwordConfirmation}`}
                                    variant='standard'
                                    value={formik.values.confirmPassword}
                                    onChange={customHandleChange}
                                    onBlur={customHandleBlur}
                                    error={formik.errors.confirmPassword && formik.touched.confirmPassword ? true : false}
                                    helperText={formik.errors.confirmPassword && formik.touched.confirmPassword ? formik.errors.confirmPassword : null}
                                />
                                {formik.values.password && formik.values.password == formik.values.confirmPassword ? <img style={{ width: 'auto', height: '25px', marginTop: '25px' }} src='/static/img/onboarding/correct.png' /> : ''}
                            </div>
                            <button ref={refVerifyPass} style={{ visibility: 'hidden' }} type='submit'>
                                Verify Pass
                            </button>
                        </form>
                    </div>
                </div>
                <div className='d-flex navigation'>
                    <button onClick={handlePrevious}>
                        <img style={{ transform: 'scaleX(-1)', width: '60px' }} src='/static/img/onboarding/next.png' />
                    </button>
                    <button onClick={handleNext}>
                        <img style={{ width: '60px' }} src='/static/img/onboarding/next.png' />
                    </button>
                </div>
            </div>
            <style jsx>{`
                .navigation button {
                    border: 0;
                    background: transparent;
                }
            `}</style>
        </>
    )
}

export default CreatePassword
