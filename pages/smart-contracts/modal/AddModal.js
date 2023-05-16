import { Formik } from "formik";
import { useFormik } from 'formik';
import * as Yup from "yup";
import string from "../../../utils/LanguageTranslation.js";
import Button from "../../../components/common/form-elements/button/Button";
import Input from "../../../components/common/form-elements/input/Input";
import LoaderButton from "../../../components/common/form-elements/button/LoaderButton";
import moment from 'moment';
import NProgress from 'nprogress'
import Loader from '../../../components/common/Loader'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import { useRef, useEffect, useState } from 'react'
import { async } from "q";

function AddModal({ creatingNewProposal, createFormValues, toggleModal, createNewProposal, allSmartContracts }) {

    const nameRef = useRef()
    const gitAddressRef = useRef()
    const packageRef = useRef()
    const descRef = useRef()
    const createNewModalRef = useRef()
    const versionRef = useRef()

    console.log("allSmartContracts", allSmartContracts);

    const [proposalVersion, setProposalVersion] = useState("v1.0")

    useEffect(() => {
        document.addEventListener("click", handleClickOutside, false);
        return () => {
            document.removeEventListener("click", handleClickOutside, false);
        };
    }, []);

    const handleClickOutside = event => {
        if (createNewModalRef.current && !createNewModalRef.current.contains(event.target)) {
            toggleModal(false)
        }

    };

    const clearForm = async () => {
        toggleModal(false)
    }

    const AddProposalchema = Yup.object().shape({
        proposal_name: Yup.string()
            .trim()
            .matches(/^\S*$/, string.smartContract.correctProposalNameSpace)
            .matches(/^[a-z0-9-_]*$/, string.smartContract.correctProposalName)
            .required(`${string.smartContract.proposalName} ${string.errors.required}`),
        package_id: Yup.string().trim().matches(
            /^[a-zA-Z0-9]*$/,
            string.smartContract.correctPackageId
        ).required(`${string.smartContract.packageId} ${string.errors.required}`),
        github_commit_address: Yup.string().trim().matches(
            /^(https:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/,
            string.smartContract.correctCommitAddress
        ).required(`${string.smartContract.gitAddress} ${string.errors.required}`),
        description: Yup.string().trim().required(`${string.smartContract.description} ${string.errors.required}`),
    });

    const validate = values => {
        const errors = {};
        allSmartContracts.find((smartContract, i) => {
            if (smartContract.data.name === values.proposal_name) {
                if (smartContract.data.status == 'committed' || smartContract.data.status == 'cancelled') {
                    setProposalVersion("v" + (smartContract.data.version + 1) + ".0")
                } else {
                    errors.proposal_name = "Proposal Name " + values.proposal_name + " is active and and already exists !!!"
                }
                return true; // stop searching
            } else {
                setProposalVersion("v1.0")
            }
        });
        return errors;
    };


    if (typeof window === "undefined") {
        return null;
    } else {
        return (
            <div className="modal-dialog modal-lg" role="document" ref={createNewModalRef}>
                <div className="modal-content">

                    <Formik
                        initialValues={{
                            proposal_name: createFormValues.name,
                            package_id: createFormValues.commitAddress,
                            github_commit_address: createFormValues.packageId,
                            description: createFormValues.desc
                        }}
                        validationSchema={AddProposalchema}
                        validate={validate}
                        onSubmit={async (values, { resetForm }) => {
                            await createNewProposal(values)
                            resetForm()

                        }}>
                        {({ errors, touched, handleChange, handleBlur, handleSubmit, values }) => (
                            <form onSubmit={handleSubmit} >
                                <div className="modal-header ob-justify-center pt-4 border-0">
                                    <h5 className="modal-title text-dark text-center text-uppercase font-weight-bold" id="exampleModalLabel">
                                        {string.smartContract.newContractTitle}
                                    </h5>
                                    <Button
                                        className="close"
                                        //data-dismiss="modal"
                                        type="button"
                                        aria-label="Close"
                                        onClick={() => clearForm()}
                                    >
                                        <span aria-hidden="true">×</span>
                                    </Button>
                                </div>
                                {(typeof allSmartContracts === 'undefined') && <Loader className='pagination-loader' />}
                                {(typeof allSmartContracts !== 'undefined') &&
                                    <div className="modal-body ob-modal-padding">

                                        <div className="row">
                                            <div className="col-md-6 pl-0">
                                                <div className="row pt-2">
                                                    <div className="col-md-12 pl-0">
                                                        <label htmlFor="name" className="col-md-12 pl-0 pt-1 ob-modal-form-label">
                                                            {string.smartContract.name}
                                                        </label>
                                                    </div>
                                                    <div className="col-md-12 pl-0">
                                                        <Input
                                                            type="text"
                                                            name="proposal_name"
                                                            id="proposal_name"
                                                            className="form-control"
                                                            placeholder={string.smartContract.name}
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            value={values.proposal_name}
                                                            ref={nameRef}
                                                        />
                                                        {touched.proposal_name && errors.proposal_name ? <FormHelperMessage message={errors.proposal_name} className='error' /> : null}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6 pl-0">
                                                <div className="row pt-2">
                                                    <div className="col-md-12">
                                                        <label htmlFor="name" className="col-md-12 pl-0 pt-1 ob-modal-form-label">
                                                            {string.smartContract.version}
                                                        </label>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <Input
                                                            type="text"
                                                            className="form-control ob-disabled"
                                                            value={proposalVersion}
                                                            ref={versionRef}
                                                            readonly
                                                            disabled
                                                        />

                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row pt-2">
                                            <div className="col-md-6 pl-0">
                                                <div className="row pt-2">
                                                    <div className="col-md-12 pl-0">
                                                        <label htmlFor="name" className="col-md-12 pt-1 pl-0 ob-modal-form-label">
                                                            {string.smartContract.gitAddress}
                                                            <span style={{ marginLeft: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                                                title="Link of specific commit from GitHub">
                                                                &#9432;
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div className="col-md-12 pl-0">
                                                        <Input
                                                            type="text"
                                                            name="github_commit_address"
                                                            id="github_commit_address"
                                                            className="form-control"
                                                            placeholder={string.smartContract.gitAddress}
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            value={values.github_commit_address}
                                                            ref={gitAddressRef}
                                                        />
                                                        {touched.github_commit_address && errors.github_commit_address ? <FormHelperMessage message={errors.github_commit_address} className='error' /> : null}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="col-md-6 pl-0">
                                                <div className="row pt-2">
                                                    <div className="col-md-12">
                                                        <label htmlFor="name" className="col-md-12 pl-0 pt-1 ob-modal-form-label">
                                                            {string.smartContract.packageId}
                                                            <span style={{ marginLeft: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                                                title="SHA256 digest of docker image">
                                                                &#9432;
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <div className="col-md-12">
                                                        <Input
                                                            type="text"
                                                            name="package_id"
                                                            id="package_id"
                                                            className="form-control"
                                                            placeholder={string.smartContract.packageId}
                                                            onChange={handleChange}
                                                            onBlur={handleBlur}
                                                            value={values.package_id}
                                                            ref={packageRef}
                                                        />
                                                        {touched.package_id && errors.package_id ? <FormHelperMessage message={errors.package_id} className='error' /> : null}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                        <div className="row pt-2 pl-0">
                                            <div className="form-group col-md-12 pt-2 pl-0">
                                                <label htmlFor='description' className='col-md-12 pl-0 ob-modal-form-label'>
                                                    {string.smartContract.description}
                                                </label>
                                                <textarea name='description' id='description' className='form-control ob-textarea-vertical ob-min-h90'
                                                    maxlength='255' row='4'
                                                    placeholder={string.smartContract.description}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    value={values.description}
                                                    ref={descRef}>
                                                </textarea>
                                                {touched.description && errors.description ? <FormHelperMessage message={errors.description} className='error' /> : null}
                                            </div>
                                        </div>
                                        <div className="modal-footer ob-justify-center border-0">
                                            <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={creatingNewProposal} text={string.submitBtnTxt} />
                                        </div>

                                    </div>
                                }
                            </form>
                        )}
                    </Formik>


                </div>
            </div >
        );
    }
}

AddModal.propTypes = {};
AddModal.defaultProps = {};

export default AddModal;
