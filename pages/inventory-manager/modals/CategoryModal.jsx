import React from 'react'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'

import { TextField } from '../../../components/inventory-manager'
import string from '../../../utils/LanguageTranslation'
import { createCategory, updateCategory } from '../../../lib/api/assets-categories'

const CategoryModal = (props) => {
    const { toggle, isOpen, mode, CATEGORIES, editIndex, initialApi, isEditMode } = props
    const formik = useFormik({
        initialValues: {
            name: editIndex || editIndex == 0 ? CATEGORIES.list[editIndex].name : '',
            local_name: editIndex || editIndex == 0 ? CATEGORIES.list[editIndex].local_name : '',
            id: editIndex || editIndex == 0 ? CATEGORIES.list[editIndex].id : null,
        },
        validationSchema: Yup.object({
            name: Yup.string()
                .required(`${string.inventory.categoryNameReq} ${string.errors.required}`)
                .matches(/^(?!.*["'`\\])/, `${string.inventory.categoryNameReq} ${string.errors.invalid}`),
            local_name: Yup.string()
                .required(`${string.inventory.categoryLocalNameReq} ${string.errors.required}`)
                .matches(/^[\u0400-\u04FF -]*[\u0400-\u04FF][\u0400-\u04FF -]+$/, `${string.inventory.categoryLocalNameReq} ${string.onboarding.validations.onlyCyrillicAlphabet}`),
        }),
        onSubmit: async (values) => {
            isEditMode ? await updateCategory(values) : await createCategory(values)
            initialApi()
            toggle()
        },
    })

    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal document'>
            <ModalHeader toggle={toggle}>
                <span className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {mode === 'edit' ? string.inventory.editCategory : string.inventory.createCategory}
                </span>
            </ModalHeader>
            <ModalBody>
                <form onSubmit={formik.handleSubmit}>
                    <div className='row ml-0 mr-0 content-block'>
                        <div className='form-group col-md-12 p-0'>
                            <TextField name='name' label={`${string.inventory.categorysName} (${string.local_language})`} value={formik.values?.name} onChange={formik.handleChange} error={formik.errors?.name} />
                            <TextField name='local_name' label={`${string.inventory.categorysName} (${string.mong_language})`} value={formik.values?.local_name} onChange={formik.handleChange} error={formik.errors?.local_name} />
                        </div>
                    </div>
                    <div className='text-field-wrap d-flex justify-content-between mb-3 text-center'>
                        <button className='btn btn-primary large-btn' type='submit' style={{ margin: 'auto' }}>
                            {string.save}
                        </button>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    )
}

export default CategoryModal
