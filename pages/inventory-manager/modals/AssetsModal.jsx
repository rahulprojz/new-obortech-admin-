import React from 'react'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import Select from 'react-select'
import { useFormik } from 'formik'
import * as Yup from 'yup'

import { AssetCode, TextField } from '../../../components/inventory-manager'
import { addAssets, checkAssetCode, updateAssets } from '../../../lib/api/inventory-assets'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import string from '../../../utils/LanguageTranslation'
import notify from '../../../lib/notifier'

const AssetsModal = (props) => {
    const { toggle, isOpen, MY_ASSETS_CLASSES, editIndex, initialApi, categoryList, isEditMode } = props
    const formik = useFormik({
        initialValues: {
            id: MY_ASSETS_CLASSES.list[editIndex]?.id ?? '',
            name: MY_ASSETS_CLASSES.list[editIndex]?.name ?? '',
            local_name: MY_ASSETS_CLASSES.list[editIndex]?.local_name ?? '',
            asset_category_id: MY_ASSETS_CLASSES.list[editIndex]?.asset_category_id ?? '',
            measurement: MY_ASSETS_CLASSES.list[editIndex]?.measurement ?? '',
            asset_code: MY_ASSETS_CLASSES.list[editIndex]?.asset_code ?? '',
            subinfo: MY_ASSETS_CLASSES.list[editIndex]?.subinfo ?? '',
        },
        validationSchema: Yup.object({
            name: Yup.string()
                .required(`${string.inventory.assetNameReq} ${string.errors.required}`)
                .matches(/^(?!.*["'`\\])/, `${string.inventory.assetNameReq} ${string.errors.invalid}`),

            local_name: Yup.string()
                .required(`${string.inventory.assetLocalNameReq} ${string.errors.required}`)
                .matches(/^[\u0400-\u04FF -]*[\u0400-\u04FF][\u0400-\u04FF -]+$/, `${string.inventory.assetLocalNameReq} ${string.onboarding.validations.onlyCyrillicAlphabet}`),
            measurement: Yup.string().required(`${string.inventory.measurement} ${string.errors.required}`),
            asset_category_id: Yup.number().required(`${string.inventory.categoryNameReq} ${string.errors.required}`),
            asset_code: Yup.number().required(`${string.inventory.asset_code} ${string.errors.required}`),
        }),
        onSubmit: async (values) => {
            if (isEditMode) {
                toggle()
                await updateAssets(values)
                await initialApi()
            } else {
                const isExist = await checkAssetCode({ asset_code: values.asset_code })
                if (isExist.code == 200) {
                    toggle()
                    await addAssets(values)
                    await initialApi()
                } else {
                    notify(string.inventory.assetCodeAlreadyExists)
                }
            }
        },
    })

    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal document'>
            <ModalHeader toggle={toggle}>
                <span className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {isEditMode ? string.inventory.editassets : string.inventory.createAssets}
                </span>
            </ModalHeader>
            <ModalBody>
                <form onSubmit={formik.handleSubmit}>
                    <div className='row ml-0 mr-0 content-block'>
                        <div className='form-group col-md-12 p-0'>
                            <TextField name='name' label={`${string.inventory.assetClassName} (${string.local_language})`} value={formik.values?.name} onChange={formik.handleChange} error={formik.errors?.name} />
                            <TextField name='local_name' label={`${string.inventory.assetClassName} (${string.mong_language})`} value={formik.values?.local_name} onChange={formik.handleChange} error={formik.errors?.local_name} />
                            <TextField name='measurement' label={`${string.inventory.measurement}`} value={formik.values?.measurement} onChange={formik.handleChange} error={formik.errors?.measurement} />
                            <AssetCode code={formik.values?.asset_code} onChange={formik.handleChange} message={formik.errors?.asset_code} setAssetCode={formik.setFieldValue} isEditMode={isEditMode} />
                            <Select
                                value={categoryList.find((cat) => cat.value == formik.values?.asset_category_id)}
                                isSearchable
                                options={categoryList}
                                name='asset_category_id'
                                className='mt-3'
                                onChange={(event) => {
                                    formik.handleChange({ target: { name: 'asset_category_id', value: event.value } })
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

export default AssetsModal
