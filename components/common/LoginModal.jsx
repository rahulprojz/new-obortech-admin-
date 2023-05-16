import { useEffect, useState } from 'react'
import { Modal, ModalHeader, ModalBody, Input, Button, Spinner, ModalFooter } from 'reactstrap'
import string from '../../utils/LanguageTranslation'

function LoginModal({ isOpen, toggle, username = '', isLoading, onSubmit }) {
    const [formData, setFormData] = useState({ username })

    useEffect(() => {
        if (!isOpen) setFormData({})
    }, [isOpen])
    if (typeof window === 'undefined') {
        return null
    }
    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal'>
            <ModalHeader toggle={toggle} cssModule={{ 'modal-title': 'modal-title text-uppercase text-dark font-weight-bold' }}>
                {string.login.confirmAccess}
            </ModalHeader>
            <ModalBody>
                <form className='user'>
                    <div className='form-group'>
                        <Input type='text' value={username} disabled className='form-control form-control-user' id='login-username' name='username' placeholder={string.login.username} />
                    </div>
                    <div className='form-group'>
                        <Input type='password' onChange={(event) => setFormData({ ...formData, password: event.target.value })} name='password' className='form-control form-control-user' id='login-password' placeholder={string.onboarding.passWord} />
                    </div>
                </form>
            </ModalBody>
            <ModalFooter>
                <Button onClick={() => onSubmit(formData)} className='btn btn-primary ml-2 large-btn'>
                    {isLoading ? <Spinner size='sm' /> : string.login.login}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default LoginModal
