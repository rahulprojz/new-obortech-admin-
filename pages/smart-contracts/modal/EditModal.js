import { Formik } from 'formik'
import * as Yup from 'yup'
import string from '../../../utils/LanguageTranslation.js'
import Button from '../../../components/common/form-elements/button/Button'
import Input from '../../../components/common/form-elements/input/Input'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'
import moment from 'moment'
import { useEffect, useMemo, useState } from 'react'
import NProgress from 'nprogress'
import Loader from '../../../components/common/Loader'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'

const AddProposalchema = Yup.object().shape({
    package_id: Yup.string()
        .trim()
        .matches(/^[a-zA-Z0-9]*$/, string.smartContract.correctPackageId)
        .required(`${string.smartContract.packageId} ${string.errors.required}`),
    github_commit_address: Yup.string()
        .trim()
        .matches(/^(https:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/, string.smartContract.correctCommitAddress)
        .required(`${string.smartContract.gitAddress} ${string.errors.required}`),
    description: Yup.string().trim().required(`${string.smartContract.description} ${string.errors.required}`),
})

function EditModal({ addingProposal, loadingProposal, smartContract = {}, addProposal, allSmartContracts }) {
    const [proposalVersion, setProposalVersion] = useState('')
    
        const validate = () => {
            const selectedSmartContract = allSmartContracts?.find((smrt) => smrt.data.name === smartContract?.name && (smrt.data.status == 'committed' || smrt.data.status == 'cancelled'))
            if (selectedSmartContract) {
                setProposalVersion('v' + (selectedSmartContract.data.version + 1) + '.0')
            } else if (!selectedSmartContract) {
                setProposalVersion('v1.0')
            }
        }

    useMemo(() => {
        if (!!smartContract) validate()
    }, [JSON.stringify(smartContract)])

    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <div className='modal-dialog modal-lg' role='document'>
                <div className='modal-content'>
                    <div className='modal-header ob-justify-center pt-4 border-0'>
                        <h5 className='modal-title text-dark text-center text-uppercase font-weight-bold' id='exampleModalLabel'>
                            {string.smartContract.editContractTitle}
                        </h5>
                        <Button className='close' type='button' data-dismiss='modal' aria-label='Close'>
                            <span aria-hidden='true'>×</span>
                        </Button>
                    </div>
                    {typeof smartContract === 'undefined' && <Loader className='pagination-loader' />}
                    {typeof smartContract !== 'undefined' && (
                        <div className='modal-body ob-modal-padding'>
                            <div className='row'>
                                <div className='col-md-6 pl-0'>
                                    <div className='row pt-2'>
                                        <div className='col-md-12 pl-0'>
                                            <label htmlFor='name' className='col-md-12 pl-0 pt-1 ob-modal-form-label'>
                                                {string.smartContract.name}
                                            </label>
                                        </div>
                                        <div className='col-md-12 pl-0'>
                                            <Input type='text' className='form-control ob-disabled' value={smartContract.name} readonly disabled />
                                        </div>
                                    </div>
                                </div>
                                <div className='col-md-6 pl-0'>
                                    <div className='row pt-2'>
                                        <div className='col-md-12'>
                                            <label htmlFor='name' className='col-md-12 pl-0 pt-1 ob-modal-form-label'>
                                                {string.smartContract.version}
                                            </label>
                                        </div>
                                        <div className='col-md-12'>
                                            <Input type='text' className='form-control ob-disabled' value={proposalVersion} readonly disabled />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Formik
                                initialValues={{
                                    name: smartContract.name,
                                    id: '3fe182b3-2c76-413d-96c4-2901889644f1',
                                    package_id: smartContract.package_id,
                                    github_commit_address: smartContract.github_commit_address,
                                }}
                                validationSchema={AddProposalchema}
                                onSubmit={async (values, { resetForm }) => {
                                    const isProposalAdded = await addProposal(values)
                                    if (isProposalAdded) {
                                        resetForm()
                                    }
                                }}
                            >
                                {({ errors, touched, handleChange, handleBlur, handleSubmit, values }) => (
                                    <form className='form-container' onSubmit={handleSubmit}>
                                        <div className='row ml-0 mr-0 mb-0 content-block pt-3'>
                                            <div className='form-group col-md-6  pl-0'>
                                                <label htmlFor='gitAddress' className='col-md-12 pl-0 ob-modal-form-label'>
                                                    {string.smartContract.gitAddress}
                                                    <span style={{ marginLeft: '5px', cursor: 'pointer', fontWeight: 'bold' }} title='Link of specific commit from GitHub'>
                                                        &#9432;
                                                    </span>
                                                </label>
                                                <Input type='text' name='github_commit_address' id='github_commit_address' defaultValue={smartContract.github_commit_address || ''} className='form-control' placeholder={string.smartContract.gitAddress} onChange={handleChange} onBlur={handleBlur} />
                                                {errors.github_commit_address && touched.github_commit_address ? <FormHelperMessage message={errors.github_commit_address} className='error' /> : null}
                                            </div>
                                            <div className='form-group col-md-6 pl-3'>
                                                <label htmlFor='packageId' className='col-md-12 pl-0 ob-modal-form-label'>
                                                    {string.smartContract.packageId}
                                                    <span style={{ marginLeft: '5px', cursor: 'pointer', fontWeight: 'bold' }} title='SHA256 digest of docker image'>
                                                        &#9432;
                                                    </span>
                                                </label>
                                                <Input type='text' name='package_id' id='package_id' defaultValue={smartContract.package_id || ''} className='form-control' placeholder={string.smartContract.packageId} onChange={handleChange} onBlur={handleBlur} />
                                                {errors.package_id && touched.package_id ? <FormHelperMessage message={errors.package_id} className='error' /> : null}
                                            </div>
                                            <div className='form-group col-md-12 pl-0 ob-modal-form-label'>
                                                <label htmlFor='description ob-modal-form-label'>{string.smartContract.description}</label>
                                                <textarea name='description' id='description' className='form-control ob-textarea-vertical ob-min-h90' maxlength='255' row='4' placeholder={string.smartContract.description} onChange={handleChange} onBlur={handleBlur} defaultValue=''></textarea>
                                                {errors.description ? <FormHelperMessage message={errors.description} className='error' /> : null}
                                            </div>
                                        </div>
                                        <div className='modal-footer ob-justify-center border-0'>
                                            <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={addingProposal} text={string.submitBtnTxt} />
                                        </div>
                                    </form>
                                )}
                            </Formik>
                        </div>
                    )}
                                {!smartContract?.name && <Loader style={{ position: 'absolute' }} />}

                </div>
            </div>
        )
    }
}

EditModal.propTypes = {}
EditModal.defaultProps = {}

export default EditModal
