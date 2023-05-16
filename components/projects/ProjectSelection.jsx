import { useMemo, useState } from 'react'
import { find, get, some, map, filter, isBoolean } from 'lodash'
import CustomSelect from '../common/form-elements/select/CustomSelect'
import Input from '../common/form-elements/input/Input'
import string from '../../utils/LanguageTranslation'
import FormHelperMessage from '../common/form-elements/formHelperMessage'
import ProjectAlertsModel from './ProjectAlerts'
import notify from '../../lib/notifier'
import Button from '../common/form-elements/button/Button'
import { fetchDeviceInterval } from '../../lib/api/device'
import { otherLanguage } from '../../utils/selectedLanguage.js'
import { dynamicLanguageStringChange } from '../../utils/globalFunc'
import './ProjectSelection.css'

const ProjectSelection = ({ formik, selectionAllList, updateSelectionAllList, i, state, setState, selection, project_selections, projectalerttype, labels, mode, selectedTab, initialItems, shouldDisabled }) => {
    const preSelection = project_selections && project_selections[i] ? project_selections[i] : []
    // Below Common name declare for label name depends on language.
    const group3 = otherLanguage && labels.local_group3 ? labels.local_group3 : labels.group3
    const group2 = otherLanguage && labels.local_group2 ? labels.local_group2 : labels.group2
    const group1 = otherLanguage && labels.local_group1 ? labels.local_group1 : labels.group1
    const item = otherLanguage && labels.local_item ? labels.local_item : labels.item
    const [isOpen, setIsOpen] = useState(false)
    const [stateObj, setStateObj] = useState({
        projectType: '',
        projectSelectionId: '',
        selectedDevcieID: '',
    })
    const updateStateObj = (key, value) => {
        setStateObj((preState) => ({
            ...preState,
            [key]: value,
        }))
    }
    const openModal = (type, selectedId, device_id) => {
        if (projectalerttype === false) {
            setIsOpen(true)
            setStateObj({
                projectType: type,
                projectSelectionId: selectedId,
                device_id,
            })
        }
    }

    const close = () => {
        updateStateObj('setProjectType', '')
        setIsOpen(!isOpen)
    }

    const verifyifsametruckgrpexists = (type, value, selections) => {
        if (type == 'truck') {
            const truckExistsornot = find(selections, (item) => item.truck_id == value)
            let truckexistsdiffgrp = false
            if (truckExistsornot && selections[i].group_id != truckExistsornot.group_id) {
                truckexistsdiffgrp = true
            }
            return truckexistsdiffgrp
        }
    }

    let disabled = false
    if (mode === 'edit' && selectedTab === 'PROJECT_LISTING') {
        disabled = true
    }

    const validateItem = (cSelection, selections, index) => {
        const { item_id } = cSelection
        const isUsedItem = selections.find((sel, si) => si != index && sel.item_id == item_id)
        if (isUsedItem && item_id) {
            formik.setFieldError(`item_id_${index}`, dynamicLanguageStringChange(string.project.itemAlreadyInUse, labels))
        }
    }
    const validateContainer = (cSelection, selections, index) => {
        const { container_id, truck_id } = cSelection
        const isUsedContainer = selections.find((sel, si) => si != index && sel.container_id == container_id && sel.truck_id != truck_id)
        if (isUsedContainer && container_id) {
            formik.setFieldError(`container_id_${index}`, dynamicLanguageStringChange(string.project.group1AlreadyInUse, labels))
        }
    }
    const validateTruck = (cSelection, selections, index) => {
        const { truck_id } = cSelection

        const truckExists = truck_id != '1' ? verifyifsametruckgrpexists('truck', truck_id, selections) : false

        if (truckExists && truck_id) {
            formik.setFieldError(`truck_id_${index}`, dynamicLanguageStringChange(string.project.group2AlreadyExistsgroup3, labels))
        }
    }
    const validateGroup = (cSelection, selections, index) => {}

    const validateSelection = (type, index) => {
        try {
            const activeSelection = formik.values.selections[index]
            if (activeSelection) {
                setTimeout(() => {
                    switch (type) {
                        case 'item': {
                            validateItem(activeSelection, formik.values.selections, index)
                        }
                        case 'container': {
                            validateItem(activeSelection, formik.values.selections, index)
                            validateContainer(activeSelection, formik.values.selections, index)
                        }
                        case 'truck': {
                            validateItem(activeSelection, formik.values.selections, index)
                            validateContainer(activeSelection, formik.values.selections, index)
                            validateTruck(activeSelection, formik.values.selections, index)
                        }
                        case 'group': {
                            validateItem(activeSelection, formik.values.selections, index)
                            validateContainer(activeSelection, formik.values.selections, index)
                            validateTruck(activeSelection, formik.values.selections, index)
                            validateGroup(activeSelection, formik.values.selections, index)
                        }
                        default: {
                        }
                    }
                }, 300)
            }
        } catch (err) {
            console.log(err)
        }
    }

    useMemo(() => {
        validateSelection('group', i)
    }, [JSON.stringify(formik.values.selections), projectalerttype])
    return (
        <>
            {
                <tr key={i} style={shouldDisabled ? { cursor: 'not-allowed' } : {}}>
                    <td className='projectGroup mr-3 projectVerticalTop'>
                        <div className='d-block'>
                            <div className='d-flex borderProject rounded align-items-center'>
                                <CustomSelect
                                    className='border-0 form-control projectSelect disableCheck'
                                    disabled={selection.disableGroup || shouldDisabled}
                                    value={selection.group_id}
                                    onChange={(event) => {
                                        delete formik.errors[`group_id_${i}`]
                                        const { selections } = formik.values
                                        const ifExists = find(selections, (item) => {
                                            if (item.group_id == event.target.value && item.selectionTemperatureArray.some((temp) => temp.changed_selection == '1') && item.selectionTemperatureArray.some((temp) => temp.selectionId == '1')) {
                                                return true
                                            }
                                            return false
                                        })
                                        if (ifExists) {
                                            selections[i].projectselectiontype = 'group'
                                        } else {
                                            selections[i].projectselectiontype = ''
                                        }
                                        // selections[i].truck_id = '1'
                                        formik.setFieldError(`truck_id_${i}`, '')
                                        selections[i].group_id = parseInt(event.target.value)
                                        if (!event.target.value) {
                                            formik.setFieldError(`group_id_${i}`, `${group3} ${string.errors.required}`)
                                        } else {
                                            formik.setFieldValue('selections', selections)
                                            validateSelection('group', i)
                                        }
                                    }}
                                    name={`group_id_${i}`}
                                >
                                    <option value=''> {string.project.selectOne}</option>
                                    {selectionAllList.groups.map((group, i) => {
                                        return (
                                            <option key={i} value={group.id}>
                                                {group.id == 1 ? dynamicLanguageStringChange(string.noGroup3, { group3 }) : group.groupID}
                                            </option>
                                        )
                                    })}
                                </CustomSelect>
                                {!projectalerttype && !shouldDisabled && formik.values.selections[i].group_id != 1 && (
                                    <a
                                        className='btn border-left p-1'
                                        onClick={() => {
                                            if (!selection.selectionTemperatureArray.length || (selection.selectionTemperatureArray?.some((alert) => alert.selectionId == '1' || alert.selectionId == '') && selection.group_id != '1')) {
                                                openModal('group', 1)
                                            }
                                        }}
                                    >
                                        <i
                                            className={`fas fa-ellipsis-v  ${stateObj.projectType == 'group' || selection.selectionTemperatureArray?.some((alert) => alert.selectionId == '1') ? 'iconColorShow' : 'iconColor'} ${
                                                projectalerttype || selection.group_id == '1' ? 'projectedithide' : 'enabled'
                                            }`}
                                        />
                                    </a>
                                )}
                            </div>
                        </div>

                        {formik.errors[`group_id_${i}`] ? <FormHelperMessage className='err' message={formik.errors[`group_id_${i}`]} /> : null}
                    </td>

                    {/* truck column */}
                    <td className='projectGroup mr-3 projectVerticalTop'>
                        <div className='d-flex borderProject rounded align-items-center'>
                            <CustomSelect
                                disabled={selection.disableTruck || shouldDisabled}
                                className='border-0 form-control projectSelect'
                                onChange={(event) => {
                                    delete formik.errors[`truck_id_${i}`]
                                    const { selections } = formik.values
                                    const truckExists = event.target.value != '1' ? verifyifsametruckgrpexists('truck', event.target.value, selections) : false
                                    selections[i].truck_id = parseInt(event.target.value)
                                    selections[i].disableGroup = true
                                    const ifExists = find(selections, (item) => {
                                        if (item?.truck_id && item?.selectionTemperatureArray?.some((temp) => temp.changed_selection == '1') && item?.selectionTemperatureArray?.some((temp) => temp.selectionId == '2')) {
                                            return true
                                        }
                                        return false
                                    })
                                    if (ifExists) {
                                        selections[i].projectselectiontype = 'truck'
                                    } else {
                                        selections[i].projectselectiontype = ''
                                    }

                                    if (!event.target.value) {
                                        formik.setFieldError(`truck_id_${i}`, `${group2} ${string.errors.required}`)
                                    } else if (truckExists) {
                                        selections[i].disableGroup = false
                                        formik.setFieldError(`truck_id_${i}`, dynamicLanguageStringChange(string.project.group2AlreadyExistsgroup3, labels))
                                    } else {
                                        if (event.target.value && event.target.value != 1) {
                                            selections[i].disableGroup = false
                                        } else {
                                            selections[i].group_id = 1
                                            selections[i].disableGroup = true
                                        }
                                        formik.setFieldValue('selections', selections)
                                        validateSelection('truck', i)
                                    }

                                    const { container_id } = selections[i]
                                    // const isUsedContainer = selections.findIndex((sel, si) => si !== i && sel.container_id == container_id && sel.truck_id != event.target.value)
                                    // if (isUsedContainer > -1) {
                                    //     selections[i].container_id = ''
                                    // }
                                }}
                                value={selection.truck_id}
                                name={`truck_id_${i}`}
                            >
                                <option value=''>{string.project.selectOne}</option>
                                {selectionAllList.trucks.map((truck, i) => {
                                    const array = project_selections ? project_selections.filter((sel) => sel.truck_id === truck.id) : []
                                    if (truck.is_available || array.length > 0 || truck.truckID == 'No Group 2') {
                                        return (
                                            <option key={i} value={truck.id}>
                                                {truck.id == 1 ? dynamicLanguageStringChange(string.noGroup2, { group2 }) : truck.truckID}
                                            </option>
                                        )
                                    }
                                })}
                            </CustomSelect>
                            {!projectalerttype && !shouldDisabled && formik.values.selections[i].truck_id != 1 && (
                                <a
                                    className='btn border-left p-1'
                                    onClick={() => {
                                        if (!selection.selectionTemperatureArray.length || (selection.selectionTemperatureArray?.some((alert) => alert.selectionId == '2' || alert.selectionId == '') && selection.truck_id != '1')) {
                                            openModal('truck', 2)
                                        }
                                    }}
                                >
                                    <i
                                        className={`fas fa-ellipsis-v ${stateObj.projectType == 'truck' || selection.selectionTemperatureArray?.some((alert) => alert.selectionId == '2') ? 'iconColorShow' : 'iconColor'} ${
                                            projectalerttype || selection.truck_id == '1' ? 'projectedithide' : 'enabled'
                                        }`}
                                    />
                                </a>
                            )}
                        </div>
                        {formik.errors[`truck_id_${i}`] ? <FormHelperMessage className='err' message={formik.errors[`truck_id_${i}`]} /> : null}
                    </td>
                    {/* container column */}
                    <td className='projectGroup mr-3 projectVerticalTop'>
                        <div className='d-flex borderProject rounded align-items-center'>
                            <CustomSelect
                                disabled={selection.disableContainer || shouldDisabled}
                                className='border-0 form-control projectSelect'
                                value={selection.container_id}
                                onChange={(event) => {
                                    delete formik.errors[`container_id_${i}`]
                                    const { selections } = formik.values
                                    selections[i].container_id = parseInt(event.target.value)
                                    selections[i].disableTruck = true

                                    if (!event.target.value) {
                                        formik.setFieldError(`container_id_${i}`, `${group1} ${string.errors.required}`)
                                    } else if (event.target.value) {
                                        const { truck_id } = selections[i]
                                        const isUsedContainer = selections.findIndex((sel, si) => si !== i && sel.container_id == event.target.value && sel.truck_id != truck_id)
                                        if (isUsedContainer > -1) {
                                            selections[i].disableTruck = false
                                            formik.setFieldError(`container_id_${i}`, dynamicLanguageStringChange(string.project.group1AlreadyInUse, labels))
                                        } else {
                                            selections[i].disableTruck = false
                                            formik.setFieldValue('selections', selections)
                                            validateSelection('container', i)
                                        }
                                    }
                                }}
                                name={`container_id_${i}`}
                            >
                                <option value=''>{string.project.selectOne}</option>
                                {selectionAllList.containers.map((container, i) => {
                                    const array = project_selections ? project_selections.filter((sel) => sel.container_id === container.id) : []
                                    if (container.is_available || array.length > 0 || preSelection.container_id == container.id) {
                                        return (
                                            <option key={i} value={container.id}>
                                                {container.containerID}
                                            </option>
                                        )
                                    }
                                })}
                            </CustomSelect>
                            {!projectalerttype && !shouldDisabled && (
                                <a
                                    className='btn border-left p-1'
                                    onClick={() => {
                                        if (!selection.selectionTemperatureArray.length || selection.selectionTemperatureArray?.some((alert) => alert.selectionId == '3' || alert.selectionId == '')) {
                                            openModal('container', 3)
                                        }
                                    }}
                                >
                                    <i className={`fas fa-ellipsis-v ${stateObj.projectType == 'container' || selection.selectionTemperatureArray?.some((alert) => alert.selectionId == '3') ? 'iconColorShow' : 'iconColor'} ${projectalerttype ? 'projectedithide' : 'enabled'}`} />
                                </a>
                            )}
                        </div>
                        {formik.errors[`container_id_${i}`] ? <FormHelperMessage className='err' message={formik.errors[`container_id_${i}`]} /> : null}
                    </td>
                    {/* item column */}
                    <td className='projectGroup projectVerticalTop'>
                        <div className='d-flex borderProject rounded align-items-center'>
                            <CustomSelect
                                disabled={shouldDisabled}
                                className='border-0 form-control projectSelect'
                                onChange={(event) => {
                                    delete formik.errors[`item_id_${i}`]
                                    const { selections } = formik.values
                                    const ifExists = find(selections, (item) => item.item_id == event.target.value)
                                    selections[i].item_id = parseInt(event.target.value)
                                    selections[i].item_is_start = null
                                    selections[i].item_start_date_time = null
                                    selections[i].disableContainer = true

                                    if (ifExists) {
                                        selections[i].disableContainer = false
                                        formik.setFieldError(`item_id_${i}`, dynamicLanguageStringChange(string.project.itemAlreadyInUse, labels))
                                    } else if (!event.target.value) {
                                        formik.setFieldError(`item_id_${i}`, `${item} ${string.errors.required}`)
                                    } else {
                                        selections[i].disableContainer = false
                                        formik.setFieldValue('selections', selections)
                                        validateSelection('item', i)
                                    }
                                }}
                                value={selection.item_id}
                                name={`item_id_${i}`}
                            >
                                <option value=''>{string.project.selectOne}</option>
                                {selectionAllList.items.map((item, j) => {
                                    const array = project_selections ? project_selections.filter((sel) => sel.item_id === item.id) : []
                                    if (item.is_available || array.length > 0 || preSelection.item_id == item.id) {
                                        const { selections } = formik.values
                                        const ifExists = find(selections, (sel) => sel.item_id == item.id)
                                        if (typeof ifExists == 'undefined' || selections[i].item_id == item.id) {
                                            return (
                                                <option key={j} value={item.id}>
                                                    {item.itemID}
                                                </option>
                                            )
                                        }
                                    }
                                })}
                            </CustomSelect>
                        </div>
                        {formik.errors[`item_id_${i}`] ? <FormHelperMessage className='err' message={formik.errors[`item_id_${i}`]} /> : null}
                    </td>

                    <td className='projectGroup  mr-3 projectVerticalTop'>
                        {map(selection.devices, (device, j) => {
                            const { selections } = formik.values
                            const isDeviceUsedByOthers = filter(selections, (selections, si) => {
                                if (si != i) {
                                    return some(selections.devices, (dev) => dev.device_id && dev.device_id == device.device_id)
                                }
                                return null
                            })
                            if (isDeviceUsedByOthers.length) {
                                if (!Array.isArray(selections[i].isDeviceUsedByOthers)) {
                                    selections[i].isDeviceUsedByOthers = []
                                }
                                selections[i].isDeviceUsedByOthers[j] = !!isDeviceUsedByOthers
                            } else if (get(selections, `${i}.isDeviceUsedByOthers.${j}`)) {
                                selections[i].isDeviceUsedByOthers[j] = false
                            }

                            // Data interval remove from UI
                            // const updateDeviceIntreval = async (device_id, project_id) => {
                            //     const selectedDevice = selectionAllList.devices.find((dev) => dev.id == device_id)
                            //     if (selectedDevice?.data_interval) {
                            //         selections[i].devices[j].data_interval = selectedDevice.data_interval
                            //     } else {
                            //         const deviceIntreval = await fetchDeviceInterval({ device_id, project_id })
                            //         if (deviceIntreval.length) {
                            //             selections[i].devices[j].data_interval = deviceIntreval[0].selection_devices[0].data_interval
                            //         } else {
                            //             selections[i].devices[j].data_interval = 1
                            //         }
                            //     }
                            //     formik.setFieldValue('selections', selections)
                            // }

                            return (
                                <div className='row' key={j}>
                                    <div className='col-6 pl-0 mb-2'>
                                        <div className='d-flex borderProject rounded align-items-center'>
                                            <CustomSelect
                                                onChange={(event) => {
                                                    delete formik.errors[`device_id_${i}`]
                                                    let ifExists
                                                    const deviceAlreadyExist = selection.devices.filter((selectedDevice) => selectedDevice.device_id == event.target.value)
                                                    if (deviceAlreadyExist.length) {
                                                        notify(string.deviceAlreadySelected)
                                                    } else {
                                                        if (!Array.isArray(selections[i].isDeviceUsedByOthers)) {
                                                            selections[i].isDeviceUsedByOthers = []
                                                        }
                                                        if (event.target.value) {
                                                            ifExists = some(selections, (item) => find(item.devices, (device) => device.device_id == event.target.value))
                                                            selections[i].isDeviceUsedByOthers[j] = !!ifExists
                                                        } else if (selections[i].isDeviceUsedByOthers[j]) {
                                                            selections[i].isDeviceUsedByOthers[j] = false
                                                        }
                                                        ifExists = selections.findIndex((sel) => sel.devices.findIndex((item, si) => si !== i && item.device_id == selections[i].device_id) > -1)
                                                        selections[i].devices[j].device_id = parseInt(event.target.value)
                                                        const selectedDevice = selectionAllList.devices.filter((device) => device.id == event.target.value)

                                                        selections[i].devices[j].tag = selectedDevice[0]?.tag || ''
                                                        formik.setFieldValue('selections', selections)
                                                        validateSelection('group', i)
                                                    }
                                                }}
                                                value={device.device_id}
                                                disabled={shouldDisabled}
                                                name={`device_id_${i}`}
                                                style={{ color: get(selection, `isDeviceUsedByOthers.${j}`) ? 'blue' : '' }}
                                                className='border-0 form-control projectSelect'
                                            >
                                                <option style={{ color: '#6e707e' }} value=''>
                                                    {string.project.selectOne}
                                                </option>
                                                {selectionAllList.devices.map((device, i) => {
                                                    const array = project_selections ? project_selections.filter((sel) => sel.devices?.some((dev) => dev.device_id === device.id)) : []
                                                    if (device.is_available || array.length > 0 || preSelection?.devices?.some((dev) => dev.device_id === device.id)) {
                                                        return (
                                                            <option key={i} style={{ color: '#6e707e' }} value={device.id}>
                                                                {device.deviceID}
                                                            </option>
                                                        )
                                                    }
                                                })}
                                            </CustomSelect>
                                            {!projectalerttype && !shouldDisabled && (
                                                <a
                                                    className='btn border-left p-1'
                                                    onClick={() => {
                                                        if (!selection.selectionTemperatureArray.length || (selection.selectionTemperatureArray?.some((alert) => alert.selectionId == '5' || alert.selectionId == '') && selections[i].devices[j].device_id)) {
                                                            openModal('device', 5, selections[i].devices[j].device_id)
                                                        }
                                                    }}
                                                >
                                                    <i className={`fas fa-ellipsis-v ${stateObj.projectType == 'device' || selection.selectionTemperatureArray?.some((alert) => alert.selectionId == '5') ? 'iconColorShow' : 'iconColor'} ${projectalerttype ? 'projectedithide' : 'enabled'}`} />
                                                </a>
                                            )}
                                        </div>
                                        {formik.errors[`device_id_${i}`] ? <FormHelperMessage className='err' message={formik.errors[`device_id_${i}`]} /> : null}
                                    </div>
                                    <div className='col-5 px-0'>
                                        <Input
                                            type='text'
                                            name={`tag${i}`}
                                            value={device.tag}
                                            placeholder={string.tag}
                                            className='borderProject form-control radius-0 projectSelect'
                                            disabled={shouldDisabled}
                                            onChange={(event) => {
                                                const { devices } = selectionAllList
                                                const deviceTag = event.target.value.trim()
                                                selections[i].devices[j].tag = deviceTag

                                                // Check other selections have same device then should be same Tag
                                                let isShowWarning = false
                                                if (deviceTag) {
                                                    map(selections, (sele, si) => {
                                                        if (sele.devices && sele.devices.length) {
                                                            const deviceAlreadyUsed = sele.devices.some((dev) => si != i && device.device_id == dev.device_id && dev.tag != deviceTag)
                                                            if (deviceAlreadyUsed && !selections[i].devices[j].isAlreadyTagWarningShow) {
                                                                isShowWarning = true
                                                            }
                                                        }
                                                    })
                                                    if (isShowWarning && selections[i].devices[j].device_id) {
                                                        notify(string.project.deviceTagErr)
                                                        selections[i].devices[j].isAlreadyTagWarningShow = true
                                                        isShowWarning = false
                                                    }
                                                }
                                                if (device.device_id) {
                                                    // update tag in all selection devices
                                                    selections.map((sel) => {
                                                        sel.devices.map((d) => {
                                                            if (d.device_id == device.device_id) {
                                                                d.tag = deviceTag
                                                            }
                                                        })
                                                    })

                                                    // Update tag in all devices
                                                    devices.map((d) => {
                                                        if (d.id == device.device_id) {
                                                            d.tag = deviceTag
                                                        }
                                                    })
                                                }
                                                formik.setFieldValue('selections', selections)
                                                updateSelectionAllList({ devices })
                                                validateSelection('group', i)
                                            }}
                                        />
                                        {formik.errors[`tag_${i}`] ? <FormHelperMessage className='err' message={formik.errors[`tag_${i}`]} /> : null}
                                    </div>
                                    {/* Data interval remove from UI */}
                                    {/* <div className='col-3 pr-0'>
                                    <Input
                                        type='number'
                                        name={'data_interval_' + i}
                                        value={device.data_interval}
                                        placeholder={string.minutes}
                                        disabled={shouldDisabled}
                                        className='borderProject form-control radius-0 projectSelect'
                                        onChange={(event) => {
                                            let devices = selectionAllList.devices
                                            selections[i].devices[j].data_interval = event.target.value

                                            // Check other selections have same device then should be same Interval
                                            let isShowWarning = false
                                            if (event.target.value) {
                                                map(selections, (sele, si) => {
                                                    if (sele.devices && sele.devices.length) {
                                                        const deviceAlreadyUsed = sele.devices.some((dev) => si !== i && dev.device_id == device.device_id && dev.data_interval != event.target.value)
                                                        if (deviceAlreadyUsed && selections[i].devices[j].device_id && !selections[i].devices[j].isAlreadyIntrevalWarningShow) {
                                                            isShowWarning = true
                                                        }
                                                    }
                                                })
                                                if (isShowWarning) {
                                                    notify(string.project.deviceIntervalErr)
                                                    selections[i].devices[j].isAlreadyIntrevalWarningShow = true
                                                    isShowWarning = false
                                                }
                                            }
                                            if (device.device_id) {
                                                // update tag in all selection devices
                                                selections.map((sel) => {
                                                    sel.devices.map((d) => {
                                                        if (d.device_id == device.device_id) {
                                                            d.data_interval = parseInt(event.target.value)
                                                        }
                                                    })
                                                })

                                                // Update interval in all devices
                                                devices.map((d) => {
                                                    if (d.id == device.device_id) {
                                                        d.data_interval = parseInt(event.target.value)
                                                    }
                                                })
                                            }
                                            formik.setFieldValue('selections', selections)
                                            updateSelectionAllList({ devices })
                                        }}
                                    />
                                    {formik.errors['data_interval_' + i] ? <FormHelperMessage className='err' message={formik.errors['data_interval_' + i]} /> : null}
                                </div> */}
                                    {j > 0 && (
                                        <div className='col-1 pt-2' style={{ cursor: 'pointer', maxWidth: '16px' }}>
                                            <i
                                                className='fa fa-trash'
                                                onClick={() => {
                                                    if (Array.isArray(selections[i].isDeviceUsedByOthers)) {
                                                        selections[i].isDeviceUsedByOthers[j] = false
                                                    }
                                                    selections[i].devices.splice(j, 1)
                                                    formik.setFieldValue(selections)
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </td>

                    <td className='projectTrash projectAction1 projectVerticalTop'>
                        <div className='add-btn'>
                            <Button
                                style={{
                                    border: '1px solid #C0C0C0',
                                    cursor: shouldDisabled ? 'not-allowed' : 'pointer',
                                }}
                                className='btn '
                                disabled={shouldDisabled}
                                onClick={() => {
                                    const { selections } = formik.values
                                    selections[i].devices.push({
                                        // Data interval remove from UI
                                        // data_interval: null,
                                        device_id: '',
                                        tag: '',
                                    })
                                    formik.setFieldValue('selections', selections)
                                    validateSelection('group', i)
                                }}
                            >
                                <i className='fas fa-plus fa-sm' />
                            </Button>
                        </div>
                        {i > 0 && (
                            <div className='px-2'>
                                <i
                                    style={shouldDisabled ? { cursor: 'not-allowed' } : {}}
                                    className='fa fa-trash '
                                    onClick={(event) => {
                                        if (shouldDisabled) return
                                        delete formik.errors[`group_id_${i}`]
                                        delete formik.errors[`container_id_${i}`]
                                        delete formik.errors[`item_id_${i}`]
                                        delete formik.errors[`truck_id_${i}`]
                                        delete formik.errors[`device_id_${i}`]
                                        // Data interval remove from UI
                                        // delete formik.errors['data_interval_' + i]
                                        event.preventDefault()
                                        const { selections } = formik.values

                                        const ifExists = selections.findIndex((item, si) => si !== i && item.device_id == selections[i].device_id)
                                        if (ifExists > -1) {
                                            selections[ifExists].isDeviceUsedByOthers = false
                                        }

                                        selections.splice(i, 1)
                                        formik.setFieldValue('selections', selections)
                                        validateSelection('group', i)
                                    }}
                                />
                            </div>
                        )}
                    </td>
                </tr>
            }

            {isOpen && <ProjectAlertsModel shouldDisabled={shouldDisabled} isOpensec={isOpen} toggle={close} index={i} formik={formik} projectSelectionObj={stateObj} devices={selectionAllList.devices} i={i} state={state} setState={setState} selection={selection} />}
        </>
    )
}

export default ProjectSelection
