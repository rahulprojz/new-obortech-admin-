import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import { useState } from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'
import Input from '../../../components/common/form-elements/input/Input'
import CustomSelect from '../../../components/common/form-elements/select/CustomSelect'
import AdvanceSelect from '../../../components/common/form-elements/select/AdvanceSelect'
import string from '../../../utils/LanguageTranslation.js'
import OrgEditWarning from '../modals/OrgEditWarning'
import EditOrgMogolianName from '../modals/EditOrgMogolianName'
const EditOrganization = ({ isLoading, cities, states, countries, orgExists, organization, editMode, openOrganization, toggleOrganizationModal, setState, updateOrganizationData, addOrganizationData, handleStateChange, participant_categories, user_types, handleCountryChange, user, user_roles }) => {
    const AddOrganizationSchema = Yup.object().shape({
        name: Yup.string()
            .trim()
            .required(`${string.organization.orgName} ${string.errors.required}`)
            .matches(/^(?!.*["'`\\])/, `${string.organization.orgName} ${string.errors.invalid}`),

        local_name: Yup.string()
            .trim()
            .matches(/^(?!.*["'`\\])/, `${string.organization.orgLocalName} ${string.errors.invalid}`),

        stateRegId: Yup.string()
            .trim()
            .matches(/^(?!.*["'`\\])/, `${string.onboarding.stateRegId} ${string.errors.invalid}`),

        streetAddress: Yup.string()
            .required(`${string.onboarding.address} ${string.errors.required}`)
            .matches(/^(?!.*["'`\\])/, `${string.onboarding.address} ${string.errors.invalid}`),

        country_id: Yup.string().required(`${string.onboarding.country} ${string.errors.required}`),
        state_id: Yup.string().required(`${string.onboarding.state} ${string.errors.required}`),
        type_id: Yup.string().required(`${string.selectTypeNot}`),
        organization_categories: Yup.array().min(1, `${string.selectCatagoryNot}`),
    })
    const [isOpenWarningModal, setIsOpenWarningModal] = useState(false)
    const [openEditOrgModal, setOpenEditOrgModal] = useState(false)
    const isCEOUser = process.env.ROLE_CEO === String(user.role_id)
    const isSeniorManager = process.env.ROLE_SENIOR_MANAGER == user.role_id
    const isVerifiedUser = user.is_mvs_verified
    const isVerifiedOrg = organization.is_mvs_verified

    const _handleWarningOnToggle = (val) => {
        setIsOpenWarningModal(val === true ? true : false)
    }
    const handleClick = () => {
        setOpenEditOrgModal(true)
        setIsOpenWarningModal(false)
    }
    const toggleEditOrgMongoNameModal = () => {
        setOpenEditOrgModal(!openEditOrgModal)
    }

    const isCeoOrganizationSame = user.organization_id === organization.id

    return (
        <Modal className='customModal document' isOpen={openOrganization} toggle={toggleOrganizationModal}>
            <ModalHeader toggle={toggleOrganizationModal}>
                <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {editMode === 'organization' ? `${string.participant.editOrgName}` : `${string.participant.addOrgName}`}
                </h5>
            </ModalHeader>
            <ModalBody>
                <Formik
                    initialValues={{
                        name: organization.name || '',
                        local_name: organization.local_name || '',
                        streetAddress: organization.streetAddress || '',
                        country_id: organization.country_id || '',
                        state_id: organization.state_id || '',
                        city_id: organization.city_id || '',
                        type_id: organization.type_id || '',
                        stateRegId: organization.state_registration_id || '',
                        // category_id: organization.category_id || '',
                        organization_categories: organization.organization_categories?.length ? organization.organization_categories.map((cat) => cat.participant_category) : [],
                    }}
                    validationSchema={AddOrganizationSchema}
                    onSubmit={(values) => {
                        setState({
                            organization: Object.assign({}, organization, {
                                name: values.name.trim(),
                                local_name: values.local_name.trim(),
                                streetAddress: values.streetAddress.trim(),
                                country_id: values.country_id,
                                state_id: values.state_id,
                                city_id: values.city_id,
                                // category_id: values.category_id,
                                type_id: values.type_id,
                                organization_categories: values.organization_categories,
                                regAndNameUpdated: false,
                            }),
                        })
                        if (editMode === 'organization') {
                            updateOrganizationData()
                        } else {
                            addOrganizationData()
                        }
                    }}
                >
                    {({ errors, touched, handleChange, handleSubmit, values }) => {
                        return (
                            <form className='form-container' onSubmit={handleSubmit}>
                                <div className='row ml-0 mr-0 content-block'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.selectCategory}</label>
                                        <AdvanceSelect
                                            isMulti
                                            isClearable
                                            isSearchable
                                            isDisabled={!organization.sync_status}
                                            name='organization_categories'
                                            value={values.organization_categories}
                                            onChange={(selections) => {
                                                handleChange({ target: { id: 'organization_categories', value: selections || [] } })
                                            }}
                                            options={participant_categories}
                                            getOptionLabel={(option) => option.name}
                                            getOptionValue={(option) => option.id}
                                            placeholder={string.selectCategory}
                                        />
                                        {errors.organization_categories && touched.organization_categories ? <FormHelperMessage message={errors.organization_categories} className='error' /> : null}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.onboarding.selectType}</label>
                                        <CustomSelect className='form-control' name='type_id' value={values.type_id} onChange={handleChange} options={user_types} defaultOptionText={string.onboarding.selectType} />
                                        {errors.type_id && touched.type_id ? <FormHelperMessage message={errors.type_id} className='error' /> : null}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.organization.engOrgName}
                                        </label>
                                        <Input type='text' name='name' id='name' className={editMode && organization.isApproved ? 'form-control org-name-disabled' : 'form-control'} value={values.name} onChange={handleChange} placeholder={string.organization.engOrgName} />
                                        {(() => {
                                            if (errors.name && touched.name) {
                                                return <FormHelperMessage message={errors.name} className='error' />
                                            } else if (orgExists) {
                                                return <FormHelperMessage message={string.organization.orgAlreadyExists} className='error' />
                                            }
                                        })()}
                                    </div>
                                    {values?.country_id == 146 && (
                                        <div className='form-group col-md-12 p-0'>
                                            <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                                {string.organization.orgLocalName}
                                            </label>
                                            <Input
                                                type='text'
                                                name='local_name'
                                                id='mongName'
                                                className={(isCEOUser || isSeniorManager) && isCeoOrganizationSame && (!isVerifiedUser || !isVerifiedOrg) ? 'form-control org-name-disabled ob-org-registrationID' : 'form-control org-name-disabled'}
                                                value={values.local_name}
                                                onChange={handleChange}
                                                placeholder={string.organization.orgLocalName}
                                            />
                                            {(isCEOUser || isSeniorManager) && isCeoOrganizationSame && (!isVerifiedUser || !isVerifiedOrg) && <i className='fa fa-pencil-alt ob-orgedit-icon' title={string.organization.editIconTitleLocalName} onClick={() => _handleWarningOnToggle(true)} />}
                                            {errors.local_name && touched.local_name ? <FormHelperMessage className='err' message={errors.local_name} /> : null}
                                        </div>
                                    )}

                                    { values?.country_id == 146 && (
                                        <div className='form-group col-md-12 p-0'>
                                            <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                                {string.onboarding.stateRegId}
                                            </label>
                                            <Input
                                                type='text'
                                                name='stateRegId'
                                                id='stateRegId'
                                                className={(isCEOUser || isSeniorManager) && isCeoOrganizationSame && (!isVerifiedUser || !isVerifiedOrg) ? 'form-control org-name-disabled ob-org-registrationID' : 'form-control org-name-disabled'}
                                                value={values.stateRegId}
                                                onChange={handleChange}
                                                placeholder={string.onboarding.stateRegId}
                                            />
                                            {(isCEOUser || isSeniorManager) && isCeoOrganizationSame && (!isVerifiedUser || !isVerifiedOrg) && <i className='fa fa-pencil-alt ob-orgedit-icon' title={string.organization.editIconTitleStateregid} onClick={() => _handleWarningOnToggle(true)} />}
                                            {errors.stateRegId && touched.stateRegId ? <FormHelperMessage className='err' message={errors.stateRegId} /> : null}
                                        </div>
                                    )}
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='streetAddress' className='col-md-12 col-form-label pl-0'>
                                            {string.onboarding.streetAddress}
                                        </label>
                                        <Input type='text' name='streetAddress' id='streetAddress' className='form-control' value={values.streetAddress} onChange={handleChange} placeholder={string.onboarding.streetAddress} />
                                        {errors.streetAddress && touched.streetAddress ? <FormHelperMessage message={errors.streetAddress} className='error' /> : null}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.onboarding.country}</label>
                                        <CustomSelect
                                            name='country_id'
                                            id='country_id'
                                            className='form-control'
                                            value={values.country_id}
                                            onChange={(event) => {
                                                handleCountryChange(event.target.value)
                                                handleChange(event)
                                            }}
                                        >
                                            <option value=''>{string.onboarding.selectCounty}</option>
                                            {countries?.map((country) => {
                                                return (
                                                    <option key={country.id} value={country.id}>
                                                        {country.name}
                                                    </option>
                                                )
                                            })}
                                        </CustomSelect>
                                        {errors.country_id && touched.country_id ? <FormHelperMessage className='err' message={errors.country_id} /> : null}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.onboarding.state}</label>
                                        <CustomSelect
                                            name='state_id'
                                            id='state_id'
                                            className='form-control'
                                            value={values.state_id}
                                            disabled={states?.length > 0 ? false : true}
                                            onChange={(event) => {
                                                handleStateChange(event.target.value)
                                                handleChange(event)
                                            }}
                                        >
                                            <option value=''>{string.onboarding.selectState}</option>
                                            {states?.map((stateData) => {
                                                return (
                                                    <option key={stateData.id} value={stateData.id}>
                                                        {stateData.name}
                                                    </option>
                                                )
                                            })}
                                        </CustomSelect>
                                        {errors.state_id && touched.state_id ? <FormHelperMessage className='err' message={errors.state_id} /> : null}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.onboarding.city}</label>
                                        <CustomSelect name='city_id' id='city_id' className='form-control' value={values.city_id} onChange={handleChange} disabled={cities?.length > 0 ? false : true}>
                                            <option value=''>{string.selectCity}</option>
                                            {cities?.map((city) => {
                                                return (
                                                    <option key={city.id} value={city.id}>
                                                        {city.name}
                                                    </option>
                                                )
                                            })}
                                        </CustomSelect>
                                        {errors.city_id && touched.city_id ? <FormHelperMessage className='err' message={errors.city_id} /> : null}
                                    </div>
                                </div>
                                <ModalFooter>
                                    <LoaderButton cssClass='btn btn-primary large-btn' type='submit' data-dismiss='modal' isLoading={isLoading} text={editMode === 'organization' ? `${string.updateBtnTxt}` : `${string.insertBtnTxt}`} />
                                </ModalFooter>
                            </form>
                        )
                    }}
                </Formik>
                <EditOrgMogolianName openEditOrgModal={openEditOrgModal} toggleEditOrgMongoNameModal={toggleEditOrgMongoNameModal} organization={organization} setState={setState} updateOrganizationData={updateOrganizationData} />
                <OrgEditWarning isOpen={isOpenWarningModal} onToggle={_handleWarningOnToggle} onSubmit={handleClick} />
            </ModalBody>
        </Modal>
    )
}
export default EditOrganization
