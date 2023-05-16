import { Formik } from 'formik'
import { useCallback, useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import * as Yup from 'yup'
import md5 from 'md5'
import NProgress from 'nprogress'
import Button from '../../common/form-elements/button/Button'
import LoaderButton from '../../common/form-elements/button/LoaderButton'
import FormHelperMessage from '../../common/form-elements/formHelperMessage'
import Input from '../../common/form-elements/input/Input'
import string from '../../../utils/LanguageTranslation.js'
import { setNewPassword } from '../../../lib/api/auth'
import notify from '../../../lib/notifier'
import { sanitize } from '../../../utils/globalFunc'

const FIELD_LIST = {
    CURRENT_PASSWORD: 'currentPassword',
    NEW_PASSWORD: 'newPassword',
    CONFIRM_PASSWORD: 'confirmPassword',
}

const ResetPasswordSchema = Yup.object().shape({
    [FIELD_LIST.CURRENT_PASSWORD]: Yup.string().trim().required(string.profilePwd?.currentPwdError),
    [FIELD_LIST.NEW_PASSWORD]: Yup.string()
        .trim()
        .required(string.profilePwd?.newPwdError)
        .min(8, `${string.onboarding.validations.passwordShouldBeEight}`)
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/, `${string.onboarding.validations.passwordDoesNotMatch}`)
        .when(FIELD_LIST.CURRENT_PASSWORD, {
            is: (val) => (val && val.length > 0 ? true : false),
            then: Yup.string().notOneOf([Yup.ref(FIELD_LIST.CURRENT_PASSWORD)], string.profilePwd?.curNewPwdError),
        }),
    [FIELD_LIST.CONFIRM_PASSWORD]: Yup.string()
        .trim()
        .required(string.profilePwd?.confirmPwdError)
        .when(FIELD_LIST.NEW_PASSWORD, {
            is: (val) => (val && val.length > 0 ? true : false),
            then: Yup.string().oneOf([Yup.ref(FIELD_LIST.NEW_PASSWORD)], string.profilePwd?.bothPwdError),
        }),
})

function ResetPassword({ isOpen, user, onToggle }) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleOnSubmit = useCallback(
        async (values) => {
            NProgress.start()
            setIsLoading(true)
            try {
                const response = await setNewPassword({
                    userName: user.unique_id,
                    orgName: sanitize(user.organization.blockchain_name),
                    email: user.email,
                    password: md5(values[FIELD_LIST.NEW_PASSWORD]),
                    currentPassword: md5(values[FIELD_LIST.CURRENT_PASSWORD]),
                })
                if (response) {
                    if (response.success) {
                        notify(response.message)
                        onToggle()
                    } else {
                        setError(response.message || '')
                    }
                }
                setIsLoading(false)
                NProgress.done()
            } catch (err) {
                setIsLoading(false)
                NProgress.done()
                notify(err.message || err.toString())
            }
        },
        [user, onToggle],
    )

    const handleClearError = useCallback(() => {
        if (error) {
            setError('')
        }
    }, [error])

    return (
        <Modal isOpen={isOpen} toggle={onToggle} className='customModal'>
            <ModalHeader toggle={onToggle} cssModule={{ 'modal-title': 'modal-title text-uppercase text-dark font-weight-bold' }}>
                {string.profilePwd?.resetPwdBtn}
            </ModalHeader>
            <ModalBody>
                <Formik
                    enableReinitialize
                    initialValues={{
                        [FIELD_LIST.CURRENT_PASSWORD]: '',
                        [FIELD_LIST.NEW_PASSWORD]: '',
                        [FIELD_LIST.CONFIRM_PASSWORD]: '',
                    }}
                    validationSchema={ResetPasswordSchema}
                    onSubmit={(values) => {
                        handleOnSubmit(values)
                    }}
                >
                    {({ errors, handleChange, values, handleSubmit }) => {
                        return (
                            <>
                                <div className='form-group col-md-12 p-0'>
                                    <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                        {string.profilePwd.currentPwdText}
                                    </label>
                                    <Input
                                        id={FIELD_LIST.CURRENT_PASSWORD}
                                        type='password'
                                        className='borderProject form-control radius-0'
                                        placeholder={string.profilePwd.currentPwdPlaceholder}
                                        name={FIELD_LIST.CURRENT_PASSWORD}
                                        onChange={(event) => {
                                            handleChange(event)
                                            handleClearError()
                                        }}
                                        onBlur={handleChange}
                                        value={values[FIELD_LIST.CURRENT_PASSWORD]}
                                    />
                                    {errors[FIELD_LIST.CURRENT_PASSWORD] ? <FormHelperMessage message={errors[FIELD_LIST.CURRENT_PASSWORD]} className='error' /> : null}
                                    {error ? <FormHelperMessage message={error} className='error' /> : null}
                                </div>
                                <div className='form-group col-md-12 p-0'>
                                    <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                        {string.profilePwd.newPwdText}
                                    </label>
                                    <Input id={FIELD_LIST.NEW_PASSWORD} type='password' className='borderProject form-control radius-0' placeholder={string.profilePwd.newPwdPlaceholder} name={FIELD_LIST.NEW_PASSWORD} onChange={handleChange} value={values[FIELD_LIST.NEW_PASSWORD]} />
                                    {errors[FIELD_LIST.NEW_PASSWORD] ? <FormHelperMessage message={errors[FIELD_LIST.NEW_PASSWORD]} className='error' /> : null}
                                </div>
                                <div className='d-flex align-items-center password-info' style={{ maxWidth: '600px' }}>
                                    <i style={{ fontSize: '22px', paddingRight: '10px' }} className='fa fa-exclamation-triangle'></i>
                                    <p style={{ fontSize: '15px' }} className='m-0'>
                                        {string.passwordReqText}
                                    </p>
                                </div>
                                <div className='form-group col-md-12 p-0'>
                                    <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                        {string.profilePwd.confirmPwdText}
                                    </label>
                                    <Input id={FIELD_LIST.CONFIRM_PASSWORD} type='password' className='borderProject form-control radius-0' placeholder={string.profilePwd.confirmPwdPlaceholder} name={FIELD_LIST.CONFIRM_PASSWORD} onChange={handleChange} value={values[FIELD_LIST.CONFIRM_PASSWORD]} />
                                    {errors[FIELD_LIST.CONFIRM_PASSWORD] ? <FormHelperMessage message={errors[FIELD_LIST.CONFIRM_PASSWORD]} className='error' /> : null}
                                </div>
                                <ModalFooter>
                                    <LoaderButton className='btn btn-primary small-btn' type='submit' isLoading={isLoading} text={string.formBuilder.submitBtnTxt} onClick={handleSubmit} />
                                    <Button onClick={onToggle} className='btn btn-primary'>
                                        {string.cancel}
                                    </Button>
                                </ModalFooter>
                            </>
                        )
                    }}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

export default ResetPassword
