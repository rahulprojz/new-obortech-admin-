import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import constant from '../../../utils/LanguageTranslation.js'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'

const DeleteModal = ({ onDeleteEntry, toggleDelete, isOpen, isDeleting, deleteMode }) => {
    return (
        <Modal isOpen={isOpen} toggle={toggleDelete} className='customModal'>
            <ModalHeader toggle={toggleDelete}></ModalHeader>
            <ModalBody className='text-center mb-5'>
                <p>{deleteMode == 'template' ? <strong>{constant.deleteTemplateTxt}</strong> : <strong>{constant.archiveRecordTxt}</strong>}</p>
                {deleteMode == 'template' ? (
                    <LoaderButton cssClass='btn btn-primary large-btn' type='button' data-dismiss='modal' isLoading={isDeleting} onClick={onDeleteEntry} text={constant.deleteBtnTxt} />
                ) : (
                    <LoaderButton cssClass='btn btn-primary large-btn' type='button' data-dismiss='modal' isLoading={isDeleting} onClick={onDeleteEntry} text={constant.archiveBtnTxt} />
                )}
            </ModalBody>
        </Modal>
    )
}

DeleteModal.propTypes = {}
DeleteModal.defaultProps = {}

export default DeleteModal
