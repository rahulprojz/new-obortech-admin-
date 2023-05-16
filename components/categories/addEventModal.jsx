import { Formik } from 'formik'
import * as Yup from 'yup'
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import FormHelperMessage from '../common/form-elements/formHelperMessage'
import string from '../../utils/LanguageTranslation.js'
import AdvanceSelect from '../common/form-elements/select/AdvanceSelect'
import { otherLanguage } from '../../utils/selectedLanguage.js'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import { checkEventNameValid } from '../../lib/api/event'

const AddEventSchema = Yup.object().shape({
    name: Yup.string()
        .trim()
        .required(`${string.eventNameTxt} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.eventNameTxt} ${string.errors.invalid}`),
    deadlineDays: Yup.number()
        .required(`${string.emailmessages.acceptancedate} ${string.errors.required}`)
        .test('deadlineDays', `${string.acceptancedeadlinereq}`, (value) => value > 0),
})

const AddEventModal = ({ onEventSubmit, isOpen, toggle, values, editMode, setEventformId, selectedValue, formmodallist, isLoading }) => {
    const handledeadlinechange = (setFieldValue, val) => {
        const number = val.target.value.replace(/^0+/, '')
        setFieldValue('deadlineHours', number)
    }

    const AddEventSchema = Yup.object().shape({
        name: Yup.string()
            .trim()
            .required(`${string.eventNameTxt} ${string.errors.required}`)
            .matches(/^(?!.*["'`\\])/, `${string.eventTypeTXt} ${string.errors.invalid}`)
            .test('test-user-unique', `${string.eventNameExist}`, async function validateValue(value) {
                try {
                    let valid
                    if (editMode) {
                        valid = value == values.eventName
                        if (!valid) {
                            const { isvalid } = await checkEventNameValid({ eventName: value ?? '', type: 'event' })
                            valid = isvalid
                        }
                    } else {
                        const { isvalid } = value ? await checkEventNameValid({ eventName: value ?? '', type: 'event' }) : true
                        valid = isvalid
                    }
                    return valid // or true as you see fit
                } catch (error) {}
            }),
        deadlineHours: Yup.number()
            .required(`${string.emailmessages.acceptancedate} ${string.errors.required}`)
            .test('deadlineHours', `${string.acceptancedeadlinereq}`, (value) => value > 0),
    })

    return typeof window === 'undefined' ? null : (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal document'>
            <ModalHeader toggle={toggle}>
                <span className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {editMode === 'event' || editMode === 'd_event' ? string.updateEvntTxt : string.addEvntTxt}
                </span>
            </ModalHeader>
            <ModalBody>
                <Formik
                    // enableReinitialize
                    initialValues={{
                        name: values.eventName,
                        deadlineHours: values.deadline_hours ? parseInt(values.deadline_hours) : parseInt(168),
                        form_id: values.form_id ? values.form_id : '',
                        mongolianName: values.mongolianName,
                    }}
                    validationSchema={AddEventSchema}
                    validateOnChange={false}
                    validateOnBlur
                    onSubmit={(val) => {
                        values.name = val.name
                        values.deadline_hours = val.deadlineHours ? parseInt(val.deadlineHours) : null
                        values.form_id = val.form_id
                        values.mongolianName = val.mongolianName
                        onEventSubmit(values)
                    }}
                >
                    {({ errors, touched, handleChange, handleSubmit, values, setFieldValue }) => (
                        <form onSubmit={handleSubmit}>
                            <div className='row ml-0 mr-0 content-block'>
                                <div className='form-group col-md-12 p-0'>
                                    <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                        {string.eventNameTxtWithEngName}
                                    </label>
                                    <input type='text' name='name' id='name' className='form-control' placeholder={string.eventNameTxtWithEngName} onChange={handleChange} value={values.name} />
                                    {errors.name && touched.name ? <FormHelperMessage message={errors.name} className='error' /> : null}
                                </div>
                                {otherLanguage && (
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.eventNameTxtWithLangName}
                                        </label>
                                        <input type='text' name='mongolianName' id='mongolianName' className='form-control' placeholder={string.eventNameTxtWithLangName} onChange={handleChange} value={values.mongolianName} />
                                    </div>
                                )}
                                <div className='form-group col-md-12 p-0'>
                                    <label className='col-md-12 col-form-label pl-0'>{string.formBuilder.selectForm}</label>
                                    <AdvanceSelect
                                        value={selectedValue}
                                        isSearchable
                                        className='basic-single'
                                        name='form_id'
                                        options={formmodallist}
                                        onChange={(event) => {
                                            setFieldValue('form_id', event?.value || '')
                                            setEventformId(event || { value: 0 })
                                        }}
                                        placeholder={string.formBuilder.selectForm}
                                        isClearable
                                    />
                                </div>
                                <div className='form-group col-md-12 p-0'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.emailmessages.acceptancedate}
                                        </label>
                                        <input type='number' name='deadlineHours' id='deadlineHours' className='form-control' placeholder={string.emailmessages.acceptancedate} onChange={(val) => handledeadlinechange(setFieldValue, val)} value={values.deadlineHours} />
                                        {errors.deadlineHours && touched.deadlineHours ? <FormHelperMessage message={errors.deadlineHours} className='error' /> : null}
                                    </div>
                                </div>
                            </div>
                            <ModalFooter>
                                <LoaderButton type='submit' isLoading={isLoading} cssClass='btn btn-primary large-btn' text={editMode === 'event' || editMode === 'd_event' ? string.updateBtnTxt : string.insertBtnTxt} />
                            </ModalFooter>
                        </form>
                    )}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

AddEventModal.propTypes = {}
AddEventModal.defaultProps = {}

export default AddEventModal
