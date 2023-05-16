import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import string from "../../utils/LanguageTranslation.js";

const DeleteModal = ({ onDeleteEntry, toggle, isOpen }) => {
    if (typeof window === 'undefined') {
        return null;
    } else{
        return (
            <Modal isOpen={isOpen} toggle={toggle} className="customModal">
            <ModalHeader toggle={toggle}></ModalHeader>
                <ModalBody className="text-center mb-5">
                    <p><strong>{string.deletePageTxt}</strong></p>
                    <button className="btn btn-primary large-btn" type="button" data-dismiss="modal" onClick={onDeleteEntry}>{string.deleteBtnTxt}</button>
                </ModalBody>
            </Modal>
        );
    }
}

export default DeleteModal;
