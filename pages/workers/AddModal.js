import Select from 'react-select'
import { Formik, Form, Field } from 'formik'
import { useState } from 'react'
import * as Yup from 'yup'
import FormHelperMessage from '../../components/common/form-elements/formHelperMessage'
import string from '../../utils/LanguageTranslation.js'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'
import Button from '../../components/common/form-elements/button/Button'
import Input from '../../components/common/form-elements/input/Input'
import { Modal, ModalBody, ModalHeader, ModalFooter } from 'reactstrap'
import './worker.css'
import CustomSelect from '../../components/common/form-elements/select/CustomSelect'

const AddWorkerschema = Yup.object().shape({
    first_name: Yup.string()
        .trim()
        .required(`${string.firstName} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.firstName} ${string.errors.invalid}`),
    last_name: Yup.string()
        .trim()
        .required(`${string.lastName} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.lastName} ${string.errors.invalid}`),
    email: Yup.string()
        .trim()
        .matches(/^(?!.*["'`\\])/, `${string.worker.email} ${string.errors.invalid}`),
    phone: Yup.string().trim().required(`${string.cellNo} ${string.errors.required}`),
    role_id: Yup.string().trim().required(`${string.role} ${string.errors.required}`),
    is_active: Yup.string().trim().required(`${string.worker.isActive} ${string.errors.required}`),
})

function AddModal({ isOpen, toggle, state, onWorkerSubmit, rolesArray, isLoading, emailExists, mobileExists }) {
    const [events, setEvents] = useState([])

    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <Modal isOpen={isOpen} toggle={() => toggle('AddModal')} className='customModal document' id='workerModal'>
                <ModalHeader toggle={() => toggle('AddModal')} cssModule={{ 'modal-title': 'modal-title text-dark font-weight-bold' }} id='exampleModalLabel'>
                    {string.worker.addWoker}
                </ModalHeader>
                <ModalBody>
                    <Formik
                        initialValues={{
                            first_name: '',
                            last_name: '',
                            phone: '',
                            email: '',
                            role_id: '3',
                            password: '',
                            is_active: '0',
                            country_code: '+1',
                        }}
                        validationSchema={AddWorkerschema}
                        onSubmit={async (values) => {
                            state({
                                worker: Object.assign({}, worker, {
                                    first_name: values.first_name,
                                    last_name: values.last_name,
                                    phone: values.phone,
                                    email: values.email,
                                    role_id: values.role_id,
                                    is_active: values.is_active,
                                    country_code: values.country_code,
                                }),
                            })
                            const workerSubmitted = await onWorkerSubmit()
                            if (workerSubmitted === true) {
                                setEvents([])
                                ;(values.first_name = ''), (values.last_name = ''), (values.number = '+976'), (values.phone = ''), (values.email = ''), (values.role_id = '3'), (values.password = ''), (values.is_active = '0'), (values.country_code = '+976')
                            }
                        }}
                    >
                        {({ errors, touched, handleChange, handleSubmit, values, handleBlur }) => (
                            <form className='form-container' onSubmit={handleSubmit}>
                                <div className='form-group col-md-12 p-0'>
                                    <label className='col-md-12 col-form-label pl-0'>{string.worker.selectTitle}</label>
                                    <CustomSelect name='role_id' className='form-control' value={values.role_id} onChange={handleChange} options={rolesArray} />
                                    {errors.role_id ? <FormHelperMessage className='err' message={errors.role_id} /> : null}
                                </div>
                                <div className='form-group col-md-12 p-0'>
                                    <label className='col-md-12 col-form-label pl-0'>{string.firstName}</label>
                                    <Input type='text' className='form-control' placeholder={`${string.firstName} *`} name='first_name' onChange={handleChange} value={values.first_name} />
                                    {errors.first_name ? <FormHelperMessage className='err' message={errors.first_name} /> : null}
                                </div>
                                <div className='form-group col-md-12 p-0'>
                                    <label className='col-md-12 col-form-label pl-0'>{string.lastName}</label>
                                    <Input type='text' className='form-control' placeholder={`${string.lastName} *`} name='last_name' onChange={handleChange} value={values.last_name} />
                                    {errors.last_name ? <FormHelperMessage className='err' message={errors.last_name} /> : null}
                                </div>
                                <div className='form-group col-md-12 p-0'>
                                    <label className='col-md-12 col-form-label pl-0'>{string.worker.email}</label>
                                    <Input type='email' className='form-control' placeholder={`${string.worker.email}`} name='email' onChange={handleChange} value={values.email} />
                                    {(() => {
                                        if (errors.email && touched.email) {
                                            emailExists = false
                                            return <FormHelperMessage className='error' message={errors.email} />
                                        } else if (emailExists) {
                                            return <FormHelperMessage message={string.worker.emailAlreadyExists} className='error' />
                                        }
                                    })()}
                                </div>
                                <div className='form-group col-md-12 p-0'>
                                    <label className='col-md-12 col-form-label pl-0'>{string.worker.phone}</label>
                                    <PhoneInput
                                        country={'mn'}
                                        inputProps={{
                                            name: 'phone',
                                        }}
                                        onBlur={handleBlur}
                                        value={values.number}
                                        onChange={(number, selectedData) => {
                                            let dialCode = selectedData.dialCode
                                            values.country_code = '+' + dialCode
                                            let contactNo = number.substring(dialCode.length)
                                            values.phone = contactNo
                                            values.number = number
                                        }}
                                    />
                                    {(() => {
                                        if (errors.phone && touched.phone) {
                                            mobileExists = false
                                            return <FormHelperMessage className='error' message={errors.phone} />
                                        } else if (mobileExists) {
                                            return <FormHelperMessage message={string.worker.mobileAlreadyExists} className='error' />
                                        }
                                    })()}
                                </div>
                                <div className='form-group col-md-12 p-0'>
                                    <label className='col-md-12 col-form-label pl-0'>{string.worker.isActive}</label>
                                    <CustomSelect
                                        name='is_active'
                                        className='form-control'
                                        value={values.is_active}
                                        onChange={handleChange}
                                        options={[
                                            { name: 'Inactive', id: 0 },
                                            { name: 'Active', id: 1 },
                                        ]}
                                    />
                                    {errors.is_active ? <FormHelperMessage className='err' message={errors.is_active} /> : null}
                                </div>

                                <ModalFooter>
                                    <LoaderButton cssClass='btn btn-primary large-btn' type='submit' text={string.insertBtnTxt} isLoading={isLoading} />
                                </ModalFooter>
                            </form>
                        )}
                    </Formik>
                </ModalBody>
            </Modal>
        )
    }
}

AddModal.propTypes = {}
AddModal.defaultProps = {}

export default AddModal
