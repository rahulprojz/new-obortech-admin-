import React, { useState } from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import FormHelperMessage from '../../components/common/form-elements/formHelperMessage'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import string from '../../utils/LanguageTranslation.js'
import notify from '../../lib/notifier'
// updated
import Button from '../../components/common/form-elements/button/Button'
import Input from '../../components/common/form-elements/input/Input'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'

const EditContainerschema = Yup.object().shape({
    containerID: Yup.string()
        .trim()
        .required(`${string.container.group1ID} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.container.group1ID} ${string.errors.invalid}`),
    manualCode: Yup.string()
        .trim()
        .matches(/^[a-z0-9]+$/i, string.onlyAlphanumric),
})

function EditModal({ isLoading, container, state, updateContainer, containerExists, isOpen, toggle }) {
    if (typeof window === 'undefined') {
        return null
    } else {
        const [submitBtnDisable, setSubmitBtnDisable] = useState(false)

        const handleQrTextCopy = (valuesQrCode) => {
            if (valuesQrCode) {
                navigator.clipboard.writeText(valuesQrCode)
                notify(`${string.event.documentHashCopied} ${valuesQrCode}`)
            }
        }

        const onSubmit = async (values) => {
            try {
                setSubmitBtnDisable(true)
                state({
                    container: Object.assign({}, container, {
                        containerID: values.containerID.trim(),
                        manual_code: values.manualCode,
                    }),
                })
                const containerUpdated = await updateContainer()
                if (containerUpdated) {
                    values.containerID = ''
                    values.manual_code = ''
                    toggle()
                }
                setSubmitBtnDisable(false)
            } catch (err) {
                setSubmitBtnDisable(false)
            }
        }

        return (
            <Modal isOpen={isOpen} toggle={toggle} className='customModal'>
                <ModalHeader toggle={toggle}>
                    <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                        {string.container.editGroup1}
                    </h5>
                </ModalHeader>
                <ModalBody className='text-center'>
                    <Formik
                        initialValues={{
                            containerID: container.containerID || '',
                            manualCode: container.manual_code || '',
                        }}
                        validationSchema={EditContainerschema}
                        onSubmit={onSubmit}
                    >
                        {({ errors, touched, handleChange, handleSubmit, values }) => (
                            <form className='form-container' onSubmit={handleSubmit}>
                                <div className='row ml-0 mr-0 content-block'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='containerID' className='col-md-12 col-form-label pl-0'>
                                            <input type='hidden' />
                                            {string.container.group1ID}
                                        </label>
                                        <Input
                                            type='text'
                                            name='containerID'
                                            id='containerID'
                                            className='form-control'
                                            placeholder={string.container.group1ID}
                                            value={values.containerID}
                                            onChange={(ev) => {
                                                // eslint-disable-next-line no-param-reassign
                                                containerExists = false
                                                setSubmitBtnDisable(false)
                                                handleChange(ev)
                                            }}
                                        />
                                        {(() => {
                                            if (errors.containerID && touched.containerID) {
                                                // eslint-disable-next-line no-param-reassign
                                                containerExists = false
                                                return <FormHelperMessage message={errors.containerID} className='error' />
                                            }
                                            if (containerExists) {
                                                return <FormHelperMessage message={string.project.alreadyExistsGroup1} className='error' />
                                            }
                                            return false
                                        })()}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <div className='row'>
                                            <label htmlFor='manualCode' className='col-md-9 col-form-label pl-0'>
                                                <input type='hidden' />
                                                {string.event.manualCode}
                                            </label>
                                            <span style={{ color: 'grey', cursor: 'pointer' }} onClick={() => handleQrTextCopy(values.manualCode)} className='form-label text-grey col-sm-3' aria-hidden='true'>
                                                {string.event.copy} <i className='far fa-clone' />
                                            </span>
                                        </div>
                                        <div className='row'>
                                            <div className='col-md-12 pl-0 pr-0'>
                                                <Input type='text' name='manualCode' id='manualCode' className='form-control' placeholder={string.event.manualCode} value={values.manualCode} onChange={handleChange} />
                                                {(() => {
                                                    if (errors.manualCode && touched.manualCode) {
                                                        return <FormHelperMessage message={errors.manualCode} className='error float-left' />
                                                    }
                                                    return false
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className='modal-footer'>
                                    <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={submitBtnDisable} text={string.updateBtnTxt} />
                                </div>
                            </form>
                        )}
                    </Formik>
                </ModalBody>
            </Modal>
        )
    }
}

EditModal.propTypes = {}

EditModal.defaultProps = {}

export default EditModal
