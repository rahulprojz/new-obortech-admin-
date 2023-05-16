import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import constant from '../../../utils/LanguageTranslation.js'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'

const RestoreModal = ({ onRestoreEntry, toggleRestore, isOpen, isRestore }) => {
    return (
        <Modal isOpen={isOpen} toggle={toggleRestore} className='customModal'>
            <ModalHeader toggle={toggleRestore}></ModalHeader>
            <ModalBody className='text-center mb-5'>
                <p>
                    <strong>{constant.restoreRecordTxt}</strong>
                </p>
                <LoaderButton cssClass='btn btn-primary large-btn' type='button' data-dismiss='modal' isLoading={isRestore} onClick={onRestoreEntry} text={constant.restoreBtnTxt} />
            </ModalBody>
        </Modal>
    )
}

RestoreModal.propTypes = {}
RestoreModal.defaultProps = {}

export default RestoreModal
