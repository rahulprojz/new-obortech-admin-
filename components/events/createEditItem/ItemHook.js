import { useContext, useState } from 'react'
import _ from 'lodash'
import { addItem, updateItem, addItemToProject, updateItemDevice, fetchItemDevice } from '../../../lib/api/item'
import notify from '../../../lib/notifier'
import string from '../../../utils/LanguageTranslation'
import EventContext from '../../../store/event/eventContext'
import ItemAddEditContext from '../../../store/event/itemAddEditContext'
import QrCodeContext from '../../../store/event/qrCodeContext'
import { fetchDeviceInterval, fetchProjectDevice } from '../../../lib/api/device'
import { dynamicLanguageStringChange } from '../../../utils/globalFunc'

function ItemHook(nameInputRef, selectedProject) {
    const [isLoading, setIsLoading] = useState(false)
    const [isConnectedIoTDevice, setIsConnectedIoTDevice] = useState(false)
    const [selectedAllDevices, setSelectedAllDevices] = useState([
        {
            selectedIoTDevice: null,
            selectedIoTDeviceTag: '',
            tempSelectedIoTDeviceTag: '',
            tempDataInterval: '',
            isTouchedDeviceTagVal: false,
            isFocus: false,
            customStyles: false,
            // Data interval remove from UI
            // dataInterval: '',
            // isTouchedDataInterval: false,
        },
    ])
    const { selectedGroup, selectedTruck, selectedContainer, itemsNames, dispatchItemsNames, setLastItemUpdatedAt, labels } = useContext(EventContext)
    const { setModal, operation, operator, availableIotDevices: allIoTDevice } = useContext(ItemAddEditContext)
    const { modal: qrModal, setModal: setQrModal, setQrCodeValue, qrCodeValue } = useContext(QrCodeContext)

    const toggle = () => {
        setModal((prev) => !prev)
        setQrCodeValue(null)
    }

    const updateAvailableItemsWithNewItem = (newItem) => {
        const newAvailableItem = itemsNames.available.concat({ value: newItem.id, label: newItem.itemID })
        dispatchItemsNames({ type: 'concatAvailable', payload: { available: newAvailableItem } })
    }

    const updateNewSelectedItem = (newItem) => {
        dispatchItemsNames({ type: 'onSelect', payload: { selected: { value: newItem.id, label: newItem.itemID } } })
    }

    const fetchItemDeviceDetails = async () => {
        setIsConnectedIoTDevice(false)
        const deviceDetails = await fetchItemDevice({ project_id: selectedProject.id, item_id: itemsNames.selected?.value })
        if (deviceDetails.deviceDetails?.length) {
            setIsConnectedIoTDevice(true)
            const allDevices = []
            const projectDevices = await fetchProjectDevice({ project_id: selectedProject.id })
            deviceDetails.deviceDetails.map((deviceDatas) => {
                const customStyles = {
                    singleValue: (provided, state) => {
                        const device = projectDevices.filter((elem) => elem == deviceDatas?.device_id)
                        const checkedColor = device.length > 1 ? 'blue' : 'inherit'
                        return {
                            ...provided,
                            color: checkedColor,
                        }
                    },
                }
                allDevices.push({
                    selectedIoTDevice: { value: deviceDatas?.device_id, label: deviceDatas?.device?.deviceID },
                    selectedIoTDeviceTag: deviceDatas?.device?.tag,
                    tempSelectedIoTDeviceTag: '',
                    tempDataInterval: '',
                    isTouchedDeviceTagVal: false,
                    customStyles,
                    // Data interval remove from UI
                    // dataInterval: deviceDatas?.data_interval,
                    // isTouchedDataInterval: false,
                })
            })
            setSelectedAllDevices(allDevices)
        }
    }

    const handleAddItem = async () => {
        try {
            if (!nameInputRef.current.value.trim()) {
                notify(dynamicLanguageStringChange(string.enterItemName, labels))
                return false
            }
            if (!qrCodeValue) {
                notify(string.createQrCode)
                return false
            }
            const pattern = /^(?!.*["'`\\])/
            if (!pattern.test(nameInputRef.current.value)) {
                notify(`${dynamicLanguageStringChange(string.invalidChar, labels)}`)
                return false
            }

            setIsLoading((prev) => !prev)

            const item = await addItem({
                itemID: nameInputRef.current.value,
                qr_code: qrCodeValue,
                is_available: 0,
            })
            if (item.itemAlreadyExists) {
                notify(dynamicLanguageStringChange(string.project.itemAlreadyExists, labels))
            } else {
                const devices = []
                selectedAllDevices.map((device) => {
                    if (device.selectedIoTDevice) {
                        // Data interval remove from UI
                        // devices.push({ label: device.selectedIoTDevice?.label, value: device.selectedIoTDevice?.value, tag: device.selectedIoTDeviceTag, data_interval: device.dataInterval })
                        devices.push({ label: device.selectedIoTDevice?.label, value: device.selectedIoTDevice?.value, tag: device.selectedIoTDeviceTag.trim() })
                    }
                })
                const newItemAdded = await addItemToProject({
                    project_id: selectedProject.id,
                    group_id: selectedGroup || 1,
                    truck_id: selectedTruck || 1,
                    container_id: selectedContainer,
                    item_id: item.id,
                    devices,
                })
                if (newItemAdded?.success) {
                    updateAvailableItemsWithNewItem(item)
                    updateNewSelectedItem(item)
                }
                setLastItemUpdatedAt(new Date())
                setModal((prev) => !prev)
                setQrCodeValue(null)
            }
        } catch (err) {
            notify({ error: err.message || err.toString() })
        }
        setIsLoading((prev) => !prev)
    }

    const handleUpdateItem = async () => {
        try {
            setIsLoading((prev) => !prev)
            if (qrCodeValue) {
                await updateItem({ qr_code: qrCodeValue })
            }
            // Data interval remove from UI
            // const dataIntervalIsEmpty = selectedAllDevices.every((device) => {
            //     return (!!_.get(device, 'selectedIoTDevice.value') && _.get(device, 'dataInterval')) || !_.get(device, 'selectedIoTDevice.value')
            // })
            // if (dataIntervalIsEmpty || !isConnectedIoTDevice) {
            const devices = []
            selectedAllDevices.map((device) => {
                if (device.selectedIoTDevice) {
                    devices.push({ label: device.selectedIoTDevice?.label, value: device.selectedIoTDevice?.value, tag: device.selectedIoTDeviceTag.trim() })
                }
            })
            await updateItemDevice({
                project_id: selectedProject.id,
                item_id: itemsNames?.selected?.value,
                devices,
            })
            setModal((prev) => !prev)
            setQrCodeValue(null)
            setLastItemUpdatedAt(new Date())
        } catch (err) {
            notify({ error: err.message || err.toString() })
        }
        setIsLoading((prev) => !prev)
    }

    const handleClick = async () => {
        if (operation == operator.CREATE) {
            await handleAddItem()
        } else {
            await handleUpdateItem()
        }
    }

    const handelSelect = async (selectedDevice, selectedDeviceId) => {
        const itemAlreadyExists = []
        if (selectedDevice === null) {
            const allDevices = [...selectedAllDevices]
            allDevices[selectedDeviceId].selectedIoTDevice = null
            allDevices[selectedDeviceId].selectedIoTDeviceTag = ''
            allDevices[selectedDeviceId].customStyles = false
            allDevices[selectedDeviceId].isTouchedDeviceTagVal = false
            // Data interval remove from UI
            // allDevices[selectedDeviceId].dataInterval = ''
            // allDevices[selectedDeviceId].isTouchedDataInterval = false
            setSelectedAllDevices(allDevices)
        } else {
            selectedAllDevices.map((device, deviceId) => {
                if (deviceId !== selectedDeviceId) {
                    itemAlreadyExists.push(!!(device?.selectedIoTDevice?.value === selectedDevice?.value))
                }
            })
            const allDevices = [...selectedAllDevices]
            allDevices[selectedDeviceId].selectedIoTDevice = selectedDevice
            // Data interval remove from UI
            // allDevices[selectedDeviceId].isTouchedDataInterval = false
            allDevices[selectedDeviceId].customStyles = false
            allDevices[selectedDeviceId].isTouchedDeviceTagVal = false
            setSelectedAllDevices(allDevices)
        }
        try {
            if (!itemAlreadyExists.includes(true)) {
                if (selectedDevice) {
                    const projectDevices = await fetchProjectDevice({ project_id: selectedProject.id })
                    const deviceDetails = await fetchDeviceInterval({ project_id: selectedProject.id, device_id: selectedDevice?.value })
                    if (deviceDetails.length > 0) {
                        const customStyles = {
                            singleValue: (provided) => {
                                const device = projectDevices.filter((elem) => elem == selectedDevice?.value)
                                const checkedColor = device.length > 0 ? 'blue' : 'inherit'
                                return {
                                    ...provided,
                                    color: checkedColor,
                                }
                            },
                        }
                        const tempDevices = [...selectedAllDevices]
                        tempDevices[selectedDeviceId].selectedIoTDeviceTag = deviceDetails[0]?.selection_devices[0]?.device?.tag
                        tempDevices[selectedDeviceId].customStyles = customStyles
                        tempDevices[selectedDeviceId].isTouchedDeviceTagVal = false
                        // Data interval remove from UI
                        // tempDevices[selectedDeviceId].dataInterval = deviceDetails[0]?.selection_devices[0]?.data_interval
                        // tempDevices[selectedDeviceId].isTouchedDataInterval = false
                        setSelectedAllDevices(tempDevices)
                    } else {
                        const deviceData = allIoTDevice.find((device) => device.id === selectedDevice.value)
                        const tempDevices = [...selectedAllDevices]
                        tempDevices[selectedDeviceId].selectedIoTDeviceTag = deviceData?.tag
                        tempDevices[selectedDeviceId].customStyles = false
                        tempDevices[selectedDeviceId].isTouchedDeviceTagVal = false
                        // Data interval remove from UI
                        // tempDevices[selectedDeviceId].dataInterval = ''
                        // tempDevices[selectedDeviceId].isTouchedDataInterval = false
                        setSelectedAllDevices(tempDevices)
                    }
                }
            } else {
                notify(string.errors.deviceAlreadyExist)
                const allDevices = [...selectedAllDevices]
                allDevices[selectedDeviceId].selectedIoTDevice = null
                allDevices[selectedDeviceId].selectedIoTDeviceTag = ''
                allDevices[selectedDeviceId].customStyles = false
                allDevices[selectedDeviceId].isTouchedDeviceTagVal = false
                // Data interval remove from UI
                // tempDevices[selectedDeviceId].dataInterval = ''
                // tempDevices[selectedDeviceId].isTouchedDataInterval = false
                setSelectedAllDevices(allDevices)
            }
        } catch (error) {
            console.log(error)
        }
    }

    // Data interval remove from UI
    // const handleDataIntervalChange = (event, deviceId) => {
    //     const tempDevices = [...selectedAllDevices]
    //     tempDevices.map((device, deviceIndex) => {
    //         device.isFocus = deviceIndex === deviceId
    //     })
    //     if (!tempDevices[deviceId]?.isTouchedDataInterval) {
    //         tempDevices[deviceId].isTouchedDataInterval = 'firstTime'
    //         tempDevices[deviceId].tempDataInterval = event.target.value
    //     } else {
    //         tempDevices[deviceId].dataInterval = event.target.value
    //         tempDevices[deviceId].isTouchedDataInterval = 'touchedOther'
    //     }
    //     setSelectedAllDevices(tempDevices)
    // }

    const handleDeviceTagChange = (event, deviceId) => {
        const tempDevices = [...selectedAllDevices]
        tempDevices.map((device, deviceIndex) => {
            device.isFocus = deviceIndex === deviceId
        })
        if (!tempDevices[deviceId]?.isTouchedDeviceTagVal) {
            tempDevices[deviceId].isTouchedDeviceTagVal = 'firstTime'
            tempDevices[deviceId].tempSelectedIoTDeviceTag = event.target.value
        } else {
            tempDevices[deviceId].selectedIoTDeviceTag = event.target.value
            tempDevices[deviceId].isTouchedDeviceTagVal = 'touchedOther'
        }
        setSelectedAllDevices(tempDevices)
    }

    const addDeviceRow = () => {
        // Data interval remove from UI
        // setSelectedAllDevices((allDevice) => [...allDevice, { selectedIoTDevice: null, selectedIoTDeviceTag: '', dataInterval: '', tempSelectedIoTDeviceTag: '', tempDataInterval: '', customStyles: false }])
        setSelectedAllDevices((allDevice) => [...allDevice, { selectedIoTDevice: null, selectedIoTDeviceTag: '', tempSelectedIoTDeviceTag: '', tempDataInterval: '', customStyles: false }])
    }

    const deleteDeviceRow = (index) => {
        const tempDevices = [...selectedAllDevices]
        tempDevices.splice(index, 1)
        setSelectedAllDevices(tempDevices)
    }

    return {
        toggle,
        isLoading,
        handleClick,
        addDeviceRow,
        deleteDeviceRow,
        qrModal,
        setQrModal,
        fetchItemDeviceDetails,
        selectedAllDevices,
        isConnectedIoTDevice,
        setIsConnectedIoTDevice,
        setSelectedAllDevices,
        handelSelect,
        // Data interval remove from UI
        // handleDataIntervalChange,
        handleDeviceTagChange,
    }
}

export default ItemHook
