/* eslint-disable no-shadow */
import { Formik, Field } from 'formik'
import * as Yup from 'yup'
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import string from '../../../utils/LanguageTranslation'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'

const AddUserTypeschema = Yup.object().shape({
    name: Yup.string()
        .trim()
        .required(`${string.userTypeTitle.userTypes} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.userTypeTitle.userTypes} ${string.errors.invalid}`),
    documentType: Yup.array().min(1),
})

// eslint-disable-next-line no-shadow
const AddUserTypeModal = ({ isLoading, onUserTypeSubmit, isOpen, toggle, values, editMode, string, types, typeAlreadyExists, selectedTypes }) => {
    if (typeof window === 'undefined') {
        return null
    }
    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal document'>
            <ModalHeader toggle={toggle}>
                <span className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {editMode === 'editType' ? string.userTypeTitle.updateOrgType : string.userTypeTitle.addOrgType}
                </span>
            </ModalHeader>
            <ModalBody>
                <Formik
                    enableReinitialize
                    initialValues={{
                        name: values.name,
                        documentType: selectedTypes,
                    }}
                    validationSchema={AddUserTypeschema}
                    onSubmit={(val) => {
                        onUserTypeSubmit(val.name.trim(), val.documentType || [])
                    }}
                >
                    {({ errors, touched, handleChange, handleSubmit, values }) => (
                        <form onSubmit={handleSubmit}>
                            <div className='row ml-0 mr-0 content-block'>
                                <div className='form-group col-md-12 p-0'>
                                    <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                        {string.userTypeTitle.typeName}
                                        <input type='text' name='name' id='name' className='form-control' placeholder={string.userTypeTitle.typeName} onChange={handleChange} value={values.name} />
                                    </label>
                                    {(() => {
                                        if (errors.name && touched.name) {
                                            // eslint-disable-next-line no-param-reassign
                                            typeAlreadyExists = false
                                            return <FormHelperMessage message={errors.name} className='error' />
                                        }
                                        if (typeAlreadyExists) {
                                            return <FormHelperMessage message={string.userTypeTitle.typeAlreadyExists} className='error' />
                                        }
                                        return false
                                    })()}
                                </div>
                            </div>
                            <div role='group' aria-labelledby='checkbox-group' className='row'>
                                <label htmlFor='documentType' className='col-md-12 col-form-label pl-0'>
                                    <input type='hidden' />
                                    {string.userTypeTitle.selectDocument}
                                </label>
                                {types.map(({ id, type }) => {
                                    return (
                                        <div key={id} className='d-flex custom-control custom-checkbox small col-md-12 align-items-center' style={{ paddingLeft: 0, textTransform: 'capitalize' }}>
                                            <Field type='checkbox' name='documentType' value={type} />

                                            <span className='ml-2'>{type}</span>
                                        </div>
                                    )
                                })}
                                {(() => {
                                    if (errors.documentType && touched.documentType) {
                                        return <FormHelperMessage message={errors.documentType} className='error' />
                                    }
                                    return false
                                })()}
                            </div>

                            <ModalFooter>
                                <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={isLoading} text={editMode === 'editType' ? string.updateBtnTxt : string.insertBtnTxt} />
                            </ModalFooter>
                        </form>
                    )}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

AddUserTypeModal.propTypes = {}

AddUserTypeModal.defaultProps = {}

export default AddUserTypeModal
