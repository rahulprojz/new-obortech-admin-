import { Formik } from 'formik'
import * as Yup from 'yup'
import FormHelperMessage from '../../components/common/form-elements/formHelperMessage'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import string from '../../utils/LanguageTranslation.js'
// updated
import Button from '../../components/common/form-elements/button/Button'
import Input from '../../components/common/form-elements/input/Input'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'

const AddDevicevendorschema = Yup.object().shape({
    name: Yup.string()
        .trim()
        .required(`${string.vendorName} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.vendorName} ${string.errors.invalid}`),

    api_key: Yup.string()
        .trim()
        .required(`${string.apiKey.Apikey} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.apiKey.Apikey} ${string.errors.invalid}`),
})

function AddVendorModal({ isLoading, state, onVendorSubmit, isOpen, toggle }) {
    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <Modal isOpen={isOpen} toggle={toggle} className='customModal'>
                <ModalHeader toggle={toggle}>
                    <h5 className='modal-title text-dark font-weight-bold'>{string.addDeviceVendor}</h5>
                </ModalHeader>
                <ModalBody className='text-center'>
                    <Formik
                        initialValues={{
                            name: '',
                            api_key: '',
                        }}
                        validationSchema={AddDevicevendorschema}
                        onSubmit={(values) => {
                            let vendorObj = {
                                name: values.name,
                                api_key: values.api_key,
                            }
                            state({ vendor: vendorObj })
                            onVendorSubmit()
                            toggle()
                            values.name = ''
                            values.api_key = ''
                        }}
                    >
                        {({ errors, touched, handleChange, handleSubmit, values }) => (
                            <form className='form-container' onSubmit={handleSubmit}>
                                <div className='row ml-0 mr-0 content-block mb-2'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.vendorName}
                                        </label>
                                        <Input type='text' name='name' id='name' className='form-control' placeholder={string.vendorName} value={values.name} onChange={handleChange} />
                                        {errors.name && touched.name ? <FormHelperMessage message={errors.name} className='error' /> : null}
                                    </div>
                                </div>
                                <div className='row ml-0 mr-0 content-block mb-3'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='api_key' className='col-md-12 col-form-label pl-0'>
                                            {string.apiKey.Apikey}
                                        </label>
                                        <Input type='text' name='api_key' id='api_key' className='form-control' placeholder={string.apiKey.Apikey} value={values.api_key} onChange={handleChange} />
                                        {errors.api_key && touched.api_key ? <FormHelperMessage message={errors.api_key} className='error' /> : null}
                                    </div>
                                </div>
                                <div className='mb-5'>
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

AddVendorModal.propTypes = {}
AddVendorModal.defaultProps = {}

export default AddVendorModal
