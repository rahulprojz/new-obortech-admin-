/**
 * This Modal is used both to Create and Edit the Item
 */
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import _ from 'lodash'
import Select from 'react-select'
import EventContext from '../../../store/event/eventContext'
import ItemAddEditContext from '../../../store/event/itemAddEditContext'
import QrCodeComponent from '../../item/QrCodeComponent'
import useReactSelectOptionObj from '../../../utils/customHooks/useReactSelectOptionObj'
import ItemModalSelectionDetails from './ItemModalSelectionDetails'
import Button from '../../common/form-elements/button/Button'
import LoaderButton from '../../common/form-elements/button/LoaderButton'
import string from '../../../utils/LanguageTranslation'
import ItemHook from './ItemHook'
import ConfirmationChangeValueModal from './ConfirmationChangeValueModal'
import { dynamicLanguageStringChange } from '../../../utils/globalFunc'

const CreateItemModal = ({ selectedProject, refetchProjectSelection }) => {
    const { modal, operation, setOperation, operator, availableIotDevices: allIoTDevice } = useContext(ItemAddEditContext)
    const { itemsNames, labels } = useContext(EventContext)
    const [warningDataInterval, setWarningDataInterval] = useState(false)
    const memoizedIotOptions = useMemo(() => {
        const { project_selections } = selectedProject
        const availableDevices = allIoTDevice.filter((device) => {
            return device.is_available || project_selections.some((select) => select.selection_devices.some((d) => d.device_id == device.id))
        })
        return useReactSelectOptionObj(availableDevices, 'deviceID')
    }, [allIoTDevice])
    const nameInputRef = useRef()
    const { toggle, isLoading, handleClick, addDeviceRow, deleteDeviceRow, qrModal, setQrModal, fetchItemDeviceDetails, selectedAllDevices, isConnectedIoTDevice, setIsConnectedIoTDevice, setSelectedAllDevices, handelSelect, handleDataIntervalChange, handleDeviceTagChange } = ItemHook(
        nameInputRef,
        selectedProject,
        labels,
    )

    useEffect(() => {
        if (itemsNames.selected?.value && operation == operator.EDIT) {
            fetchItemDeviceDetails()
        }
    }, [itemsNames])

    useEffect(() => {
        setWarningDataInterval(false)
        const deviceIndex = selectedAllDevices.findIndex((device) => device?.isFocus === true)
        const isDeviceAvailable = selectedProject?.project_selections?.filter((projectSelection) => projectSelection.selection_devices.some((device) => device.device_id == selectedAllDevices[deviceIndex]?.selectedIoTDevice?.value))
        // Data interval remove from UI
        // if (selectedAllDevices[deviceIndex]?.selectedIoTDevice && isDeviceAvailable.length && (selectedAllDevices[deviceIndex]?.isTouchedDataInterval === 'firstTime' || selectedAllDevices[deviceIndex]?.isTouchedDeviceTagVal === 'firstTime'))
        if (selectedAllDevices[deviceIndex]?.selectedIoTDevice && isDeviceAvailable.length && selectedAllDevices[deviceIndex]?.isTouchedDeviceTagVal === 'firstTime') {
            setWarningDataInterval(true)
        }
    }, [selectedAllDevices])
    return (
        <div>
            <Modal isOpen={modal} toggle={toggle} className='customModal' backdrop='static' size='lg' onExit={() => setOperation('')}>
                <ModalHeader toggle={toggle} cssModule={{ 'modal-title': 'modal-title text-dark font-weight-bold text-uppercase' }}>
                    {operation == operator.CREATE && dynamicLanguageStringChange(string.item.addItem, labels)}
                    {operation == operator.EDIT && dynamicLanguageStringChange(string.item.editItem, labels)}
                </ModalHeader>
                <ModalBody style={{ padding: '0px 20px' }}>
                    <ItemModalSelectionDetails selectedProject={selectedProject} />
                    <div className='row form-group'>
                        <div className='col-sm-10'>
                            {operation == operator.CREATE && <input type='text' ref={nameInputRef} className='form-control' name='itemName' />}
                            {operation == operator.EDIT && <span>{itemsNames?.selected?.label}</span>}
                        </div>
                        <div className='col-sm-2'>
                            {operation == operator.CREATE && (
                                <div onClick={() => setQrModal(true)} className='text-center' style={{ fontSize: '16px' }}>
                                    <i style={{ backgroundColor: '#e8e8e8', padding: '10px', color: 'gray', borderRadius: '5px' }} className='fas fa-qrcode' />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className='row form-group'>
                        <div className='col-sm-5'>
                            <label htmlFor='itemName' className='col-form-label'>
                                {string.event.connectIotDevice}:
                            </label>
                            <label style={{ marginLeft: '5px' }} className='radio-inline col-form-label'>
                                <input style={{ marginRight: '5px' }} checked={isConnectedIoTDevice == true} type='radio' name='radio-0' required onChange={() => setIsConnectedIoTDevice(true)} />
                                {string.event.acceptyes}
                            </label>
                            <label className='col-form-label radio-inline' style={{ marginLeft: '5px' }}>
                                <input
                                    style={{ marginRight: '5px' }}
                                    type='radio'
                                    name='radio-0'
                                    required
                                    checked={isConnectedIoTDevice == false}
                                    onChange={() => {
                                        setIsConnectedIoTDevice(false)
                                        setSelectedAllDevices([
                                            {
                                                selectedIoTDevice: null,
                                                selectedIoTDeviceTag: '',
                                                tempSelectedIoTDeviceTag: '',
                                                isTouchedDeviceTagVal: false,
                                                isFocus: false,
                                                customStyles: false,
                                                // Data interval remove from UI
                                                /* dataInterval: '',
                                                tempDataInterval: '',
                                                isTouchedDataInterval: false, */
                                            },
                                        ])
                                    }}
                                />
                                {string.event.acceptno}
                            </label>
                        </div>
                        <label htmlFor='itemName' className='col-form-label col-sm-5'>
                            {string.addTag}
                        </label>
                        {selectedAllDevices.map((device, deviceIndex) => (
                            <div className='row mb-2 w-100' key={deviceIndex}>
                                <div className='col-sm-5'>
                                    <Select options={memoizedIotOptions} value={device?.selectedIoTDevice} isClearable onChange={(selectedDevice) => handelSelect(selectedDevice, deviceIndex)} styles={device?.customStyles} isDisabled={!isConnectedIoTDevice} />
                                </div>
                                <div className='col-sm-5'>
                                    <input
                                        className='form-control'
                                        placeholder={string.tag}
                                        value={device?.selectedIoTDeviceTag}
                                        onChange={(event) => {
                                            const pattern = /^(?!.*["'`\\])/
                                            if (!pattern.test(event.target.value)) {
                                                notify(`${dynamicLanguageStringChange(string.invalidChar, labels)}`)
                                                return false
                                            }
                                            handleDeviceTagChange(event, deviceIndex)
                                        }}
                                        type='text'
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                {/* Data interval remove from UI */}
                                {/* <div className='col-sm-3'>
                                    <input className='form-control' placeholder='Minutes' value={device?.dataInterval} onChange={(event) => handleDataIntervalChange(event, deviceIndex)} type='number' style={{ width: '100%' }} />
                                </div> */}
                                {selectedAllDevices.length > 1 && (
                                    <span className='col-sm-1 pt-2' onClick={() => deleteDeviceRow(deviceIndex)} style={{ cursor: 'pointer', maxWidth: '16px' }}>
                                        <i className='fa fa-trash' />
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className='text-center'>
                        <Button className='btn border' onClick={addDeviceRow}>
                            <i className='fas fa-plus fa-sm' />
                        </Button>
                    </div>
                    {warningDataInterval && <ConfirmationChangeValueModal modal={warningDataInterval} selectedAllDevices={selectedAllDevices} setSelectedAllDevices={setSelectedAllDevices} setWarningDataInterval={setWarningDataInterval} />}
                </ModalBody>
                <ModalFooter className='justify-content-center'>
                    <LoaderButton
                        isLoading={isLoading}
                        onClick={async () => {
                            await handleClick()
                            refetchProjectSelection()
                        }}
                        text={string.project.submit}
                    />
                </ModalFooter>
            </Modal>
            {qrModal && <QrCodeComponent usedTo='create' />}
        </div>
    )
}

export default CreateItemModal
