import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import { Formik } from 'formik'
import * as Yup from 'yup'
import string from '../../../utils/LanguageTranslation'
import Input from '../../../components/common/form-elements/input/Input'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import { otherLanguage } from '../../../utils/selectedLanguage.js'
import notify from '../../../lib/notifier'

const LabelEditSchema = Yup.object().shape({
    label: Yup.string()
        .trim()
        .required(`${string.enterLabelName}`)
        .matches(/^(?!.*["'`\\])/, `${string.enterLabelName} ${string.errors.invalid}`),
})

const LabelEditModal = ({ toggle, isOpen, setCustomLabel, labels, field }) => {
    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal document'>
            <ModalHeader toggle={toggle}>
                <span className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {string.updateLabelName}
                </span>
            </ModalHeader>
            <ModalBody>
                <Formik
                    initialValues={{
                        label: labels[field],
                        mongoLabel: labels[`local_${field}`],
                    }}
                    validationSchema={LabelEditSchema}
                    onSubmit={(val) => {
                        labels[field] = val.label
                        if (otherLanguage) {
                            labels[`local_${field}`] = val.mongoLabel
                        }
                        notify(string.labelUpdateSuccess)
                        setCustomLabel(labels)
                        toggle()
                    }}
                >
                    {({ errors, touched, handleChange, handleSubmit, values }) => {
                        return (
                            <form onSubmit={handleSubmit}>
                                <div className='row ml-0 mr-0 content-block'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.labelNameTxtWithEngName}
                                        </label>
                                        <Input type='text' name='label' id='label' className={errors.label ? 'form-control is-invalid' : 'form-control'} value={values.label} onChange={handleChange} placeholder={string.labelNameTxtWithEngName} />
                                        {errors.label ? <FormHelperMessage message={errors.label} className='error' /> : null}
                                        {otherLanguage && (
                                            <>
                                                <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                                    {string.labelNameTxtWithLangName}
                                                </label>
                                                <Input type='text' name='mongoLabel' id='mongoLabel' className='form-control' value={values.mongoLabel} onChange={handleChange} placeholder={string.labelNameTxtWithLangName} />
                                            </>
                                        )}
                                    </div>
                                </div>
                                <ModalFooter>
                                    <button className='btn btn-primary large-btn' type='submit'>
                                        {string.updateBtnTxt}
                                    </button>
                                </ModalFooter>
                            </form>
                        )
                    }}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

export default LabelEditModal
