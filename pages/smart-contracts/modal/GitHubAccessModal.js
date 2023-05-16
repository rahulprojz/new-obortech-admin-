import { Formik } from 'formik'
import string from '../../../utils/LanguageTranslation.js'
import Button from '../../../components/common/form-elements/button/Button'
import LoaderButton from "../../../components/common/form-elements/button/LoaderButton";


function GitHubAccessModal({ modifyingAccess, onGitAccessChanged, toggleGitAccessModal, gitHubAccessData, confirmationMessage, gitHubModalAction }) {

    const cancelModal = async () => {
        toggleGitAccessModal(false)
    }
    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <div className='modal-dialog customModal modal-md' role='document'>
                <div className='modal-content'>
                    <div className='modal-header ob-justify-center pt-4 border-0'>
                        <h5 className='modal-title text-dark pt-3 text-uppercase font-weight-bold' id='exampleModalLabel'>
                            {confirmationMessage}
                        </h5>
                        <Button className='close' type='button' onClick={() => cancelModal()}>
                            <span aria-hidden='true'>×</span>
                        </Button>
                    </div>
                    <div className='modal-body ob-modal-padding'>
                        <Formik
                            initialValues={{

                            }}

                            onSubmit={async (values, { resetForm }) => {
                                const isCancelled = await onGitAccessChanged(gitHubAccessData.organization_id, gitHubAccessData.channel_id, gitHubAccessData.invitation_id, gitHubModalAction, gitHubAccessData.organization.users[0].user_github_detail.username)
                                if (isCancelled) {
                                    resetForm()
                                }
                            }}
                        >
                            {({ errors, touched, handleChange, handleSubmit, values }) => (
                                <form className='form-container' onSubmit={handleSubmit}>
                                    <div className='modal-footer border-0'>
                                        <Button type='button' className='default-css btn ob-negative-button btn-md ob-min-w140 ob-btn-secondary text-uppercase' onClick={() => cancelModal()}>
                                            {string.smartContract.no}
                                        </Button>
                                        <LoaderButton cssClass='default-css btn btn-primary btn-md ob-min-w140 text-uppercase' type='submit' isLoading={modifyingAccess} text={string.smartContract.yes} />
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

GitHubAccessModal.propTypes = {}
GitHubAccessModal.defaultProps = {}

export default GitHubAccessModal
