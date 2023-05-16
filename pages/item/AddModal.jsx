// /* eslint-disable no-param-reassign */

import { Formik } from 'formik'
import * as Yup from 'yup'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import React, { useState } from 'react'
import ShortUniqueId from 'short-unique-id'
import FormHelperMessage from '../../components/common/form-elements/formHelperMessage'
import string from '../../utils/LanguageTranslation'
import Input from '../../components/common/form-elements/input/Input'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'
import notify from '../../lib/notifier'

const randomCode = new ShortUniqueId({ length: 30 })

const AddItemschema = Yup.object().shape({
    itemID: Yup.string()
        .trim()
        .required(`${string.project.typeItemId} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.item.itemID} ${string.errors.invalid}`),
    manualCode: Yup.string()
        .trim()
        .matches(/^[a-z0-9]+$/i, string.onlyAlphanumric),
})

function AddModal({ isOpen, toggle, state, onItemSubmit, itemExists }) {
    const [submitBtnDisable, setSubmitBtnDisable] = useState(false)

    const handleQrTextCopy = (valuesQrCode) => {
        if (valuesQrCode) {
            navigator.clipboard.writeText(valuesQrCode)
            notify(`${string.event.documentHashCopied} ${valuesQrCode}`)
        }
    }

    if (typeof window === 'undefined') {
        return null
    }
    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal'>
            <ModalHeader toggle={toggle}>
                <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {string.item.itemAdd}
                </h5>
            </ModalHeader>
            <ModalBody className='text-center'>
                <Formik
                    initialValues={{
                        itemID: '',
                        manualCode: '',
                    }}
                    validationSchema={AddItemschema}
                    onSubmit={async (values) => {
                        setSubmitBtnDisable(true)
                        state({
                            item: Object.assign({}, { itemID: values.itemID.trim(), manualCode: values.manualCode }),
                        })
                        const itemSubmitted = await onItemSubmit()
                        if (itemSubmitted) {
                            values.itemID = ''
                            toggle()
                        }
                        setSubmitBtnDisable(false)
                    }}
                >
                    {({ errors, touched, handleChange, handleSubmit, values, setFieldValue }) => (
                        <form className='form-container' onSubmit={handleSubmit}>
                            <div className='row ml-0 mr-0 content-block'>
                                <div className='form-group col-md-12 p-0'>
                                    <label htmlFor='itemID' className='col-md-12 col-form-label pl-0'>
                                        <input type='hidden' />
                                        {string.project.typeItemId}
                                    </label>
                                    <Input
                                        type='text'
                                        name='itemID'
                                        id='itemID'
                                        className='form-control'
                                        placeholder={string.project.typeItemId}
                                        value={values.itemID}
                                        onChange={(ev) => {
                                            itemExists = false
                                            handleChange(ev)
                                        }}
                                    />
                                    {(() => {
                                        if (errors.itemID && touched.itemID) {
                                            itemExists = false
                                            return <FormHelperMessage message={errors.itemID} className='error float-left' />
                                        }
                                        if (itemExists) {
                                            return <FormHelperMessage message={string.project.alreadyExistsItem} className='error float-left' />
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
                                        <div className='col-md-12 pl-0'>
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
