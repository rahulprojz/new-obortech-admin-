import React, { useContext, useMemo, useEffect } from 'react'
import { uniqBy } from 'lodash'
import string from '../../utils/LanguageTranslation'
import useEventSelectOptionsGroup from '../../utils/customHooks/useEventSelectOptionsGroup'
import AdvanceSelect from '../../components/common/form-elements/select/AdvanceSelect'
import IotContext from '../../store/iot/iotContext'
import { dynamicLanguageStringChange } from '../../utils/globalFunc'

const IotFilters = ({ labelWidth, isPublicUser, labels, refs, projectSelections, filterOtherSelection, project_id }) => {
    const { groupNames, truckNames, containersName, itemsNames, devicesNames, dispatchContainersName, dispatchItemsNames, dispatchDevicesNames, dispatchTruckNames, dispatchGroupNames, clearAllSelections } = useContext(IotContext)
    const availablesGroup = groupNames.available?.map((group) => ({ ...group, label: dynamicLanguageStringChange(group.label, labels) }))
    const selectedGroup = { value: groupNames.selected?.value, label: dynamicLanguageStringChange(groupNames.selected?.label, labels) }
    const availablesTruck = truckNames.available.map((truck) => ({ ...truck, label: dynamicLanguageStringChange(truck.label, labels) }))
    const selectedTruck = { value: truckNames.selected?.value, label: dynamicLanguageStringChange(truckNames.selected?.label, labels) }
    const availablesContainer = containersName.available.map((cont) => ({ ...cont, label: dynamicLanguageStringChange(cont.label, labels) }))
    const selectedContainers = { value: containersName.selected?.value, label: dynamicLanguageStringChange(containersName.selected?.label, labels) }
    const availablesItem = itemsNames.available.map((item) => ({ ...item, label: dynamicLanguageStringChange(item.label, labels) }))
    const selectedItems = { value: itemsNames.selected?.value, label: dynamicLanguageStringChange(itemsNames.selected?.label, labels) }

    const setLocalStorage = (filter, selection) => {
        if (filter != 'device') {
            window.localStorage.setItem(`${project_id}_selection`, JSON.stringify({ [filter]: selection }))
        } else {
            const projectSelectionIndex = projectSelections.findIndex((projSelection) => projSelection.selection_devices.some((device) => `${device.device_id}_${device.selection_id}` == selection?.value))
            let selected = itemsNames?.available[0]
            if (projectSelectionIndex > -1) selected = itemsNames?.available.find((avail) => avail.value == `${projectSelections[projectSelectionIndex].selection_items[0]?.item_id}_${projectSelections[projectSelectionIndex].selection_items[0]?.selection_id}`)
            window.localStorage.setItem(`${project_id}_selection`, JSON.stringify({ item: selected, [filter]: selection }))
        }
    }

    useEffect(() => {
        dispatchGroupNames({
            type: 'initialize',
            payload: { available: useEventSelectOptionsGroup(projectSelections, 'selection_groups') },
        })
        dispatchTruckNames({
            type: 'initialize',
            payload: { available: useEventSelectOptionsGroup(projectSelections, 'selection_trucks') },
        })
        dispatchItemsNames({
            type: 'initialize',
            payload: { available: useEventSelectOptionsGroup(projectSelections, 'selection_items') },
        })
        dispatchContainersName({
            type: 'initialize',
            payload: { available: useEventSelectOptionsGroup(projectSelections, 'selection_containers') },
        })
        dispatchDevicesNames({
            type: 'initialize',
            payload: { available: useEventSelectOptionsGroup(projectSelections, 'selection_devices') },
        })
    }, [])

    useMemo(() => {
        if (itemsNames.selected?.value) {
            const projectSelectionIndex = projectSelections.findIndex((projSelection) => `${projSelection.selection_items[0].item_id}_${projSelection.selection_items[0].selection_id}` == itemsNames.selected?.value)
            let selected = devicesNames?.available[0]
            if (projectSelectionIndex > -1) {
                selected =
                    devicesNames.selected?.value == null
                        ? devicesNames?.available.find((avail) => avail.value == `${projectSelections[projectSelectionIndex].selection_devices[0]?.device_id}_${projectSelections[projectSelectionIndex].selection_devices[0]?.selection_id}`)
                        : devicesNames?.available.find((avail) => avail.value == devicesNames.selected?.value)
                dispatchDevicesNames({ type: 'onSelect', payload: { selected } })
            }
            setLocalStorage('device', selected)
        }
    }, [JSON.stringify(devicesNames.available), JSON.stringify(itemsNames.selected)])

    useMemo(() => {
        filterOtherSelection('group')
    }, [groupNames.selected])
    useMemo(() => {
        filterOtherSelection('truck')
    }, [truckNames.selected])
    useMemo(() => {
        filterOtherSelection('container')
    }, [containersName.selected])
    useMemo(() => {
        filterOtherSelection('item')
    }, [itemsNames.selected])
    useMemo(() => {
        filterOtherSelection('device')
    }, [devicesNames.selected])

    return (
        <>
            <div className='form-group d-flex'>
                <label ref={(ref) => (refs.current.deviceLabel = ref)} className='col-form-label flex-shrink-0 p-2' style={{ minWidth: labelWidth }}>
                    {string.project.device}:
                </label>
                <div className='mt-md-0 w-100 position-relative '>
                    <AdvanceSelect
                        placeholder={string.submissionRequest.deviceTitleSmall}
                        options={uniqBy(devicesNames.available, 'label')}
                        value={devicesNames.selected}
                        name='deviceID'
                        isDisabled={isPublicUser}
                        formatOptionLabel={function (data) {
                            return <span dangerouslySetInnerHTML={{ __html: data.label }} />
                        }}
                        onChange={(selectedOption) => {
                            clearAllSelections('device')
                            setLocalStorage('device', selectedOption)
                            dispatchDevicesNames({ type: 'onSelect', payload: { selected: selectedOption } })
                        }}
                    />
                </div>
            </div>
            <div className='form-group d-flex'>
                <label ref={(ref) => (refs.current.itemLabel = ref)} className='col-form-label flex-shrink-0 p-2' style={{ minWidth: labelWidth }}>
                    {labels.item}:
                </label>
                <div className='mt-md-0 w-100 position-relative '>
                    <AdvanceSelect
                        placeholder={dynamicLanguageStringChange(string.submissionRequest.itemTitleSmallIOT, labels)}
                        options={availablesItem}
                        value={selectedItems}
                        name='item_id'
                        isDisabled={isPublicUser}
                        formatOptionLabel={function (data) {
                            return <span dangerouslySetInnerHTML={{ __html: data.label }} />
                        }}
                        onChange={(selectedOption) => {
                            clearAllSelections('item')
                            setLocalStorage('item', selectedOption)
                            dispatchItemsNames({ type: 'onSelect', payload: { selected: selectedOption } })
                        }}
                    />
                </div>
            </div>
            <div className='form-group d-flex'>
                <label ref={(ref) => (refs.current.containerLabel = ref)} className='col-form-label flex-shrink-0 p-2' style={{ minWidth: labelWidth }}>
                    {labels.group1}:
                </label>
                <div className='w-100 position-relative mt-2 mt-md-0 '>
                    <AdvanceSelect
                        placeholder={dynamicLanguageStringChange(string.submissionRequest.group1TitleSmallIOT, labels)}
                        options={uniqBy(availablesContainer, 'label')}
                        value={selectedContainers}
                        name='container_id'
                        isDisabled={isPublicUser}
                        formatOptionLabel={function (data) {
                            return <span dangerouslySetInnerHTML={{ __html: data.label }} />
                        }}
                        onChange={(selectedOption) => {
                            clearAllSelections('container')
                            setLocalStorage('container', selectedOption)
                            dispatchContainersName({ type: 'onSelect', payload: { selected: selectedOption } })
                        }}
                    />
                </div>
            </div>
            <div className='form-group d-flex'>
                <label ref={(ref) => (refs.current.truckLabel = ref)} className='col-form-label flex-shrink-0 p-2' style={{ minWidth: labelWidth }}>
                    {labels.group2}:
                </label>
                <div className=' w-100 position-relative '>
                    <AdvanceSelect
                        placeholder={dynamicLanguageStringChange(string.submissionRequest.group2TitleSmall, labels)}
                        options={uniqBy(availablesTruck, 'label')}
                        value={selectedTruck}
                        name='truck_id'
                        isDisabled={isPublicUser}
                        formatOptionLabel={function (data) {
                            return <span dangerouslySetInnerHTML={{ __html: data.label }} />
                        }}
                        onChange={(selectedOption) => {
                            clearAllSelections('truck')
                            setLocalStorage('truck', selectedOption)
                            dispatchTruckNames({ type: 'onSelect', payload: { selected: selectedOption } })
                        }}
                    />
                </div>
            </div>
            <div className='form-group d-flex'>
                <label ref={(ref) => (refs.current.groupLabel = ref)} className='col-form-label flex-shrink-0 p-2' style={{ minWidth: labelWidth }}>
                    {labels.group3}:
                </label>
                <div className='position-relative w-100 mt-2 mt-md-0 pl-0 '>
                    <AdvanceSelect
                        placeholder={dynamicLanguageStringChange(string.submissionRequest.group3TitleSmall, labels)}
                        options={uniqBy(availablesGroup, 'label')}
                        value={selectedGroup}
                        name='group_id'
                        isDisabled={isPublicUser}
                        formatOptionLabel={function (data) {
                            return <span dangerouslySetInnerHTML={{ __html: data.label }} />
                        }}
                        onChange={(selectedOption) => {
                            clearAllSelections('group')
                            setLocalStorage('group', selectedOption)
                            dispatchGroupNames({ type: 'onSelect', payload: { selected: selectedOption } })
                        }}
                    />
                </div>
            </div>
        </>
    )
}

export default IotFilters
