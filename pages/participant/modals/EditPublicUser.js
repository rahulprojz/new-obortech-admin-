import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import { Formik } from 'formik'
import * as Yup from 'yup'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import Input from '../../../components/common/form-elements/input/Input'
import CustomSelect from '../../../components/common/form-elements/select/CustomSelect'
import string from '../../../utils/LanguageTranslation.js'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'

const EditPublicUser = ({ isLoading, participant, user_titles, openParticipant, editMode, togglePrticipantModal, setState, updateUser }) => {
    const EditParticipantschema = Yup.object().shape({
        title_id: Yup.string().required(`${string.selectTitleNot}`),
        username: Yup.string()
            .trim()
            .required(`${string.userNameReqNot}`)
            .matches(/^(?!.*["'`\\])/, `${string.onboarding.username} ${string.errors.invalid}`),

        password:
            editMode === 'participant'
                ? Yup.string().matches(/^(?!.*["'`\\])/, `${string.onboarding.passWord} ${string.errors.invalid}`)
                : Yup.string()
                      .trim()
                      .required(`${string.passReqNot}`)
                      .matches(/^(?!.*["'`\\])/, `${string.onboarding.passWord} ${string.errors.invalid}`),

        repeat_password:
            editMode === 'participant'
                ? Yup.string()
                      .when('password', {
                          is: (val) => (val && val.length > 0 ? true : false),
                          then: Yup.string().oneOf([Yup.ref('password')], `${string.participant.bothPassordNeedToSame}`),
                      })
                      .matches(/^(?!.*["'`\\])/, `${string.onboarding.passWord} ${string.errors.invalid}`)
                : Yup.string()
                      .when('password', {
                          is: (val) => (val && val.length > 0 ? true : false),
                          then: Yup.string().oneOf([Yup.ref('password')], `${string.participant.bothPassordNeedToSame}`),
                      })
                      .required(`${string.repeatPassReqNot}`)
                      .matches(/^(?!.*["'`\\])/, `${string.onboarding.passWord} ${string.errors.invalid}`),

        username: Yup.string()
            .trim()
            .required(`${string.officialNameReqNot}`)
            .matches(/^(?!.*["'`\\])/, `${string.onboarding.username} ${string.errors.invalid}`),
    })

    return (
        <Modal className='customModal document' isOpen={openParticipant && editMode} toggle={togglePrticipantModal}>
            <ModalHeader toggle={togglePrticipantModal}>
                <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {string.participant.editUserTxt}
                </h5>
            </ModalHeader>
            <ModalBody>
                <Formik
                    initialValues={{
                        title_id: participant.title_id,
                        username: participant.username,
                        password: '',
                        repeat_password: '',
                    }}
                    validationSchema={EditParticipantschema}
                    onSubmit={(values) => {
                        setState({
                            participant: Object.assign({}, participant, {
                                title_id: values.title_id,
                                username: values.username,
                                password: values.password,
                                repeat_password: values.repeat_password,
                            }),
                        })
                        updateUser()
                    }}
                >
                    {({ errors, touched, handleChange, handleSubmit, values }) => {
                        return (
                            <form className='form-container' onSubmit={handleSubmit}>
                                <div className='row ml-0 mr-0 content-block'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.worker.selectTitle}</label>
                                        <CustomSelect className='form-control' name='title_id' value={values.title_id} onChange={handleChange} options={user_titles} defaultOptionText={string.worker.selectTitle} />
                                        {errors.title_id && touched.title_id ? <FormHelperMessage message={errors.title_id} className='error' /> : null}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='username' className='col-md-12 col-form-label pl-0'>
                                            {string.onboarding.username}
                                        </label>
                                        <Input type='text' name='username' id='username' className='form-control input-disabled' disabled value={values.username} onChange={handleChange} placeholder={string.onboarding.username} />
                                        {errors.username && touched.username ? <FormHelperMessage message={errors.username} className='error' /> : null}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='password' className='col-md-12 col-form-label pl-0'>
                                            {string.onboarding.passWord}
                                        </label>
                                        <Input type='password' name='password' id='password' className='form-control' placeholder={string.onboarding.passWord} value={values.password} onChange={handleChange} />
                                        {errors.password && touched.password ? <FormHelperMessage message={errors.password} className='error' /> : null}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='repeat_password' className='col-md-12 col-form-label pl-0'>
                                            {string.participant.repeatPassword}
                                        </label>
                                        <Input type='password' name='repeat_password' id='repeat_password' className='form-control' placeholder={string.participant.repeatPassword} value={values.repeat_password} onChange={handleChange} />
                                        {errors.repeat_password && touched.repeat_password ? <FormHelperMessage message={errors.repeat_password} className='error' /> : null}
                                    </div>
                                </div>
                                <ModalFooter>
                                    <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={isLoading} text={string.updateBtnTxt} />
                                </ModalFooter>
                            </form>
                        )
                    }}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

export default EditPublicUser
