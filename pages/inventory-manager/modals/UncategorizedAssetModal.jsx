import React from 'react'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import Select from 'react-select'
import { useFormik } from 'formik'
import * as Yup from 'yup'

import { AssetCode, TextField } from '../../../components/inventory-manager'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import string from '../../../utils/LanguageTranslation'
import { updateAssets } from '../../../lib/api/inventory-assets'

const UncategorizedAssetModal = (props) => {
    const { toggle, isOpen, UNCATEGORIZED_ASSET_CLASSES, CATEGORIES, editIndex, initialApi, categoryList } = props

    const formik = useFormik({
        initialValues: {
            id: UNCATEGORIZED_ASSET_CLASSES.list[editIndex]?.id ?? '',
            name: UNCATEGORIZED_ASSET_CLASSES.list[editIndex]?.name ?? '',
            local_name: UNCATEGORIZED_ASSET_CLASSES.list[editIndex]?.local_name ?? '',
            asset_code: UNCATEGORIZED_ASSET_CLASSES.list[editIndex]?.asset_code ?? '',
            asset_category_id: UNCATEGORIZED_ASSET_CLASSES.list[editIndex]?.asset_category_id ?? '',
            subinfo: UNCATEGORIZED_ASSET_CLASSES.list[editIndex]?.subinfo ?? '',
        },
        validationSchema: Yup.object({
            name: Yup.string().required(`${string.inventory.assetNameReq} ${string.errors.required}`),
            local_name: Yup.string()
                .required(`${string.inventory.assetLocalNameReq} ${string.errors.required}`)
                .matches(/^[\u0400-\u04FF -]*[\u0400-\u04FF][\u0400-\u04FF -]+$/, `${string.inventory.categoryLocalNameReq} ${string.onboarding.validations.onlyCyrillicAlphabet}`),
            asset_category_id: Yup.string().required(`${string.inventory.categoryNameReq} ${string.errors.required}`),
        }),
        onSubmit: async (values) => {
            await updateAssets(values)
            initialApi()
            toggle()
        },
    })

    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal document'>
            <ModalHeader toggle={toggle}>
                <span className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {string.inventory.editassets}
                </span>
            </ModalHeader>
            <ModalBody>
                <form onSubmit={formik.handleSubmit}>
                    <div className='row ml-0 mr-0 content-block'>
                        <div className='form-group col-md-12 p-0'>
                            <TextField name='name' label={`${string.inventory.assetClassName} (${string.local_language})`} value={formik.values?.name} onChange={formik.handleChange} error={formik.errors?.name} />
                            <TextField name='local_name' label={`${string.inventory.assetClassName} (${string.mong_language})`} value={formik.values?.local_name} onChange={formik.handleChange} error={formik.errors?.local_name} />
                            <AssetCode code={formik.values?.asset_code} onChange={formik.handleChange} message={formik.errors?.asset_code} setAssetCode={formik.setFieldValue} isEditMode={true} />
                            <Select
                                value={{label: "Other", value: "Other"}}
                                options={categoryList}
                                className='mt-3'
                                name='asset_category_id'
                                isDisabled={true}
                                onChange={(event) => {
                                    formik.handleChange({ target: { name: 'asset_category_id', value: event } })
                                }}
                            />
                            <FormHelperMessage className='err' message={formik.errors?.asset_category_id} />
                            <TextField name='subinfo' label={`${string.subInfo}`} value={formik.values?.subinfo} onChange={formik.handleChange} error={formik.errors?.subinfo} />
                        </div>
                    </div>
                    <div className='text-field-wrap d-flex justify-content-between mb-3 text-center'>
                        <button className='btn btn-primary large-btn text-center' type='submit' style={{ margin: 'auto' }}>
                            {string.save}
                        </button>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    )
}

export default UncategorizedAssetModal
