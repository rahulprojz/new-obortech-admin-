import { Formik, Field, ErrorMessage } from 'formik'
import React from 'react'
import * as Yup from 'yup'
import { filter } from 'lodash'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import string from '../../utils/LanguageTranslation'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'
import AdvanceSelect from '../../components/common/form-elements/select/AdvanceSelect'

function Form({ isOpen, toggle, policy, addPolicy, purposearr, is_loading }) {
    const AddPolicySchema = Yup.object().shape({
        clause: Yup.string()
            .trim()
            .required(`${string.dataclause} ${string.errors.required}`)
            .matches(/^(?!.*["'`\\])/, `${string.dataclause} ${string.errors.invalid}`),
        purpose: Yup.array().required(`${string.userDataRequest.requestpurpose} ${string.errors.required}`),
        dataOperands: Yup.array().min(1, `${string.dataoperands} ${string.errors.required}`),
        access: Yup.array().min(1, `${string.dataaccess} ${string.errors.required}`),
    })

    const dataOperandsOptions = {
        firstname: string.firstName,
        lastname: string.lastName,
        email: string.participant.email,
        phonenumber: string.cellNo,
        orgcertificate: string.orgCertificate,
        otherdetails: string.otherOrgDetails,
    }

    // Creating array from policy object
    const dataOperands = policy ? policy.policy_required_data.map((data) => data.data_type) : []
    const access = policy ? policy.policy_accesses.map((data) => data.access) : []
    let defaultPurposeArr = []
    if (policy) {
        defaultPurposeArr.push({ label: policy.request_purpose.purpose_value, value: policy.request_purpose.purpose_key })
    }

    if (typeof window === 'undefined') {
        return null
    }
    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal'>
            <ModalHeader cssModule={{ 'modal-title': 'modal-title text-dark font-weight-bold' }} toggle={toggle}>
                {policy ? string.privacyPolicy.editpolicy : string.privacyPolicy.createpolicy}
            </ModalHeader>
            <ModalBody>
                <Formik
                    enableReinitialize
                    initialValues={{
                        clause: policy ? policy.clause : '',
                        purpose: policy ? defaultPurposeArr : '',
                        dataOperands: policy ? dataOperands : [],
                        access: policy ? access : [],
                    }}
                    validationSchema={AddPolicySchema}
                    onSubmit={async (values) => {
                        if (typeof values.purpose != 'string') {
                            let data = { ...values }
                            data.purpose = values.purpose[0].value
                            await addPolicy(data)
                        } else {
                            await addPolicy(values)
                        }
                    }}
                >
                    {({ setFieldValue, errors, touched, handleChange, handleSubmit, values }) => (
                        <form className='form-container' onSubmit={handleSubmit}>
                            <div className='form-group'>
                                <label htmlFor='longitude' className='col-md-12 col-form-label pl-0'>
                                    {string.userDataRequest.requestpurpose}
                                </label>
                                <AdvanceSelect
                                    id='purpose'
                                    isClearable={false}
                                    isSearchable={false}
                                    defaultValue={values.purpose ? values.purpose : ''}
                                    name='purpose'
                                    options={purposearr}
                                    onChange={(val) => {
                                        const data = [val]
                                        setFieldValue('purpose', data)
                                    }}
                                />
                                <div className='error'>
                                    <ErrorMessage className='error' name='purpose' />
                                </div>
                            </div>
                            <div className='form-group'>
                                <label htmlFor='longitude' className='col-md-12 col-form-label pl-0'>
                                    {string.dataclause}
                                </label>
                                <input type='text' name='clause' value={values.clause} className='form-control' id='dataClause' placeholder={string.dataclause} onChange={handleChange} />
                                <div className='error'>
                                    <ErrorMessage className='error' name='clause' />
                                </div>
                            </div>
                            <div className='form-group'>
                                <label htmlFor='longitude' className='col-md-12 col-form-label pl-0'>
                                    {string.dataoperands}
                                </label>{' '}
                                <br />
                                {Object.keys(dataOperandsOptions).map((operand, i) => {
                                    return (
                                        <div className='form-check form-check-inline'>
                                            <Field className='form-check-input' type='checkbox' name='dataOperands' value={operand} />
                                            <label className='form-check-label' for='email'>
                                                {dataOperandsOptions[operand]}
                                            </label>
                                        </div>
                                    )
                                })}
                                <div className='error'>
                                    <ErrorMessage className='error' name='dataOperands' />
                                </div>
                            </div>
                            <div className='form-group'>
                                <label htmlFor='longitude' className='col-md-12 col-form-label pl-0'>
                                    {string.dataaccess}
                                </label>{' '}
                                <br />
                                <div className='form-check form-check-inline'>
                                    <Field className='form-check-input' type='checkbox' name='access' value='read' />
                                    <label className='form-check-label' for='accessRead'>
                                        {string.accessRead}
                                    </label>
                                </div>
                                <div className='form-check form-check-inline'>
                                    <Field className='form-check-input' type='checkbox' name='access' value='write' />
                                    <label className='form-check-label' for='accesswrite'>
                                        {string.accessWrite}
                                    </label>
                                </div>
                                <div className='form-check form-check-inline'>
                                    <Field className='form-check-input' type='checkbox' name='access' value='delete' />
                                    <label className='form-check-label' for='accessdelete'>
                                        {string.accessDelete}
                                    </label>
                                </div>
                                <div className='form-check form-check-inline'>
                                    <Field className='form-check-input' type='checkbox' name='access' value='saveuserdata' />
                                    <label className='form-check-label' for='saveuserdata'>
                                        {string.accesssaveuserdata}
                                    </label>
                                </div>
                                <div className='error'>
                                    <ErrorMessage className='error' name='access' />
                                </div>
                            </div>
                            <div className='modal-footer'>
                                <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={is_loading} text={string.submitBtnTxt} />
                            </div>
                        </form>
                    )}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

Form.propTypes = {}
Form.defaultProps = {}

export default Form
