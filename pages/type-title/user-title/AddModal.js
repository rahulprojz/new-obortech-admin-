/* eslint-disable no-shadow */
import { Formik } from 'formik'
import * as Yup from 'yup'
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import string from '../../../utils/LanguageTranslation'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'

const AddUserTitlechema = Yup.object().shape({
    name: Yup.string()
        .trim()
        .required(`${string.userTypeTitle.userTitles} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.userTypeTitle.userTitles} ${string.errors.invalid}`),
})

const AddUserTitleModal = ({ isLoading, onUserTitleSubmit, isOpen, toggle, values, editMode, string, titleAlreadyExists }) => {
    if (typeof window === 'undefined') {
        return null
    }
    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal document'>
            <ModalHeader toggle={toggle}>
                <span className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {editMode === 'editTitle' ? string.userTypeTitle.updateUserTitle : string.userTypeTitle.addUserTitle}
                </span>
            </ModalHeader>
            <ModalBody>
                <Formik
                    enableReinitialize
                    initialValues={{
                        name: values.name,
                    }}
                    validationSchema={AddUserTitlechema}
                    onSubmit={(val) => {
                        onUserTitleSubmit(val.name.trim())
                    }}
                >
                    {({ errors, touched, handleChange, handleSubmit, values }) => (
                        <form onSubmit={handleSubmit}>
                            <div className='row ml-0 mr-0 content-block'>
                                <div className='form-group col-md-12 p-0'>
                                    <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                        {string.userTypeTitle.titleName}
                                        <input type='text' name='name' id='name' className='form-control' placeholder={string.userTypeTitle.titleName} onChange={handleChange} value={values.name} />
                                    </label>
                                    {(() => {
                                        if (errors.name && touched.name) {
                                            // eslint-disable-next-line no-param-reassign
                                            titleAlreadyExists = false
                                            return <FormHelperMessage message={errors.name} className='error' />
                                        }
                                        if (titleAlreadyExists) {
                                            return <FormHelperMessage message={string.userTypeTitle.titleAlreadyExists} className='error' />
                                        }
                                        return false
                                    })()}
                                    {/* {errors.name && touched.name ? (
                                <FormHelperMessage
                                    message={errors.name}
                                    className="error"
                                />
                                ) : null} */}
                                </div>
                            </div>
                            <ModalFooter>
                                <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={isLoading} text={editMode === 'editTitle' ? string.updateBtnTxt : string.insertBtnTxt} />
                            </ModalFooter>
                        </form>
                    )}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

AddUserTitleModal.propTypes = {}

AddUserTitleModal.defaultProps = {}

export default AddUserTitleModal
