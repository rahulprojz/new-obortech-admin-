/* eslint-disable no-param-reassign */
/* global $ */

import React, { useState } from 'react'
import { Formik } from 'formik'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import * as Yup from 'yup'
import ShortUniqueId from 'short-unique-id'
import FormHelperMessage from '../../components/common/form-elements/formHelperMessage'
import string from '../../utils/LanguageTranslation'
import Button from '../../components/common/form-elements/button/Button'
import Input from '../../components/common/form-elements/input/Input'
import notify from '../../lib/notifier'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'

const randomCode = new ShortUniqueId({ length: 30 })

const EditItemschema = Yup.object().shape({
    itemID: Yup.string()
        .trim()
        .required(`${string.project.typeItemId} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.project.typeItemId} ${string.errors.invalid}`),

    manualCode: Yup.string()
        .trim()
        .matches(/^[a-z0-9]+$/i, string.onlyAlphanumric),
})

function EditModal({ isLoading, isOpen, item, toggle, state, updateItem, itemExists }) {
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
                    {string.item.itemedit}
                </h5>
            </ModalHeader>
            <ModalBody className='text-center'>
                <Formik
                    enableReinitialize
                    initialValues={{
                        itemID: item.itemID || '',
                        manualCode: item.manual_code || '',
                    }}
                    validationSchema={EditItemschema}
                    onSubmit={async (values) => {
                        state({
                            item: Object.assign({}, item, { itemID: values.itemID.trim(), manual_code: values.manualCode || '' }),
                        })
                        const itemUpdated = await updateItem()
                        if (itemUpdated) {
                            toggle()
                        }
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
                                <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={submitBtnDisable} text={string.insertBtnTxt} />
                            </div>
                        </form>
                    )}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

EditModal.propTypes = {}
EditModal.defaultProps = {}

export default EditModal
