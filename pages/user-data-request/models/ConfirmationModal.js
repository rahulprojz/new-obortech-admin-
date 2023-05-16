import React from 'react'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import string from '../../../utils/LanguageTranslation.js'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'

const ConfirmationModal = (props) => {
    const { isOpen, toggle, confirmationType, handleRequestStatus, isLoading } = props
    const title = {
        ACCEPT: string.userDataRequest.acceptRequest,
        REJECT: string.userDataRequest.rejectRequest,
        APPROVE: string.userDataRequest.approvalRequest,
    }
    const btnText = {
        ACCEPT: string.userDataRequest.acceptStr,
        REJECT: string.userDataRequest.rejectStr,
        APPROVE: string.userDataRequest.approveStr,
    }
    return (
        <div>
            <Modal className='customModal' isOpen={isOpen} toggle={() => toggle()}>
                <ModalHeader toggle={() => toggle()} />
                <ModalBody className='modal-body text-center mb-5'>
                    <p>
                        {/* <strong>{confirmationType == 'ACCEPT' ? string.userDataRequest.acceptRequest : string.userDataRequest.rejectRequest}</strong> */}
                        <strong>{title[confirmationType]}</strong>
                    </p>
                    <LoaderButton cssClass='btn btn-primary large-btn' type='submit' onClick={handleRequestStatus} isLoading={isLoading} text={btnText[confirmationType]} />
                </ModalBody>
            </Modal>
        </div>
    )
}

export default ConfirmationModal
