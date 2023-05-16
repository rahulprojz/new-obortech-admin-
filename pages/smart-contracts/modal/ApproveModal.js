import { Formik } from 'formik'
import string from '../../../utils/LanguageTranslation.js'
import Button from '../../../components/common/form-elements/button/Button'
import LoaderButton from "../../../components/common/form-elements/button/LoaderButton";
import { useRef, useEffect } from 'react'
import * as Yup from 'yup'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'

const AddApprovalSchema = Yup.object().shape({
    description: Yup.string().trim().required(`${string.smartContract.memo} ${string.errors.required}`),
})

function ApproveModal({ isLoading, onProposalApproved, smartContract }) {
    const approveText = useRef();
    const approveModalBody = useRef();
    const resetForm = async () => {
        approveText.current.value = "";
    }

    useEffect(() => {
        document.addEventListener("click", handleClickOutside, false);
        return () => {
            document.removeEventListener("click", handleClickOutside, false);
        };
    }, []);

    const handleClickOutside = event => {
        if (approveModalBody.current && !approveModalBody.current.contains(event.target)) {
            resetForm();
        }
    };

    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <div className='modal-dialog customModal modal-md' role='document'>
                <div className='modal-content' ref={approveModalBody}>
                    <div className='modal-header ob-justify-center pt-4 border-0 ob-modal-header-padding'>
                        <h5 className='modal-title text-dark text-uppercase pt-3 font-weight-bold' id='exampleModalLabel'>
                            {string.smartContract.approvalConfirmation}
                        </h5>
                        <Button className='close' type='button' data-dismiss='modal' aria-label='Close' onClick={() => resetForm()}>
                            <span aria-hidden='true'>×</span>
                        </Button>
                    </div>
                    <div className='modal-body ob-modal-padding'>
                        <Formik
                            initialValues={{
                                name: smartContract.name,
                                version: smartContract.version
                            }}
                            validationSchema={AddApprovalSchema}
                            onSubmit={async (values, { resetForm }) => {
                                const isApproved = await onProposalApproved(values)
                                if (isApproved) {
                                    resetForm()
                                }
                            }}
                        >
                            {({ errors, touched, handleChange, handleSubmit, values }) => (
                                <form className='form-container' onSubmit={handleSubmit}>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='description' className='col-md-12 col-form-label pl-0 ob-modal-form-label'>
                                            {string.smartContract.memo}
                                        </label>
                                        <textarea name='description' id='description' className='form-control ob-textarea-vertical' maxlength='255' placeholder={string.smartContract.memo} onChange={handleChange} defaultValue="" ref={approveText}>
                                        </textarea>
                                        {errors.description ? <FormHelperMessage message={errors.description} className='error' /> : null}
                                    </div>
                                    <div className='modal-footer border-0'>
                                        <Button className='default-css btn btn-secondory btn-md ob-btn-secondary ob-negative-button ob-min-w140' type='button' data-dismiss='modal' aria-label='Close'>
                                            {string.smartContract.cancel}
                                        </Button>
                                        <LoaderButton cssClass='default-css btn btn-primary btn-md ob-min-w140' type='submit' isLoading={isLoading} text={string.smartContract.approve} />
                                    </div>
                                </form>
                            )}
                        </Formik>
                    </div>
                </div>
            </div>
        )
    }
}

ApproveModal.propTypes = {}
ApproveModal.defaultProps = {}

export default ApproveModal
