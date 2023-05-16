import { Modal, ModalHeader, ModalBody, Spinner } from 'reactstrap'

import string from '../../utils/LanguageTranslation.js'

function ShareProfile({ isOpen, orgName, onToggle, onSubmit, loading = false }) {
    return (
        <Modal isOpen={isOpen} toggle={onToggle} className='customModal'>
            <ModalHeader toggle={onToggle} />
            <ModalBody className='text-center mb-5' style={{ marginTop: '40px', paddingBottom: '100px' }}>
                <img src='/static/img/user-profile-search.png' alt='user-warning' />
                <p>
                    {<span style={{ fontWeight: 'bold' }}>{` CEO(${orgName}) `}</span>} {string.shareProfileText}
                </p>
                <br />
                {loading ? (
                    <Spinner size='sm'> {''} </Spinner>
                ) : (
                    <span style={{ background: '#000', padding: '9px 49px', color: '#fff', fontSize: '18px', textTransform: 'uppercase', border: 0, borderRadius: '8px', fontFamily: 'Roboto Condensed', sansSerif: true, fontWeight: '600', cursor: 'pointer' }} onClick={onSubmit}>
                        {string.event.acceptyes}
                    </span>
                )}
            </ModalBody>
        </Modal>
    )
}

export default ShareProfile
