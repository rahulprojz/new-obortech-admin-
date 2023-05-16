import { Formik } from 'formik'
import * as Yup from 'yup'
import string from '../../../utils/LanguageTranslation.js'
import Button from '../../../components/common/form-elements/button/Button'
import LoaderButton from "../../../components/common/form-elements/button/LoaderButton";
import { useRef, useEffect } from 'react'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'


function AddCommentModal({ isLoading, onCommentSubmit, smartContract }) {
    const commentText = useRef();
    const commentModalBody = useRef();
    const resetForm = async () => {
        commentText.current.value = "";
    }
    const AddCommentSchema = Yup.object().shape({
        comment: Yup.string().trim().required(`${string.smartContract.comment} ${string.errors.required}`),
    })
    useEffect(() => {
        document.addEventListener("click", handleClickOutside, false);
        return () => {
            document.removeEventListener("click", handleClickOutside, false);
        };
    }, []);

    const handleClickOutside = event => {
        if (commentModalBody.current && !commentModalBody.current.contains(event.target)) {
            resetForm();
        }
    };

    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <div className='modal-dialog modal-md' role='document'>
                <div className='modal-content' ref={commentModalBody}>
                    <div className='modal-header ob-justify-center pt-4 border-0'>
                        <h5 className='modal-title text-dark text-uppercase font-weight-bold' id='exampleModalLabel'>
                            {string.smartContract.addNewComment}
                        </h5>
                        <Button className='close' type='button' data-dismiss='modal' aria-label='Close' onClick={() => resetForm()}>
                            <span aria-hidden='true'>×</span>
                        </Button>
                    </div>
                    <div className='modal-body ob-modal-padding'>
                        <Formik

                            initialValues={{
                                name: smartContract.name,
                                version: smartContract.version,
                            }}
                            validationSchema={AddCommentSchema}
                            onSubmit={async (values, { resetForm }) => {
                                const isCommentAdded = await onCommentSubmit(values)
                                if (isCommentAdded) {
                                    resetForm()
                                }
                            }}
                        >
                            {({ errors, touched, handleChange, handleSubmit, values }) => (
                                <form className='form-container' onSubmit={handleSubmit}>
                                    <div className='row ml-0 mr-0 content-block'>

                                        <div className='form-group col-md-12 p-0'>
                                            <label htmlFor='comment' className='col-md-12 col-form-label pl-0 ob-modal-form-label'>
                                                {string.smartContract.comment}
                                            </label>
                                            <textarea name='comment' id='comment' className='form-control ob-textarea-vertical' maxlength='255' placeholder={string.smartContract.comment} onChange={handleChange} defaultValue="" ref={commentText}>
                                            </textarea>
                                            {errors.comment ? <FormHelperMessage message={errors.comment} className='error' /> : null}
                                        </div>
                                    </div>
                                    <div className='modal-footer border-0 ob-justify-center'>
                                        <LoaderButton cssClass='btn btn-primary large-btn text-uppercase' type='submit' isLoading={isLoading} text={string.smartContract.comment} />
                                    </div>
                                </form>
                            )}
                        </Formik>
                    </div>
                </div>
            </div >
        )
    }
}

AddCommentModal.propTypes = {}
AddCommentModal.defaultProps = {}

export default AddCommentModal
