import { Modal, ModalBody } from 'reactstrap'
import string from '../../utils/LanguageTranslation'

function NotifyModal({ isOpen, toggle, getLatestLanguage }) {
    if (typeof window === 'undefined') {
        return null
    }
    return (
        <Modal centered isOpen={isOpen} toggle={toggle} modalClassName='lang-update-modal'>
            <ModalBody className='text-center m-3 text-muted lead'>
                <p>{string.languageRequest.reloadSuccess}</p>
                <button type='button' className='btn btn-md btn-primary text-uppercase' onClick={getLatestLanguage}>
                    {string.confirmationModal.btnTxtOK}
                </button>
            </ModalBody>
        </Modal>
    )
}

export default NotifyModal
