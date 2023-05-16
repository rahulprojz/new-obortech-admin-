import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import string from '../../../utils/LanguageTranslation.js'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'
import Button from '../../../components/common/form-elements/button/Button'

function OrgEditWarning({ isOpen, onToggle, onSubmit = () => {} }) {
    return (
        <Modal isOpen={isOpen} toggle={onToggle} className='customModal'>
            <ModalHeader toggle={onToggle}></ModalHeader>
            <ModalBody className='text-center mb-5'>
                <h3>
                    <strong>{string.warning}</strong>
                </h3>
                <img src='../../../static/img/user-warning.png' alt='user-warning' />
                <p>
                    {string.invalidatedText1} <br /> {string.invalidatedText2}
                </p>
                <ModalFooter>
                    <LoaderButton className='btn btn-primary small-btn' type='button' text={string.confirmationModal.btnTxt} onClick={onSubmit} />
                    <Button onClick={onToggle} className='btn btn-primary'>
                        {string.cancel}
                    </Button>
                </ModalFooter>
            </ModalBody>
        </Modal>
    )
}

export default OrgEditWarning
