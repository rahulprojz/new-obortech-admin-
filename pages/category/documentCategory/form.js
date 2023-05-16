import { Formik } from 'formik'
import * as Yup from 'yup'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import string from '../../../utils/LanguageTranslation.js'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'

const AddCategoryschema = Yup.object().shape({
    name: Yup.string()
        .trim()
        .required(`${string.categoryNameRequired}`)
        .matches(/^(?!.*["'`\\])/, `${string.categoryNameRequired} ${string.errors.invalid}`),
})

const Form = ({ isLoading, onCategorySubmit, isOpen, toggle, values, editMode, string }) => {
    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <Modal isOpen={isOpen} toggle={toggle} className='customModal document'>
                <ModalHeader toggle={toggle}>
                    <span className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                        {editMode === 'documentCategory' ? string.updateDocCatTxt : string.addDocCatTxt}
                    </span>
                </ModalHeader>
                <ModalBody>
                    <Formik
                        enableReinitialize={true}
                        initialValues={{
                            name: values.name,
                        }}
                        validationSchema={AddCategoryschema}
                        onSubmit={(val) => {
                            values.name = val.name
                            onCategorySubmit()
                        }}
                    >
                        {({ errors, touched, handleChange, handleSubmit, values }) => (
                            <form onSubmit={handleSubmit}>
                                <div className='row ml-0 mr-0 content-block'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.categoryName}
                                        </label>
                                        <input type='text' name='name' id='name' className='form-control' placeholder={string.categoryName} onChange={handleChange} value={values.name} />
                                        {errors.name && touched.name ? <FormHelperMessage message={errors.name} className='error' /> : null}
                                    </div>
                                </div>
                                <ModalFooter>
                                    <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={isLoading} text={editMode === 'documentCategory' ? string.updateBtnTxt : string.insertBtnTxt} />
                                </ModalFooter>
                            </form>
                        )}
                    </Formik>
                </ModalBody>
            </Modal>
        )
    }
}

Form.propTypes = {}
Form.defaultProps = {}

export default Form
