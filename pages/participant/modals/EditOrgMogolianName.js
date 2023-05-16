import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import { Formik } from 'formik'
import * as Yup from 'yup'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import Input from '../../../components/common/form-elements/input/Input'
import string from '../../../utils/LanguageTranslation.js'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'
import { getMVSToken, verifyMangolianOrg } from '../../../lib/api/sendRequest'
import { useState } from 'react'

const EditOrgMogolianName = ({ openEditOrgModal, toggleEditOrgMongoNameModal, organization, setState, updateOrganizationData }) => {
    const [isEditingOrg, setIsEdsitingOrg] = useState(false)
    const [showTick, setShowTick] = useState(false)
    const EditOrgMongoNameSchema = Yup.object().shape({})
    const verifyDetails = async (values) => {
        const errors = {}
        setIsEdsitingOrg(true)
        const data = {
            local_name: values.local_name.trim(),
            stateRegId: values.stateRegId,
        }

        const verificationToken = await getMVSToken()
        const verToken = verificationToken.token
        const opts = {
            register: data.stateRegId,
            name: data.local_name,
        }

        const orgVerification = await verifyMangolianOrg(opts, verToken)
        if (orgVerification.match) {
            setState({
                organization: Object.assign({}, organization, {
                    local_name: values.local_name.trim(),
                    stateRegId: values.stateRegId,
                    state_registration_id: values.stateRegId,
                    organization_categories: values.organization_categories,
                }),
            })
            setShowTick(true)
            setTimeout(() => {
                updateOrganizationData()
                toggleEditOrgMongoNameModal()
            })
        } else {
            errors.local_name = string.onboarding.notRegisterd
            errors.stateRegId = string.onboarding.notRegisterd
        }
        setIsEdsitingOrg(false)
        return errors
    }
    return (
        <Modal className='customModal document' isOpen={openEditOrgModal} toggle={toggleEditOrgMongoNameModal}>
            <ModalHeader isOpen={openEditOrgModal} toggle={toggleEditOrgMongoNameModal}>
                <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {string.organization.orgVerifHeading}
                </h5>
            </ModalHeader>
            <ModalBody>
                <Formik
                    initialValues={{
                        stateRegId: organization.state_registration_id || '',
                        local_name: organization.local_name || '',
                        organization_categories: organization.organization_categories?.length ? organization.organization_categories.map((cat) => cat.participant_category) : [],
                    }}
                    validationSchema={EditOrgMongoNameSchema}
                    validate={verifyDetails}
                    validateOnChange={false}
                    validateOnBlur={false}
                    onSubmit={(values) => {
                        setState({
                            organization: Object.assign({}, organization, {
                                local_name: values.local_name.trim(),
                                stateRegId: values.stateRegId,
                                state_registration_id: values.stateRegId,
                                organization_categories: values.organization_categories,
                                regAndNameUpdated: true,
                            }),
                        })
                    }}
                >
                    {({ errors, touched, handleChange, handleSubmit, values }) => {
                        return (
                            <form className='form-container' onSubmit={handleSubmit}>
                                <div className='row ml-0 mr-0 content-block'>
                                    <div className='form-group col-md-12 p-0 '>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.onboarding.stateRegId}
                                        </label>
                                        <div>
                                            <Input className='form-control ob-org-input' type='text' name='stateRegId' id='stateRegId' value={values.stateRegId} onChange={handleChange} placeholder={string.onboarding.stateRegId} />
                                            <div className='ob-org-check'>{showTick && <img src='/static/img/onboarding/correct.png' />}</div>
                                        </div>
                                        <div> {touched.stateRegId && errors.stateRegId ? <FormHelperMessage message={errors.stateRegId} className='error' /> : null}</div>
                                    </div>

                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.organization.orgLocalName}
                                        </label>
                                        <div>
                                            <Input className='form-control ob-org-input' type='text' name='local_name' id='local_name' value={values.local_name} onChange={handleChange} placeholder={string.organization.orgLocalName} />
                                            <div className='ob-org-check'>{showTick && <img src='/static/img/onboarding/correct.png' />}</div>
                                        </div>
                                        <div> {touched.local_name && errors.local_name ? <FormHelperMessage message={errors.local_name} className='error' /> : null}</div>
                                    </div>
                                </div>
                                <ModalFooter>
                                    <LoaderButton cssClass='btn btn-primary large-btn' type='submit' text={string.organization.verifydetailsBtn} data-dismiss='modal' isLoading={isEditingOrg} />
                                </ModalFooter>
                            </form>
                        )
                    }}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

export default EditOrgMogolianName
