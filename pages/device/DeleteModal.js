// updated
import Button from '../../components/common/form-elements/button/Button'
import string from '../../utils/LanguageTranslation.js'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'

function DeleteModal({ isLoading, onDeleteEntry }) {
    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <div className='modal-dialog modal-md' role='document'>
                <div className='modal-content'>
                    <div className='modal-header'>
                        <Button className='close' type='button' data-dismiss='modal' aria-label='Close'>
                            <span aria-hidden='true'>×</span>
                        </Button>
                    </div>
                    <div className='modal-body text-center mb-5'>
                        <p>
                            <strong>{string.deleteRecordTxt}</strong>
                        </p>
                        <LoaderButton cssClass='btn btn-primary large-btn' type='button' isLoading={isLoading} onClick={onDeleteEntry} text={string.deleteBtnTxt} />
                    </div>
                </div>
            </div>
        )
    }
}

DeleteModal.propTypes = {}
DeleteModal.defaultProps = {}

export default DeleteModal
