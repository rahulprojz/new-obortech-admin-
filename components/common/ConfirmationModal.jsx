import string from '../../utils/LanguageTranslation.js'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'

function ConfirmationModal({ isOpen = false, title = string.confirmationModal.title, btnTxt = string.confirmationModal.btnTxt, toggle = () => {}, onSubmit = () => {}, isLoading = false }) {
    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <Modal isOpen={isOpen} toggle={toggle} className='customModal'>
                <ModalHeader toggle={toggle}></ModalHeader>
                <ModalBody className='text-center mb-5'>
                    <p>
                        <strong>{title}</strong>
                    </p>
                    <LoaderButton cssClass='btn btn-primary large-btn' type='button' isLoading={isLoading} text={btnTxt} onClick={onSubmit} />
                </ModalBody>
            </Modal>
        )
    }
}

export default ConfirmationModal
