import React, { useState } from 'react'
import * as Yup from 'yup'
import NProgress from 'nprogress'
import { Formik } from 'formik'
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import Button from '../common/form-elements/button/Button'
import string from '../../utils/LanguageTranslation.js'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import Input from '../common/form-elements/input/Input'
import FormHelperMessage from '../common/form-elements/formHelperMessage'
import notify from '../../lib/notifier'
import { inviteUser } from '../../lib/api/organization'
import '../../static/css/modal.css'
import './InviteUser.css'

const InviteUser = (props) => {
    const [modal, setModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const toggle = () => setModal(!modal)
    const [language, setLanguage] = useState('en')
    const [idVerify, setIdVerify] = useState(true)

    const InviteAddUserSchema = Yup.object().shape({
        firstName: Yup.string()
            .trim()
            .required(`${string.onboarding.firstName} ${string.errors.required}`)
            .matches(/^(?!.*["'`\\])/, `${string.onboarding.firstName} ${string.errors.invalid}`),

        lastName: Yup.string()
            .required(`${string.onboarding.lastName} ${string.errors.required}`)
            .matches(/^(?!.*["'`\\])/, `${string.onboarding.lastName} ${string.errors.invalid}`),

        email: Yup.string()
            .email(`Email ${string.errors.email}`)
            .required(`${string.onboarding.email} ${string.errors.required}`)
            .matches(/^(?!.*["'`\\])/, `${string.onboarding.email} ${string.errors.invalid}`),
    })

    const sendInvite = async (data) => {
        NProgress.start()
        setIsLoading(true)
        try {
            let payload = { ...data, uniqueId: props.user.unique_id, language }
            if (language == 'mn') payload = { ...payload, idVerify }
            const inviteResponse = await inviteUser(payload)
            if (inviteResponse.invitationAlreadyExists) {
                notify(string.organization.inviteAlreadySent)
            } else if (inviteResponse.userAlreadyExists) {
                notify(string.organization.accountAlreadyExist)
            } else {
                notify(string.apiResponses.orgInvitedSuccess)
                toggle()
            }
        } catch (err) {
            notify(string.organization.userInviteErr)
        }
        NProgress.done()
        setIsLoading(false)
    }

    return (
        <>
            <Button className='btn btn-primary large-btn' onClick={toggle}>
                {string.participant.submitUser}
            </Button>
            <Modal className='customModal document' isOpen={modal} toggle={toggle}>
                <ModalHeader
                    toggle={toggle}
                    cssModule={{
                        'modal-title': 'modal-title text-dark font-weight-bold',
                    }}
                >
                    {string.participant.submitUser}
                </ModalHeader>
                <ModalBody>
                    <Formik
                        initialValues={{
                            firstName: '',
                            lastName: '',
                            email: '',
                            orgType: '',
                        }}
                        validationSchema={InviteAddUserSchema}
                        onSubmit={async (values) => {
                            await sendInvite(values)
                        }}
                    >
                        {({ errors, touched, handleChange, handleSubmit, values }) => {
                            return (
                                <form className='form-container' onSubmit={handleSubmit}>
                                    <div className='row ml-0 mr-0 content-block'>
                                        <div className='form-group col-md-12 p-0'>
                                            <label htmlFor='firstName' className='col-md-12 col-form-label pl-0'>
                                                {string.onboarding.firstName}
                                            </label>
                                            <Input type='text' name='firstName' id='firstName' className={'form-control'} value={values.firstName} onChange={handleChange} placeholder={string.onboarding.firstName} />
                                            {(() => {
                                                if (errors.firstName && touched.firstName) {
                                                    return <FormHelperMessage message={errors.firstName} className='error' />
                                                }
                                            })()}
                                        </div>

                                        <div className='form-group col-md-12 p-0'>
                                            <label htmlFor='lastName' className='col-md-12 col-form-label pl-0'>
                                                {string.onboarding.lastName}
                                            </label>
                                            <Input type='text' name='lastName' id='lastName' className='form-control' value={values.lastName} onChange={handleChange} placeholder={string.onboarding.lastName} />
                                            {errors.lastName && touched.lastName ? <FormHelperMessage message={errors.lastName} className='error' /> : null}
                                        </div>

                                        <div className='form-group col-md-12 p-0'>
                                            <label htmlFor='email' className='col-md-12 col-form-label pl-0'>
                                                {string.onboarding.email}
                                            </label>
                                            <Input type='text' name='email' id='email' className='form-control' value={values.email} onChange={handleChange} placeholder={string.onboarding.email} />
                                            {errors.email && touched.email ? <FormHelperMessage message={errors.email} className='error' /> : null}
                                        </div>

                                        <div className='form-group col-md-12 p-0'>
                                            <label htmlFor='email' className='col-md-12 col-form-label pl-0'>
                                                {string.onboarding.selectLanguage}
                                            </label>
                                            <div className='form-check form-check-inline'>
                                                <input checked={language == 'en' ? 'checked' : ''} onClick={() => setLanguage('en')} className='form-check-input' type='radio' name='language' id='english' value='en' />
                                                <label className='form-check-label' htmlFor='english'>
                                                    {string.local_language}
                                                </label>
                                            </div>
                                            <div className='form-check form-check-inline'>
                                                <input checked={language == 'mn' ? 'checked' : ''} onClick={() => setLanguage('mn')} className='form-check-input' type='radio' name='language' id='mongolian' value='mn' />
                                                <label className='form-check-label' htmlFor='mongolian'>
                                                    {string.mong_language}
                                                </label>
                                            </div>
                                        </div>

                                        {language == 'mn' && (
                                            <div className='form-group col-md-12 p-0 d-flex'>
                                                <div className='form-check form-check-inline col-md-6'>
                                                    <input checked={idVerify} onClick={() => setIdVerify(true)} className='form-check-input' type='radio' name='idVerify' id='identityVerify' value={idVerify} />
                                                    <label className='form-check-label' htmlFor='identityVerify'>
                                                        {string.organization.identityVerification}
                                                    </label>
                                                </div>
                                                <div className='form-check form-check-inline col-md-6'>
                                                    <input checked={!idVerify} onClick={() => setIdVerify(false)} className='form-check-input' type='radio' name='idVerify' id='regular' value={!idVerify} />
                                                    <label className='form-check-label' htmlFor='regular'>
                                                        {string.organization.regular}
                                                    </label>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <ModalFooter>
                                        <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={isLoading} text={string.onboarding.sendInvite} />
                                    </ModalFooter>
                                </form>
                            )
                        }}
                    </Formik>
                </ModalBody>
            </Modal>
        </>
    )
}

export default InviteUser
