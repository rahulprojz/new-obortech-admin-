import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'
import string from '../../utils/LanguageTranslation.js'
import { useState } from 'react'
import notify from '../../lib/notifier'

const ConfirmAccept = ({ isacceptopen, toggleClose, documentAcceptedUsers, project_event_id, item_id, _handleUserAction, user, userAction, event_type, acceptUserList, event_name }) => {
    const [isloading, setisloading] = useState(false)
    const _onSubmit = async () => {
        if (!acceptUserList?.find(({ user_id = '' }) => user_id == user.id)) {
            notify(string.event.userCannotAcceptEvent)
            return false
        }
        setisloading(true)
        await _handleUserAction(project_event_id, userAction, event_type, item_id, () => {}, event_name)
        if (documentAcceptedUsers.length > 0) {
            documentAcceptedUsers?.unshift({
                user: {
                    username: user.username,
                    id: user.id,
                    is_rejected: userAction === 'accept' ? '0' : '1',
                },
                organization_id: user.organization_id,
            })
        }
        setisloading(false)
        toggleClose()
    }

    let event_msg = ''
    if (userAction == 'accept' && event_type == 'event') {
        event_msg = string.event.acceptevent
    } else if (userAction == 'reject' && event_type == 'event') {
        event_msg = string.event.rejectevent
    } else if (userAction == 'accept' && event_type == 'document') {
        event_msg = string.event.acceptdocument
    } else if (userAction == 'reject' && event_type == 'document') {
        event_msg = string.event.rejectdocument
    }

    return (
        <Modal isOpen={isacceptopen} size={'md'} className='customModal' id='projectModal'>
            <ModalHeader toggle={toggleClose}></ModalHeader>
            <ModalBody>
                <>
                    <h5 className='text-center' id='addProjectStepTwoModal'>
                        {event_msg}
                    </h5>
                    <br />
                    <div className='row text-center'>
                        <div className='col'>
                            <LoaderButton type='button' isLoading={isloading} onClick={_onSubmit} cssClass='btn btn-primary' text={string.event.acceptyes} /> <LoaderButton type='button' onClick={toggleClose} cssClass='btn btn-primary' text={string.event.acceptno} />
                        </div>
                    </div>
                </>
            </ModalBody>
            <ModalFooter></ModalFooter>
        </Modal>
    )
}

ConfirmAccept.propTypes = {}
ConfirmAccept.defaultProps = {}

export default ConfirmAccept
