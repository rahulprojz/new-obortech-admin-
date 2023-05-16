import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import { dynamicLanguageStringChange } from '../../../utils/globalFunc'
import string from '../../../utils/LanguageTranslation'

const ConfirmationChangeIntervalModal = ({ modal, setWarningDataInterval, selectedAllDevices, setSelectedAllDevices }) => {
    const deviceIndex = selectedAllDevices.findIndex((device) => device?.isFocus === true)
    const changeInterval = selectedAllDevices[deviceIndex]?.isTouchedDataInterval === 'firstTime'
    const toggle = () => {
        setWarningDataInterval(false)
        const tempDevices = [...selectedAllDevices]
        if (changeInterval) {
            tempDevices[deviceIndex].isTouchedDataInterval = false
        } else {
            tempDevices[deviceIndex].isTouchedDeviceTagVal = false
        }
        setSelectedAllDevices(tempDevices)
    }
    const handleChange = () => {
        setWarningDataInterval(false)
        const tempDevices = [...selectedAllDevices]
        if (changeInterval) {
            tempDevices[deviceIndex].isTouchedDataInterval = 'touchedOther'
            tempDevices[deviceIndex].dataInterval = tempDevices[deviceIndex]?.tempDataInterval
        } else {
            tempDevices[deviceIndex].isTouchedDeviceTagVal = 'touchedOther'
            tempDevices[deviceIndex].selectedIoTDeviceTag = tempDevices[deviceIndex]?.tempSelectedIoTDeviceTag
        }
        setSelectedAllDevices(tempDevices)
    }

    return (
        <div>
            <Modal isOpen={modal} toggle={toggle} className='customModal' onExit={() => {}}>
                <ModalHeader toggle={toggle} cssModule={{ 'modal-title': 'modal-title text-dark font-weight-bold' }}>
                    Are you Sure?
                </ModalHeader>
                <ModalBody style={{ padding: '0px 20px' }}>{dynamicLanguageStringChange(string.event.mayChangeDeviceInterval, {field: changeInterval ? 'data interval' : 'tag'})}</ModalBody>
                <ModalFooter className='justify-content-center'>
                    <button className='btn btn-primary' onClick={handleChange}>
                        Yes
                    </button>
                    <button className='btn btn-primary' onClick={toggle}>
                        No
                    </button>
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default ConfirmationChangeIntervalModal
