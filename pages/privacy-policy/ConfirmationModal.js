import React from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import string from "../../utils/LanguageTranslation.js";
import LoaderButton from "../../components/common/form-elements/button/LoaderButton";

const ConfirmationModal = (props) => {
    const { isOpen, toggle, handleSubmit, isLoading } = props;
    return (
        <Modal className="customModal" isOpen={isOpen} toggle={() => toggle()}>
            <ModalHeader toggle={() => toggle()}></ModalHeader>
            <ModalBody className="modal-body text-center mb-5">
                <p>
                    <strong>{string.privacyPolicy.confirmationMsg}</strong>
                </p>
                <LoaderButton
                    cssClass="btn btn-primary large-btn"
                    type="submit"
                    onClick={handleSubmit}
                    isLoading={isLoading}
                    text={string.updateBtnTxt}
                />
            </ModalBody>
        </Modal>
    );
}

export default ConfirmationModal;