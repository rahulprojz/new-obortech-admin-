import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import Button from '../../../components/common/form-elements/button/Button'
import string from '../../../utils/LanguageTranslation.js'

const ToggleModal = ({ isActive, onToggleStatus, toggleStatus, isOpen }) => {
    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <Modal isOpen={isOpen} toggle={toggleStatus} className='customModal'>
                <ModalHeader toggle={toggleStatus}></ModalHeader>
                <ModalBody className='text-center mb-5'>
                    <p>
                        <strong>{isActive ? `${string.project.stopProjectQue}` : `${string.project.startProjectQue}`}</strong>
                    </p>
                    <Button className='btn btn-primary large-btn text-uppercase' type='button' data-dismiss='modal' onClick={onToggleStatus}>
                        {isActive ? `${string.project.stopBtn}` : `${string.project.startBtn}`}
                    </Button>
                </ModalBody>
            </Modal>
        )
    }
}

ToggleModal.propTypes = {}
ToggleModal.defaultProps = {}

export default ToggleModal
