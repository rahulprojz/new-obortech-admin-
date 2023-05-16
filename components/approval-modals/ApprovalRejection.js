import { Modal, ModalHeader, ModalBody } from 'reactstrap'

import string from '../../utils/LanguageTranslation.js'

function ApprovalRejection({ isOpen, orgName, onToggle }) {
    return (
        <Modal isOpen={isOpen} toggle={onToggle} className='customModal'>
            <ModalHeader toggle={onToggle}></ModalHeader>
            <ModalBody className='text-center mb-5' style={{ marginTop: '80px' }}>
                <img src='/static/img/user-warning.png' alt='user-warning' />
                <p style={{ marginBottom: '120px' }}>
                    {string.approvalRejectionText1} {<span style={{ fontWeight: "bold" }}>{` CEO(${orgName}) `}</span>} {string.approvalRejectionText2}
                </p>
            </ModalBody>
        </Modal>
    )
}

export default ApprovalRejection
