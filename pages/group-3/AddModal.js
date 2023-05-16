import { Formik } from 'formik'
import React, { useState } from 'react'
import * as Yup from 'yup'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import FormHelperMessage from '../../components/common/form-elements/formHelperMessage'
import string from '../../utils/LanguageTranslation'
// updated
import Input from '../../components/common/form-elements/input/Input'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'

const AddGroupschema = Yup.object().shape({
    groupID: Yup.string()
        .trim()
        .required(`${string.group3Id} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.group3Id} ${string.errors.invalid}`),
})

function AddModal({ isOpen, toggle, state, onGroupSubmit, groupExists }) {
    const [submitBtnDisable, setSubmitBtnDisable] = useState(false)
    let groupExist = groupExists

    const onSubmit = async (value) => {
        const values = value
        try {
            setSubmitBtnDisable(true)
            const groupSubmitted = await onGroupSubmit(Object.assign({}, { groupID: values.groupID.trim() }))
            $('#groupModal').modal('hide')
            if (groupSubmitted) {
                values.groupID = ''
                toggle()
            }
            setSubmitBtnDisable(false)
        } catch (err) {
            setSubmitBtnDisable(false)
        }
    }
    if (typeof window === 'undefined') {
        return null
    }
    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal'>
            <ModalHeader toggle={toggle}>
                <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {string.project.addGroup3}
                </h5>
            </ModalHeader>
            <ModalBody className='text-center mb-5'>
                <Formik
                    initialValues={{
                        groupID: '',
                    }}
                    validationSchema={AddGroupschema}
                    onSubmit={onSubmit}
                >
                    {({ errors, touched, handleChange, handleSubmit, values }) => (
                        <form className='form-container' onSubmit={handleSubmit}>
                            <div className='row ml-0 mr-0 content-block'>
                                <div className='form-group col-md-12 p-0'>
                                    <label htmlFor='groupID' className='col-md-12 col-form-label pl-0'>
                                        <input type='hidden' />
                                        {string.group3Id}
                                    </label>
                                    <Input
                                        type='text'
                                        name='groupID'
                                        id='groupID'
                                        className='form-control'
                                        placeholder={string.group3Id}
                                        value={values.groupID}
                                        onChange={(ev) => {
                                            groupExist = false
                                            setSubmitBtnDisable(false)
                                            handleChange(ev)
                                        }}
                                    />
                                    {(() => {
                                        if (errors.groupID && touched.groupID) {
                                            groupExist = false
                                            return <FormHelperMessage message={errors.groupID} className='error' />
                                        }
                                        if (groupExist) {
                                            return <FormHelperMessage message={string.project.alreadyExistsGroup3} className='error' />
                                        }
                                        return false
                                    })()}
                                </div>
                            </div>
                            <div className='modal-footer'>
                                <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={submitBtnDisable} text={string.insertBtnTxt} />
                            </div>
                        </form>
                    )}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

AddModal.propTypes = {}

AddModal.defaultProps = {}

export default AddModal
