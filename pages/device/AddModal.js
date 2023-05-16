import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'

import FormHelperMessage from '../../components/common/form-elements/formHelperMessage'
import string from '../../utils/LanguageTranslation.js'
import Button from '../../components/common/form-elements/button/Button'
import Input from '../../components/common/form-elements/input/Input'
import CustomSelect from '../../components/common/form-elements/select/CustomSelect'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'

const AddDeviceschema = Yup.object().shape({
    vendor_id: Yup.string().trim().required(`${string.vendor} ${string.errors.required}`),

    deviceID: Yup.string()
        .trim()
        .required(`${string.deviceId} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.deviceId} ${string.errors.invalid}`),
    tag: Yup.string()
        .trim()
        .required(`${string.tag} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.tag} ${string.errors.invalid}`),
})

function AddModal({ isOpen, toggle, isLoading, devicevendors, deviceExists, onDeviceSubmit, state }) {
    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <Modal isOpen={isOpen} toggle={toggle} className='customModal'>
                <ModalHeader toggle={toggle}>
                    <h5 className='modal-title text-dark font-weight-bold'>{string.addDevice}</h5>
                </ModalHeader>
                <ModalBody className='text-center'>
                    <Formik
                        initialValues={{
                            vendor_id: '',
                            deviceID: '',
                            tag: '',
                        }}
                        validationSchema={AddDeviceschema}
                        onSubmit={async (values, { resetForm }) => {
                            Object.keys(values).map((key) => values[key] = values[key].trim())
                            const isDeviceAdded = await onDeviceSubmit(values)
                            if (isDeviceAdded) {
                                resetForm()
                                toggle()
                            }
                        }}
                    >
                        {({ errors, touched, handleChange, handleSubmit, values }) => (
                            <form className='form-container' onSubmit={handleSubmit}>
                                <div className='row ml-0 mr-0 content-block'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.selectVendor}</label>
                                        <CustomSelect className='form-control' name='vendor_id' value={values.vendor_id} onChange={handleChange} options={devicevendors} defaultOptionText={string.selectVendor} />
                                        {errors.vendor_id && touched.vendor_id ? <FormHelperMessage message={errors.vendor_id} className='error' /> : null}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='deviceID' className='col-md-12 col-form-label pl-0'>
                                            {string.deviceId}
                                        </label>
                                        <Input type='text' name='deviceID' id='deviceID' className='form-control' placeholder={string.deviceId} value={values.deviceID} onChange={handleChange} />
                                        {(() => {
                                            if (errors.deviceID && touched.deviceID) {
                                                return <FormHelperMessage message={errors.deviceID} className='error' />
                                            } else if (deviceExists) {
                                                return <FormHelperMessage message={string.project.deviceAlreadyExists} className='error' />
                                            }
                                        })()}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='tag' className='col-md-12 col-form-label pl-0'>
                                            {string.tag}
                                        </label>
                                        <Input type='text' name='tag' id='tag' className='form-control' placeholder={string.tag} value={values.tag} onChange={handleChange} />
                                        {(() => {
                                            if (errors.tag && touched.tag) {
                                                return <FormHelperMessage message={errors.tag} className='error' />
                                            }
                                        })()}
                                    </div>
                                </div>
                                <div className='modal-footer'>
                                    <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={isLoading} text={string.insertBtnTxt} />
                                </div>
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
