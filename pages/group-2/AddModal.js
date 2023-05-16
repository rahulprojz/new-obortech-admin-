/* eslint-disable no-undef */
import React, { useState } from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import FormHelperMessage from '../../components/common/form-elements/formHelperMessage'
import string from '../../utils/LanguageTranslation'
// updated
import Input from '../../components/common/form-elements/input/Input'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'

const AddTruckschema = Yup.object().shape({
    truckID: Yup.string()
        .trim()
        .required(`${string.truck.group2Id} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.truck.group2Id} ${string.errors.invalid}`),
})

function AddModal({ isOpen, toggle, state, onTruckSubmit, truckExists }) {
    const [submitBtnDisable, setSubmitBtnDisable] = useState(false)

    const onSubmit = async (values) => {
        try {
            setSubmitBtnDisable(true)
            state({
                truck: Object.assign({}, truck, { truckID: values.truckID.trim() }),
            })
            const truckSubmitted = await onTruckSubmit()
            // $("#truckModal").modal("hide");
            if (truckSubmitted) {
                // eslint-disable-next-line no-param-reassign
                values.truckID = ''
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
                    {string.project.addGroup2}
                </h5>
            </ModalHeader>
            <ModalBody className='text-center mb-5'>
                <Formik
                    initialValues={{
                        truckID: '',
                    }}
                    validationSchema={AddTruckschema}
                    onSubmit={onSubmit}
                >
                    {({ errors, touched, handleChange, handleSubmit, values }) => (
                        <form className='form-container' onSubmit={handleSubmit}>
                            <div className='row ml-0 mr-0 content-block'>
                                <div className='form-group col-md-12 p-0'>
                                    <label htmlFor='truckID' className='col-md-12 col-form-label pl-0'>
                                        <input type='hidden' />
                                        {string.truck.group2Id}
                                    </label>
                                    <Input
                                        type='text'
                                        name='truckID'
                                        id='truckID'
                                        className='form-control'
                                        placeholder={string.truck.group2Id}
                                        value={values.truckID}
                                        onChange={(ev) => {
                                            // eslint-disable-next-line no-param-reassign
                                            truckExists = false
                                            setSubmitBtnDisable(false)
                                            handleChange(ev)
                                        }}
                                    />
                                    {(() => {
                                        if (errors.truckID && touched.truckID) {
                                            // eslint-disable-next-line no-param-reassign
                                            truckExists = false
                                            return <FormHelperMessage message={errors.truckID} className='error' />
                                        }
                                        if (truckExists) {
                                            return <FormHelperMessage message={string.project.alreadyExistsGroup2} className='error' />
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
