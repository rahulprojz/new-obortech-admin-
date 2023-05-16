import { Modal, ModalHeader, ModalBody } from 'reactstrap'

import string from '../../utils/LanguageTranslation.js'

function RejectionWarning({ isOpen, orgName, onToggle, onSubmit }) {
    return (
        <Modal isOpen={isOpen} toggle={onToggle} className='customModal'>
            <ModalHeader toggle={onToggle}></ModalHeader>
            <ModalBody className='text-center mb-5' style={{ marginTop: '40px', paddingBottom: '100px' }}>
                <img src='/static/img/user-warning.png' alt='user-warning' />
                <p>
                    {string.approvalRejectionWarningText1}
                </p>
                <p>
                    {<span style={{ fontWeight: "bold" }}>{` CEO(${orgName}) `}</span>}
                </p>
                <p>
                    {string.approvalRejectionWarningText2}
                </p>
                <br />
                <span
                    style={{ background: '#000', 'padding': '9px 49px', color: '#fff', fontSize: '18px', textTransform: 'uppercase', border: 0, borderRadius: '8px', fontFamily: 'Roboto Condensed', sansSerif: true, fontWeight: '600', cursor: 'pointer' }}
                    onClick={onSubmit}
                >
                    OK
                </span>
            </ModalBody>
        </Modal>
    )
}

export default RejectionWarning
