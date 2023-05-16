/* eslint-disable no-shadow */
import { Formik } from 'formik'
import * as Yup from 'yup'
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import string from '../../../utils/LanguageTranslation'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'

const AddDocumentTypeSchema = Yup.object().shape({
    type: Yup.string()
        .trim()
        .required(`${string.documentType.typeName} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.documentType.typeName} ${string.errors.invalid}`),
})

const AddDocumentTypeModal = ({ isLoading, onDocumentTypeSubmit, isOpen, toggle, values, editMode, docTypeAlreadyExists }) => {
    if (typeof window === 'undefined') {
        return null
    }
    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal document'>
            <ModalHeader toggle={toggle}>
                <span className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {editMode === 'documentType' ? string.documentType.updateDocType : string.documentType.addDocType}
                </span>
            </ModalHeader>
            <ModalBody>
                <Formik
                    enableReinitialize
                    initialValues={{
                        type: values.type,
                    }}
                    validationSchema={AddDocumentTypeSchema}
                    onSubmit={(val) => {
                        onDocumentTypeSubmit(val.type.trim())
                    }}
                >
                    {({ errors, touched, handleChange, handleSubmit, values }) => (
                        <form onSubmit={handleSubmit}>
                            <div className='row ml-0 mr-0 content-block'>
                                <div className='form-group col-md-12 p-0'>
                                    <label htmlFor='type' className='col-md-12 col-form-label pl-0'>
                                        {string.documentType.typeName}
                                        <input type='text' name='type' id='type' className='form-control' placeholder={string.documentType.typeName} onChange={handleChange} value={values.type} />
                                    </label>
                                    {(() => {
                                        if (errors.type && touched.type) {
                                            // eslint-disable-next-line no-param-reassign
                                            docTypeAlreadyExists = false
                                            return <FormHelperMessage message={errors.type} className='error' />
                                        }
                                        if (docTypeAlreadyExists) {
                                            return <FormHelperMessage message={string.documentType.docTypeAlreadyExists} className='error' />
                                        }
                                        return false
                                    })()}
                                </div>
                            </div>
                            <ModalFooter>
                                <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={isLoading} text={editMode === 'documentType' ? string.updateBtnTxt : string.insertBtnTxt} />
                            </ModalFooter>
                        </form>
                    )}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

export default AddDocumentTypeModal
