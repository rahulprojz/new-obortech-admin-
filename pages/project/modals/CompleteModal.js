import string from '../../../utils/LanguageTranslation.js'
import { Modal, ModalHeader, ModalBody, Spinner } from 'reactstrap'
import Button from '../../../components/common/form-elements/button/Button'

const CompleteModal = ({ onCompleteProject, toggleComplete, isOpen, isLoading }) => {
    return (
        <Modal isOpen={isOpen} toggle={toggleComplete} className='customModal'>
            <ModalHeader toggle={toggleComplete}></ModalHeader>
            <ModalBody className='text-center mb-5'>
                <p>
                    <strong>{string.completeProject}</strong>
                </p>
                <Button className='btn btn-primary large-btn' type='button' data-dismiss='modal' onClick={onCompleteProject}>
                    {isLoading ? <Spinner size={'sm'} /> : string.completeBtn}
                </Button>
            </ModalBody>
        </Modal>
    )
}

CompleteModal.propTypes = {}
CompleteModal.defaultProps = {}

export default CompleteModal
