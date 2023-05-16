import React from 'react'
import { Button, Modal, Row, ModalHeader, ModalBody, ModalFooter, Col } from 'reactstrap'
import string from '../../../utils/LanguageTranslation'

function DeleteOrganization({ modal, setModal, orgDelApproval = {}, onDelete }) {
    const toggle = () => setModal(!modal)
    return (
        <Modal isOpen={modal} toggle={toggle} className='customModal'>
            <ModalHeader cssModule={{ 'modal-title': 'modal-title text-dark font-weight-bold' }} toggle={toggle}>
                {string.confirmationModal.title}
            </ModalHeader>
            <ModalBody>
                <p className='text-center'>{string.deleteOrgText}</p>
                <Row>
                    <Col xm={12} sm={12} md={6} lg={6} xl={6}>
                        <div>
                            <p className='text-dark modal-header-text mb-1 mt-3'>{string.pendingBy}</p>
                            {orgDelApproval.pending &&
                                orgDelApproval.pending.map((user) => (
                                    <div className='py-1 d-block text-capitalize' style={{ fontSize: '15px' }}>
                                        - {user.first_name} {user.last_name}
                                    </div>
                                ))}
                            {!orgDelApproval.pending && <div>loading...</div>}
                        </div>
                    </Col>
                    <Col xm={12} sm={12} md={6} lg={6} xl={6}>
                        <div>
                            <p className='text-dark modal-header-text mb-1 mt-3'>{string.docAcceptedBy}</p>
                            {orgDelApproval.deleted &&
                                orgDelApproval.deleted.map((user) => (
                                    <div className='py-1 d-block text-capitalize' style={{ fontSize: '15px' }}>
                                        - {user.first_name} {user.last_name}
                                    </div>
                                ))}
                            {!orgDelApproval.pending && <div>loading...</div>}
                        </div>
                    </Col>
                </Row>
            </ModalBody>
            <ModalFooter>
                <Button color='primary' className='large-btn' onClick={onDelete}>
                    {string.deleteBtnTxt}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default DeleteOrganization
