import React, { useState } from 'react'
import { Modal, ModalBody, ModalHeader, ModalFooter } from 'reactstrap'
import string from '../../utils/LanguageTranslation.js'
import './profile.css'
import '../../static/css/modal.css'
import Input from '../common/form-elements/input/Input'
import { Formik } from 'formik'
import NProgress from 'nprogress'
import notify from '../../lib/notifier'
import * as Yup from 'yup'
import CustomSelect from '../common/form-elements/select/CustomSelect'
import { updateUserProfile, invalidateUserProfile } from '../../lib/api/user'
import FormHelperMessage from '../common/form-elements/formHelperMessage'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import { callNetworkApi } from '../../lib/api/network-api'
import AlphabetSelect from '../common/form-elements/select/AlphabetSelect.jsx'

const AddUserInfoSchema = Yup.object().shape({
    firstName: Yup.string()
        .required(`${string.onboarding.firstName} ${string.errors.required}`)
        .matches(/^[[aA-zZ -]*[aA-zZ][aA-zZ -]+$/, string.onboarding.validations.onlyAlphaField),
    lastName: Yup.string()
        .required(`${string.onboarding.lastName} ${string.errors.required}`)
        .matches(/^[[aA-zZ -]*[aA-zZ][aA-zZ -]+$/, string.onboarding.validations.onlyAlphaField),
    username: Yup.string().trim().required(`${string.userNameReqNot}`),
    isSMSAuth: Yup.string().required(`${string.organization.smsAuthentication} ${string.errors.required}`),
    email: Yup.string().trim().email(`${string.login.email} ${string.errors.email}`).required(`${string.login.email} ${string.errors.required}`),
})

const AddUserInfoSchemaForMongolian = Yup.object().shape({
    firstName: Yup.string()
        .required(`${string.onboarding.firstName} ${string.errors.required}`)
        .matches(/^[[aA-zZ -]*[aA-zZ][aA-zZ -]+$/, string.onboarding.validations.onlyAlphaField),
    localFirstName: Yup.string()
        .required(`${string.onboarding.localFirstName} ${string.errors.required}`)
        .matches(/^[\u0400-\u04FF -]*[\u0400-\u04FF][\u0400-\u04FF -]+$/, `${string.onboarding.localFirstName} ${string.onboarding.validations.onlyCyrillicAlphabet}`),
    lastName: Yup.string()
        .required(`${string.onboarding.lastName} ${string.errors.required}`)
        .matches(/^[[aA-zZ -]*[aA-zZ][aA-zZ -]+$/, string.onboarding.validations.onlyAlphaField),
    localLastName: Yup.string()
        .required(`${string.onboarding.localLastName} ${string.errors.required}`)
        .matches(/^[\u0400-\u04FF -]*[\u0400-\u04FF][\u0400-\u04FF -]+$/, `${string.onboarding.localLastName} ${string.onboarding.validations.onlyCyrillicAlphabet}`),
    username: Yup.string().trim().required(`${string.userNameReqNot}`),
    isSMSAuth: Yup.string().required(`${string.organization.smsAuthentication} ${string.errors.required}`),
    email: Yup.string().trim().email(`${string.login.email} ${string.errors.email}`).required(`${string.login.email} ${string.errors.required}`),
    userRegNumber: Yup.string()
        .trim()
        .required(`${string.onboarding.regNumber} ${string.errors.required}`)
        .matches(/^[0-9]+$/, `${string.onboarding.regNumber} ${string.onboarding.validations.onlyDigits}`)
        .test('len', `${string.onboarding.regNumber} ${string.onboarding.validations.exactEight}`, (val) => val?.length === 8),
})

function UpdateProfile(props) {
    const { userData, openEditModal, ipfsData, _getProfileData, toggleEdit, toggle, cookies } = props
    const [isLoading, setIsLoading] = useState(false)
    const isMongolianUser = userData?.country_id == 146

    const _handleUpdateProfile = async (formData) => {
        NProgress.start()
        setIsLoading(true)

        try {
            const response = await updateUserProfile(formData)
            if (response.emailAlreadyExists) {
                throw string.apiResponses.sameEmailExists
            }

            if (response.usernameAlreadyExists) {
                throw string.apiResponses.sameUsernameExists
            }

            //Store data on IPFS
            const ipfsDataObj = {
                firstName: formData.first_name,
                lastName: formData.last_name,
                userId: formData.uniq_id,
                email: formData.email,
                phoneNumber: formData.mobile,
                orgName: userData.organization.blockchain_name,
            }
            const ipfsResponse = await callNetworkApi(cookies.cookies.authToken, 'update-details', ipfsDataObj)
            if (!ipfsResponse.success) {
                throw ipfsResponse
            }
            await _getProfileData()
            toggleEdit()
            toggle()
            notify(string.profileUpdatedSuccess)
            if (process.env.ROLE_CEO != String(userData.role_id) && process.env.ROLE_ADMIN != String(userData.role_id) && process.env.ROLE_SENIOR_MANAGER != String(userData.role_id)) {
                const result = await invalidateUserProfile()
                if (result.status) {
                    window.location.href = `${process.env.SITE_URL}/logout`
                }
            }
        } catch (err) {
            notify(err.error || err.toString())
        }

        NProgress.done()
        setIsLoading(false)
    }
    let formikValidationSchema = AddUserInfoSchema
    if (isMongolianUser) {
        formikValidationSchema = AddUserInfoSchemaForMongolian
    }
    return (
        <Modal isOpen={openEditModal} toggle={toggleEdit} className='customModal'>
            <ModalHeader cssModule={{ 'modal-title': 'modal-title text-uppercase text-dark font-weight-bold' }} toggle={toggleEdit}>
                {string.editProfile}
            </ModalHeader>
            <ModalBody>
                <Formik
                    initialValues={{
                        firstName: userData?.first_name || '',
                        lastName: userData?.last_name || '',
                        localFirstName: userData?.local_first_name || '',
                        localLastName: userData?.local_last_name || '',
                        username: userData?.username || '',
                        email: userData?.email || '',
                        mobile: userData?.mobile || '',
                        isSMSAuth: userData.isSMSAuth ? 1 : 0,
                        firstAlphabet: userData?.registration_number?.charAt(0) || 'А',
                        secondAlphabet: userData?.registration_number?.charAt(1) || 'А',
                        userRegNumber: userData?.registration_number?.substring(2, 10) || '',
                    }}
                    validationSchema={formikValidationSchema}
                    onSubmit={async (values) => {
                        const formData = Object.assign(
                            {},
                            {
                                user_title: userData?.user_title?.name,
                                organization_id: userData?.organization.id,
                                user_id: userData?.id,
                                uniq_id: userData?.unique_id,
                                first_name: values.firstName.trim(),
                                local_first_name: values.localFirstName || null,
                                local_last_name: values.localLastName || null,
                                last_name: values.lastName.trim(),
                                username: values.username.trim(),
                                email: values.email.trim(),
                                country_code: userData?.country_code,
                                registration_number: isMongolianUser ? `${values.firstAlphabet}${values.secondAlphabet}${values.userRegNumber}` : null,
                                mobile: values.mobile,
                                isSMSAuth: values.isSMSAuth,
                                updateType: 'profile',
                            },
                        )
                        await _handleUpdateProfile(formData)
                    }}
                >
                    {({ errors, touched, handleChange, handleSubmit, setFieldValue, values }) => {
                        return (
                            <form className='form-container' onSubmit={handleSubmit}>
                                <div className='row ml-0 mr-0 content-block'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='firstName' className='col-md-12 col-form-label pl-0'>
                                            {isMongolianUser ? string.onboarding.engFirstName : string.onboarding.firstName}
                                        </label>
                                        <Input type='text' name='firstName' id='firstName' className='form-control' value={values.firstName} onChange={handleChange} placeholder={isMongolianUser ? string.onboarding.engFirstName : string.onboarding.firstName} />
                                        {errors.firstName && touched.firstName ? <FormHelperMessage message={errors.firstName} className='error' /> : null}
                                    </div>
                                    {isMongolianUser && (
                                        <div className='form-group col-md-12 p-0'>
                                            <label htmlFor='localFirstName' className='col-md-12 col-form-label pl-0'>
                                                {string.onboarding.localFirstName}
                                            </label>
                                            <Input type='text' name='localFirstName' id='localFirstName' className='form-control' value={values.localFirstName} onChange={handleChange} placeholder={string.onboarding.localFirstName} />
                                            {errors.localFirstName && touched.localFirstName ? <FormHelperMessage message={errors.localFirstName} className='error' /> : null}
                                        </div>
                                    )}
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='lastName' className='col-md-12 col-form-label pl-0'>
                                            {isMongolianUser ? string.onboarding.engLastName : string.onboarding.lastName}
                                        </label>
                                        <Input type='text' name='lastName' id='lastName' className='form-control' value={values.lastName} onChange={handleChange} placeholder={isMongolianUser ? string.onboarding.engLastName : string.onboarding.lastName} />
                                        {errors.lastName && touched.lastName ? <FormHelperMessage message={errors.lastName} className='error' /> : null}
                                    </div>
                                    {isMongolianUser && (
                                        <div className='form-group col-md-12 p-0'>
                                            <label htmlFor='localLastName' className='col-md-12 col-form-label pl-0'>
                                                {string.onboarding.localLastName}
                                            </label>
                                            <Input type='text' name='localLastName' id='localLastName' className='form-control' value={values.localLastName} onChange={handleChange} placeholder={string.onboarding.localLastName} />
                                            {errors.localLastName && touched.localLastName ? <FormHelperMessage message={errors.localLastName} className='error' /> : null}
                                        </div>
                                    )}
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='username' className='col-md-12 col-form-label pl-0'>
                                            {string.onboarding.username}
                                        </label>
                                        <Input type='text' name='username' id='username' className='form-control input-disabled' disabled value={values.username} onChange={handleChange} placeholder={string.onboarding.username} />
                                        {errors.username && touched.username ? <FormHelperMessage message={errors.username} className='error' /> : null}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='email' className='col-md-12 col-form-label pl-0'>
                                            {string.participant.email}
                                        </label>
                                        <Input type='text' name='email' id='email' className='form-control input-disabled' disabled value={values.email} onChange={handleChange} placeholder={string.participant.email} />
                                        {errors.email && touched.email ? <FormHelperMessage message={errors.email} className='error' /> : null}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='mobile' className='col-md-12 col-form-label pl-0'>
                                            {string.participant.mobile}
                                        </label>
                                        <Input type='text' name='mobile' id='mobile' disabled className='form-control input-disabled' value={values.mobile} onChange={handleChange} placeholder={string.participant.mobile} />
                                        {errors.mobile && touched.mobile ? <FormHelperMessage message={errors.mobile} className='error' /> : null}
                                    </div>
                                    {isMongolianUser && (
                                        <div className='form-group col-md-12 p-0'>
                                            <label htmlFor='userRegistrationNumber' className='col-md-12 col-form-label pl-0'>
                                                {string.onboarding.regNumber}
                                            </label>
                                            <div className='row' id='userRegistrationNumber'>
                                                <div className='col-4 p-0 d-flex'>
                                                    <AlphabetSelect name='firstAlphabet' from='profile' value={values.firstAlphabet} onSelect={(text) => setFieldValue('firstAlphabet', text)} />
                                                    <AlphabetSelect name='secondAlphabet' from='profile' value={values.secondAlphabet} onSelect={(text) => setFieldValue('secondAlphabet', text)} />
                                                </div>
                                                <div className='ml-0 col-8 pl-0'>
                                                    <Input type='text' className='form-control' name='userRegNumber' placeholder={string.onboarding.regNumber} value={values.userRegNumber} onChange={handleChange} />
                                                    {errors.userRegNumber && touched.userRegNumber ? <FormHelperMessage message={errors.userRegNumber} className='error' /> : null}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className='form-group col-md-12 p-0 mb-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.organization.smsAuthentication}</label>
                                        <CustomSelect name='isSMSAuth' id='isSMSAuth' className='form-control' value={values.isSMSAuth} onChange={handleChange}>
                                            <option key={0} value={0}>
                                                {string.disabled}
                                            </option>
                                            <option key={1} value={1}>
                                                {string.enabled}
                                            </option>
                                        </CustomSelect>
                                        {errors.isSMSAuth && touched.isSMSAuth ? <FormHelperMessage className='err' message={errors.isSMSAuth} /> : null}
                                    </div>
                                </div>
                                <ModalFooter>
                                    <LoaderButton isLoading={isLoading} cssClass='btn btn-primary large-btn' type='submit' text={string.updateBtnTxt} />
                                </ModalFooter>
                            </form>
                        )
                    }}
                </Formik>
            </ModalBody>
        </Modal>
    )
}
export default UpdateProfile
