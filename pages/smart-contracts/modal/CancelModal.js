import { Formik } from 'formik'
import string from '../../../utils/LanguageTranslation.js'
import Button from '../../../components/common/form-elements/button/Button'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'

function CancelModal({ cancellingProposal, onProposalCancelled, cancelProposalId, selectedTab }) {
    if (typeof window === 'undefined') {
        return null
    } else {

        return (
            <div className='modal-dialog customModal modal-md' role='document'>
                <div className='modal-content'>
                    <div className='modal-header ob-justify-center pt-4 border-0'>
                        <h5 className='modal-title text-dark pt-3 text-uppercase font-weight-bold' id='exampleModalLabel'>
                            {string.smartContract.cancelConfirmation}
                        </h5>
                        <Button className='close' type='button' data-dismiss='modal' aria-label='Close'>
                            <span aria-hidden='true'>×</span>
                        </Button>
                    </div>
                    <div className='modal-body ob-modal-padding'>
                        <Formik
                            initialValues={{
                                id: cancelProposalId,
                                //version: smartContract.version,
                            }}
                            onSubmit={async (values, { resetForm }) => {
                                const isCancelled = await onProposalCancelled(cancelProposalId, selectedTab)
                                if (isCancelled) {
                                    resetForm()
                                }
                            }}
                        >
                            {({ errors, touched, handleChange, handleSubmit, values }) => (
                                <form className='form-container' onSubmit={handleSubmit}>
                                    <div className='modal-footer border-0'>
                                        <Button className='default-css btn ob-negative-button btn-md ob-min-w140 ob-btn-secondary text-uppercase' type='button' data-dismiss='modal' aria-label='Close'>
                                            {string.smartContract.no}
                                        </Button>
                                        <LoaderButton cssClass='default-css btn btn-primary btn-md ob-min-w140 text-uppercase' type='submit' isLoading={cancellingProposal} text={string.smartContract.yes} />
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

CancelModal.propTypes = {}
CancelModal.defaultProps = {}

export default CancelModal
