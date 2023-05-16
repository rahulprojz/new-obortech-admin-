import { Modal, ModalBody, ModalHeader } from "reactstrap";

import LoaderButton from "../../../components/common/form-elements/button/LoaderButton";
import string from "../../../utils/LanguageTranslation.js";

const ApproveUser = ({
    participant,
    openUserAppDisapp,
    isLoading,
    toggleApproveDisapproveModal,
    approveDisapproveUser
}) => {
    return <Modal
        toggle={toggleApproveDisapproveModal}
        isOpen={openUserAppDisapp}
        className="customModal"
    >
        <ModalHeader toggle={toggleApproveDisapproveModal}></ModalHeader>
        <ModalBody className="text-center mb-5">
            <p>
                <strong>{participant.isApproved ? string.organization.disapproveUser : string.organization.approveUser}</strong>
            </p>
            <LoaderButton
                cssClass="btn btn-primary large-btn"
                type="button"
                isLoading={isLoading}
                onClick={() => { approveDisapproveUser() }}
                text={participant.isApproved ? string.disapproveBtn : string.approveBtn}
            />
        </ModalBody>
    </Modal>
}

export default ApproveUser;