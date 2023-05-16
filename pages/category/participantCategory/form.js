import { Formik } from 'formik'
import * as Yup from 'yup'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import Input from '../../../components/common/form-elements/input/Input'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'
import string from '../../../utils/LanguageTranslation.js'
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'

/**
 * ADD/UPDATE PARTICIPANT CATEGORY MODAL
 */
const Form = ({ isLoading, participantCategoryModal, _toggleParticipantCategory, updateCategory, addCategory, editMode, participantcategory }) => {
    const AddParticipantCategoryschema = Yup.object().shape({
        name: Yup.string()
            .trim()
            .required(`${string.categoryName} ${string.errors.required}`)
            .matches(/^(?!.*["'`\\])/, `${string.categoryName} ${string.errors.invalid}`),
    })

    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <Modal className='customModal document' isOpen={participantCategoryModal} toggle={_toggleParticipantCategory}>
                <ModalHeader toggle={_toggleParticipantCategory} cssModule={{ 'modal-title': 'modal-title text-dark font-weight-bold' }}>
                    {editMode === 'participant_category' ? `${string.project.edit}` : `${string.project.add}`} {string.participant.categoryTxt}
                </ModalHeader>
                <ModalBody>
                    <Formik
                        initialValues={{
                            name: participantcategory.name || '',
                        }}
                        validationSchema={AddParticipantCategoryschema}
                        onSubmit={(values) => {
                            let participant_category = { name: values.name }
                            if (editMode === 'participantCategory') {
                                updateCategory(participant_category)
                            } else {
                                addCategory(participant_category)
                                values.name = ''
                            }
                            $('.customModal').modal('hide')
                        }}
                    >
                        {({ errors, touched, handleChange, handleSubmit, values }) => (
                            <form onSubmit={handleSubmit}>
                                <div>
                                    <div className='row ml-0 mr-0 content-block'>
                                        <div className='form-group col-md-12 p-0'>
                                            <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                                {string.categoryName}
                                            </label>
                                            <Input type='text' name='name' id='name' className='form-control' placeholder={string.categoryName} value={values.name} onChange={handleChange} />
                                            {errors.name && touched.name ? <FormHelperMessage message={errors.name} className='error' /> : null}
                                        </div>
                                    </div>
                                </div>
                                <ModalFooter>
                                    <LoaderButton data-dismiss='modal' type='submit' isLoading={isLoading} cssClass='btn btn-primary large-btn' text={editMode === 'participantCategory' ? `${string.updateBtnTxt}` : `${string.insertBtnTxt}`} />
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
