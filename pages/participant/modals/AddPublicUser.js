import React, { useState, useEffect } from 'react'
import * as Yup from 'yup'
import NProgress from 'nprogress'
import { Formik } from 'formik'
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import Button from '../../../components/common/form-elements/button/Button'
import string from '../../../utils/LanguageTranslation'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'
import Input from '../../../components/common/form-elements/input/Input'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import notify from '../../../lib/notifier'
import { fetchUserById } from '../../../lib/api/user'
import { addPublicUser } from '../../../lib/api/user'
import '../../../static/css/modal.css'
import '../../../components/inviteOrganization/inviteOrganization.css'

const AddPublicUserSchema = Yup.object().shape({
    username: Yup.string()
        .trim()
        .required(`${string.onboarding.username} ${string.errors.required}`)
        .matches(/^(\S+$)/, `${string.onboarding.validations.alphanumeric}`)
        .matches(/^(?!.*["'`\\])/, `${string.onboarding.username} ${string.errors.invalid}`),

    password: Yup.string()
        .required(`${string.onboarding.passWord} ${string.errors.required}`)
        .min(6, `${string.publicUser.passwordShouldBeSix}`)
        .matches(/^(?!.*["'`\\])/, `${string.onboarding.passWord} ${string.errors.invalid}`),
})

const AddPublicUser = (props) => {
    const [modal, setModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [userData, setUserData] = useState({})

    const toggle = () => setModal(!modal)

    const canInvite = !!(userData?.organization?.organization_type_id == process.env.ORG_TYPE_NORMAL || userData?.organization?.organization_type_id == process.env.ORG_TYPE_HOST)

    useEffect(() => {
        const getInitialData = async () => {
            const userData = await fetchUserById({ id: props.user.id })
            setUserData(userData)
        }
        getInitialData()
    }, [])

    const addUser = async (data) => {
        NProgress.start()
        setIsLoading(true)
        try {
            const response = await addPublicUser(data)
            if (response.usernameAlreadyExists) {
                notify(string.apiResponses.sameUsernameExists)
            } else {
                if (response.error) {
                    notify(string.organization.addPublicUserErr)
                } else {
                    notify(string.organization.addPublicUserSuccess)
                    toggle()
                    props.onFetchOrgs({ isFetchAll: true })
                }
            }
        } catch (err) {
            notify(string.organization.addPublicUserErr)
        }
        NProgress.done()
        setIsLoading(false)
    }

    return (
        <>
            {canInvite && (
                <Button className='btn btn-primary large-btn' onClick={toggle}>
                    {string.organization.addPublicUser}
                </Button>
            )}
            <Modal className='customModal document' isOpen={modal} toggle={toggle}>
                <ModalHeader toggle={toggle} cssModule={{ 'modal-title': 'modal-title text-uppercase text-dark font-weight-bold' }}>
                    {string.organization.addPublicUser}
                </ModalHeader>
                <ModalBody>
                    <Formik
                        initialValues={{
                            username: '',
                            password: '',
                        }}
                        validationSchema={AddPublicUserSchema}
                        onSubmit={async (values) => {
                            await addUser(values)
                        }}
                    >
                        {({ errors, touched, handleChange, handleSubmit, values }) => {
                            return (
                                <form className='form-container' onSubmit={handleSubmit}>
                                    <div className='row ml-0 mr-0 content-block'>
                                        <div className='form-group col-md-12 p-0'>
                                            <label htmlFor='username' className='col-md-12 col-form-label pl-0'>
                                                {string.onboarding.username}
                                            </label>
                                            <Input type='text' name='username' id='username' className='form-control' value={values.username} onChange={handleChange} placeholder={string.onboarding.username} />
                                            {(() => {
                                                if (errors.username && touched.username) {
                                                    return <FormHelperMessage message={errors.username} className='error' />
                                                }
                                            })()}
                                        </div>

                                        <div className='form-group col-md-12 p-0'>
                                            <label htmlFor='password' className='col-md-12 col-form-label pl-0'>
                                                {string.onboarding.passWord}
                                            </label>
                                            <Input type='password' name='password' id='password' className='form-control' value={values.password} onChange={handleChange} placeholder={string.onboarding.passWord} />
                                            {errors.password && touched.password ? <FormHelperMessage message={errors.password} className='error' /> : null}
                                        </div>
                                    </div>
                                    <ModalFooter>
                                        <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={isLoading} text={string.submitBtnTxt} />
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

export default AddPublicUser
