import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import FormHelperMessage from '../../components/common/form-elements/formHelperMessage'
import string from '../../utils/LanguageTranslation'
// updated
import Button from '../../components/common/form-elements/button/Button'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'
import Input from '../../components/common/form-elements/input/Input'

function EditModal({ isLoading, group, state, updateGroup, groupExists, setGroupData, isOpen, toggle }) {
    // Formik Validations and initialization
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            groupID: group.groupID,
        },
        validationSchema: Yup.object({
            groupID: Yup.string()
                .trim()
                .required(`${string.group3Id} ${string.errors.required}`)
                .matches(/^(?!.*["'`\\])/, `${string.group3Id} ${string.errors.invalid}`),
        }),
        onSubmit: async (values) => {
            setGroupData(values.groupID)
            const groupUpdated = await updateGroup(Object.assign({}, group, { groupID: values.groupID }))
            if (groupUpdated) {
                toggle()
            }
        },
    })

    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <Modal isOpen={isOpen} toggle={toggle} className='customModal'>
                <ModalHeader toggle={toggle}>
                    <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                        {string.editGroup3}
                    </h5>
                </ModalHeader>
                <ModalBody className='text-center mb-5'>
                    <form className='form-container' onSubmit={formik.handleSubmit}>
                        <div className='row ml-0 mr-0 content-block'>
                            <div className='form-group col-md-12 p-0'>
                                <label htmlFor='groupID' className='col-md-12 col-form-label pl-0'>
                                    {string.group3Id}
                                </label>
                                <Input type='text' name='groupID' id='groupID' value={formik.values.groupID} onChange={formik.handleChange} className='form-control' placeholder={string.group3Id} />
                                {(() => {
                                    if (formik.errors.groupID && formik.touched.groupID) {
                                        groupExists = false
                                        return <FormHelperMessage message={formik.errors.groupID} className='error' />
                                    } else if (groupExists) {
                                        return <FormHelperMessage message={string.project.alreadyExistsGroup3} className='error' />
                                    }
                                })()}
                            </div>
                        </div>
                        <div className='modal-footer'>
                            <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={isLoading} text={string.updateBtnTxt} />
                        </div>
                    </form>
                </ModalBody>
            </Modal>
        )
    }
}

EditModal.propTypes = {}

EditModal.defaultProps = {}

export default EditModal
