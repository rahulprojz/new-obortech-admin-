import constant from '../../utils/LanguageTranslation'
import Button from '../../components/common/form-elements/button/Button'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'

function DeleteModal({ isLoading, onDeleteEntry }) {
    if (typeof window === 'undefined') {
        return null
    }
    return (
        <div>
            <div className='modal-dialog modal-md' role='document'>
                <div className='modal-content'>
                    <div className='modal-header'>
                        <Button className='close' type='button' data-dismiss='modal' aria-label='Close'>
                            <span aria-hidden='true'>×</span>
                        </Button>
                    </div>
                    <div className='modal-body text-center mb-5'>
                        <p>
                            <strong>{constant.deleteRecordTxt}</strong>
                        </p>
                        <LoaderButton cssClass='btn btn-primary large-btn' type='button' isLoading={isLoading} onClick={onDeleteEntry} text={constant.deleteBtnTxt} />
                    </div>
                </div>
            </div>
        </div>
    )
}

DeleteModal.propTypes = {}
DeleteModal.defaultProps = {}

export default DeleteModal
