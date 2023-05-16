import string from '../../utils/LanguageTranslation.js'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'

function DeleteModal({ isOpen, toggle, onDeleteEntry, isLoading }) {
    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <Modal isOpen={isOpen} toggle={toggle} className='customModal'>
                <ModalHeader toggle={toggle}></ModalHeader>
                <ModalBody className='text-center mb-5'>
                    <p>
                        <strong>{string.deleteRecordTxt}</strong>
                    </p>
                    <LoaderButton cssClass='btn btn-primary large-btn' type='button' isLoading={isLoading} text={string.deleteBtnTxt} onClick={onDeleteEntry} />
                </ModalBody>
            </Modal>
        )
    }
}

export default DeleteModal
