import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import { Formik } from 'formik'
import * as Yup from 'yup'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import Input from '../../../components/common/form-elements/input/Input'
import CustomSelect from '../../../components/common/form-elements/select/CustomSelect'
import string from '../../../utils/LanguageTranslation.js'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'

const EditUser = ({ isLoading, participant, user_titles, user_roles, openParticipant, editMode, togglePrticipantModal, setState, updateUser, onParticipantSubmit }) => {
    const EditParticipantschema = Yup.object().shape({
        role_id: Yup.string().required(`${string.selectRoleNot}`),
        username: Yup.string()
            .trim()
            .required(`${string.userNameReqNot}`)
            .matches(/^(?!.*["'`\\])/, `${string.onboarding.username} ${string.errors.invalid}`),
    })

    const editRolesOption = (selectedRoleId) => {
        return user_roles.filter((roleData) => roleData.id == process.env.ROLE_USER || roleData.id == process.env.ROLE_MANAGER || ((selectedRoleId == process.env.ROLE_MANAGER || selectedRoleId == process.env.ROLE_SENIOR_MANAGER) && roleData.id == process.env.ROLE_SENIOR_MANAGER))
    }

    return (
        <Modal className='customModal document' isOpen={openParticipant && editMode} toggle={togglePrticipantModal}>
            <ModalHeader toggle={togglePrticipantModal}>
                <span className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {editMode === 'participant' ? `${string.participant.editParticipantTxt}` : `${string.participant.addParticipantTxt}`}
                </span>
            </ModalHeader>
            <ModalBody>
                <Formik
                    initialValues={{
                        role_id: editMode ? participant.role_id : '',
                        username: editMode ? participant.username : '',
                    }}
                    validationSchema={EditParticipantschema}
                    onSubmit={(values) => {
                        setState({
                            participant: Object.assign({}, participant, {
                                role_id: values.role_id,
                                username: values.username,
                            }),
                        })
                        if (editMode === 'participant') {
                            updateUser()
                        } else {
                            onParticipantSubmit()
                            values.username = ''
                            values.role_id = ''
                            values.title_id = ''
                            values.email = ''
                            values.password = ''
                            values.repeat_password = ''
                        }
                    }}
                >
                    {({ errors, touched, handleChange, handleSubmit, values }) => {
                        return (
                            <form className='form-container' onSubmit={handleSubmit}>
                                <div className='row ml-0 mr-0 content-block'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='username' className='col-md-12 col-form-label pl-0'>
                                            {string.onboarding.username}
                                        </label>
                                        <Input type='text' name='username' id='username' disabled className='form-control' value={values.username} onChange={handleChange} placeholder={string.onboarding.username} />
                                        {errors.username && touched.username ? <FormHelperMessage message={errors.username} className='error' /> : null}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.onboarding.selectRole}</label>
                                        <CustomSelect className='form-control' name='role_id' value={values.role_id} onChange={handleChange} options={editRolesOption(values.role_id)} defaultOptionText={string.onboarding.selectRole} />
                                        {errors.role_id && touched.role_id ? <FormHelperMessage message={errors.role_id} className='error' /> : null}
                                    </div>
                                </div>
                                <ModalFooter>
                                    <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={isLoading} text={editMode === 'participant' ? `${string.updateBtnTxt}` : `${string.insertBtnTxt}`} />
                                </ModalFooter>
                            </form>
                        )
                    }}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

export default EditUser
