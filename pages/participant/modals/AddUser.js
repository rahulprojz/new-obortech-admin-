import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import { Formik } from 'formik'
import * as Yup from 'yup'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import Input from '../../../components/common/form-elements/input/Input'
import CustomSelect from '../../../components/common/form-elements/select/CustomSelect'
import string from '../../../utils/LanguageTranslation.js'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'

const AddParticipantschema = Yup.object().shape({
    organization_id: Yup.string().required(`${string.participant.pleaseSelectOrg}`),
    role_id: Yup.string(),
    title_id: Yup.string(),
    username: Yup.string()
        .trim()
        .required(`${string.userNameReqNot}`)
        .matches(/^(?!.*["'`\\])/, `${string.userNameReqNot} ${string.errors.invalid}`),

    mobile: Yup.string()
        .trim()
        .matches(/^(?!.*["'`\\])/, `${string.participant.mobile} ${string.errors.invalid}`),

    email: Yup.string()
        .trim()
        .email(`${string.login.email} ${string.errors.email}`)
        .required(`${string.login.email} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.login.email} ${string.errors.invalid}`),

    password: Yup.string()
        .trim()
        .required(`${string.passReqNot}`)
        .matches(/^(?!.*["'`\\])/, `${string.onboarding.passWord} ${string.errors.invalid}`),
})

const AddUser = ({ isLoading, user_titles, user_roles, organization, organizations, participant, openParticipant, editMode, togglePrticipantModal, setState, onParticipantSubmit }) => {
    return (
        <Modal className='customModal document' isOpen={openParticipant && !editMode} toggle={togglePrticipantModal}>
            <ModalHeader toggle={togglePrticipantModal}>
                <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {`${string.project.add} ${string.participant.participantTxt}`}
                </h5>
            </ModalHeader>
            <ModalBody>
                <Formik
                    initialValues={{
                        organization_id: '',
                        role_id: '',
                        title_id: '',
                        username: '',
                        mobile: '',
                        email: '',
                        password: '',
                    }}
                    validationSchema={AddParticipantschema}
                    onSubmit={(values) => {
                        setState({
                            participant: Object.assign({}, participant, {
                                organization_id: values.organization_id,
                                role_id: values.role_id,
                                title_id: values.title_id,
                                username: values.username,
                                mobile: values.mobile,
                                email: values.email,
                                password: values.password,
                            }),
                        })
                        onParticipantSubmit()
                        values.organization_id = ''
                        values.username = ''
                        values.role_id = ''
                        values.title_id = ''
                        values.mobile = ''
                        values.email = ''
                        values.password = ''
                    }}
                >
                    {({ errors, touched, handleChange, handleSubmit, values }) => {
                        return (
                            <form className='form-container' onSubmit={handleSubmit}>
                                <div className='row ml-0 mr-0 content-block'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.organization.selectOrganization}</label>
                                        <CustomSelect className='form-control' name='organization_id' value={values.organization_id} onChange={handleChange} options={organizations} defaultOptionText={string.organization.selectOrganization} />
                                        {errors.organization_id && touched.organization_id ? <FormHelperMessage message={errors.organization_id} className='error' /> : null}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.participant.userName}
                                        </label>
                                        <Input type='text' name='username' id='username' className={'form-control'} value={values.username} onChange={handleChange} placeholder={string.participant.userName} />
                                        {(() => {
                                            if (errors.username && touched.username) {
                                                return <FormHelperMessage message={errors.username} className='error' />
                                            }
                                        })()}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.participant.email}
                                        </label>
                                        <Input type='text' name='email' id='email' className={'form-control'} value={values.email} onChange={handleChange} placeholder={string.participant.email} />
                                        {(() => {
                                            if (errors.email && touched.email) {
                                                return <FormHelperMessage message={errors.email} className='error' />
                                            }
                                        })()}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.onboarding.passWord}
                                        </label>
                                        <Input type='password' name='password' id='password' className={'form-control'} value={values.password} onChange={handleChange} placeholder={string.onboarding.passWord} />
                                        {(() => {
                                            if (errors.password && touched.password) {
                                                return <FormHelperMessage message={errors.password} className='error' />
                                            }
                                        })()}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.participant.mobile}
                                        </label>
                                        <Input type='text' name='mobile' id='mobile' className={editMode && organization.isApproved ? 'form-control org-name-disabled' : 'form-control'} value={values.mobile} onChange={handleChange} placeholder={string.participant.mobile} />
                                        {(() => {
                                            if (errors.mobile && touched.mobile) {
                                                return <FormHelperMessage message={errors.mobile} className='error' />
                                            }
                                        })()}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.onboarding.selectRole}</label>
                                        <CustomSelect className='form-control' name='role_id' value={values.role_id} onChange={handleChange} options={user_roles} defaultOptionText={string.onboarding.selectRole} />
                                        {errors.role_id && touched.role_id ? <FormHelperMessage message={errors.role_id} className='error' /> : null}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.onboarding.selectUserTitle}</label>
                                        <CustomSelect className='form-control' name='title_id' value={values.title_id} onChange={handleChange} options={user_titles} defaultOptionText={string.onboarding.selectUserTitle} />
                                        {errors.title_id && touched.title_id ? <FormHelperMessage message={errors.title_id} className='error' /> : null}
                                    </div>
                                </div>
                                <ModalFooter>
                                    <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={isLoading} text={string.insertBtnTxt} />
                                </ModalFooter>
                            </form>
                        )
                    }}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

export default AddUser
