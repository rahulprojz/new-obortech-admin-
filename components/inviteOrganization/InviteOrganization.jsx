import React, { useState, useEffect } from 'react'
import * as Yup from 'yup'
import NProgress from 'nprogress'
import { Formik } from 'formik'
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import Button from '../common/form-elements/button/Button'
import string from '../../utils/LanguageTranslation'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import Input from '../common/form-elements/input/Input'
import FormHelperMessage from '../common/form-elements/formHelperMessage'
import notify from '../../lib/notifier'
import { fetchUserById } from '../../lib/api/user'
import { fetchOrgType, inviteOrganization } from '../../lib/api/organization'
import '../../static/css/modal.css'
import './inviteOrganization.css'

const InviteOrganization = (props) => {
    const [modal, setModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [orgTypes, setOrgTypes] = useState([])
    const [userData, setUserData] = useState({})
    const [organizationType, setOrganizationType] = useState(1)
    const [mspType, setMspType] = useState(1)
    const [language, setLanguage] = useState('en')
    const [idVerify, setIdVerify] = useState(true)
    const toggle = () => setModal(!modal)

    const canInvite = !!(userData?.organization?.organization_type_id == process.env.ORG_TYPE_NORMAL || userData?.organization?.organization_type_id == process.env.ORG_TYPE_HOST)

    useEffect(() => {
        const getInitialData = async () => {
            const orgType = await fetchOrgType()
            setOrgTypes(orgType)
            const userData = await fetchUserById({ id: props.user.id })
            setUserData(userData)
        }
        getInitialData()
    }, [])

    const InviteAddOrganizationSchema = Yup.object().shape({
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
            let payload = { ...data, organizationType, mspType, uniqueId: props.user.unique_id, language }
            if (language == 'mn') payload = { ...payload, idVerify }
            const inviteResponse = await inviteOrganization(payload)
            if (inviteResponse.invitationAlreadyExists) {
                notify(string.organization.inviteAlreadySent)
            } else if (inviteResponse.organizationAlreadyExists) {
                notify(string.organization.accountAlreadyExist)
            } else {
                notify(string.apiResponses.orgInvitedSuccess)
                toggle()
            }
        } catch (err) {
            notify(string.organization.organizationInviteErr)
        }
        NProgress.done()
        setIsLoading(false)
    }

    return (
        <>
            {canInvite && (
                <Button className='btn btn-primary large-btn' onClick={toggle}>
                    {string.organization.inviteOrganization}
                </Button>
            )}
            <Modal className='customModal document' isOpen={modal} toggle={toggle}>
                <ModalHeader toggle={toggle} cssModule={{ 'modal-title': 'modal-title text-uppercase text-dark font-weight-bold' }}>
                    {string.organization.inviteOrganization}
                </ModalHeader>
                <ModalBody>
                    <Formik
                        initialValues={{
                            firstName: '',
                            lastName: '',
                            email: '',
                        }}
                        validationSchema={InviteAddOrganizationSchema}
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
                                            <Input type='text' name='firstName' id='firstName' className='form-control' value={values.firstName} onChange={handleChange} placeholder={string.onboarding.firstName} />
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
                                            <div className='form-group col-md-12 p-0 d-flex mb-0'>
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

                                        {language == 'mn' && <hr className='w-100' />}

                                        <div className='form-group col-md-12 p-0'>
                                            <label htmlFor='email' className='col-md-12 col-form-label pl-0'>
                                                {string.onboarding.orgType}
                                            </label>
                                            {orgTypes.map((orgType, i) => {
                                                return (
                                                    <div className='form-check form-check-inline' key={i}>
                                                        <input checked={organizationType == orgType.id ? 'checked' : ''} onClick={() => setOrganizationType(orgType.id)} className='form-check-input' type='radio' name='orgType' id={`inlineRadio${i}`} value={orgType.id} />
                                                        <label className='form-check-label' htmlFor={`inlineRadio${i}`}>
                                                            {orgType.name}
                                                        </label>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {(organizationType == 1 || organizationType == 2) && (
                                            <div className='form-group col-md-12 p-0'>
                                                <label htmlFor='email' className='col-md-12 col-form-label pl-0'>
                                                    {string.onboarding.mspType}
                                                </label>
                                                <div className='form-check form-check-inline'>
                                                    <input checked={mspType == 1 ? 'checked' : ''} onClick={() => setMspType(1)} className='form-check-input' type='radio' name='mspType' id='fabricca' value='1' />
                                                    <label className='form-check-label' htmlFor='fabricca'>
                                                        {string.onboarding.fabricCa}
                                                    </label>
                                                </div>
                                                <div className='form-check form-check-inline'>
                                                    <input checked={mspType == 2 ? 'checked' : ''} onClick={() => setMspType(2)} className='form-check-input' type='radio' name='mspType' id='vault' value='2' />
                                                    <label className='form-check-label' htmlFor='vault'>
                                                        {string.onboarding.vault}
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

export default InviteOrganization
