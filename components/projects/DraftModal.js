// updated
import Button from '../common/form-elements/button/Button'
import string from '../../utils/LanguageTranslation.js'

function DraftModal({ onDeleteEntry }) {
    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <div className='modal-dialog modal-md' role='document'>
                <div className='modal-content'>
                    <div className='modal-header'>
                        <Button className='close' type='button' data-dismiss='modal' aria-label='Close'>
                            <span aria-hidden='true'>{string.cancelSign}</span>
                        </Button>
                    </div>
                    <div className='modal-body text-center mb-5'>
                        <p>
                            <strong> {string.deleteRecordTxt}</strong>
                        </p>
                        <Button className='btn btn-primary large-btn' type='button' onClick={onDeleteEntry}>
                            {string.deleteBtnTxt}
                        </Button>
                    </div>
                </div>
            </div>
        )
    }
}

DraftModal.propTypes = {}
DraftModal.defaultProps = {}

export default DraftModal
