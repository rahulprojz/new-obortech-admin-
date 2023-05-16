import React, { useContext, useEffect } from 'react'
import Select from 'react-select'
import EventContext from '../../../../store/event/eventContext'
import useEventSelectOptionsGroup from '../../../../utils/customHooks/useEventSelectOptionsGroup'

const DeviceFilter = ({ isPublicUser = false, project, customStyles, dropDownStyle }) => {
    const { devicesNames, dispatchDevicesNames, filterProjectSelection, updateAllStateAvailable, clearAllSelections } = useContext(EventContext)

    const filterOtherSelection = () => {
        if (project.project_selections && project.project_selections.length > 0 && devicesNames && devicesNames.selected) {
            const selectionFiltration = project.project_selections.filter(filterProjectSelection)
            updateAllStateAvailable(selectionFiltration, 'device')
            if (devicesNames.selected.value == null) {
                dispatchDevicesNames({ type: 'updateAvailable', payload: { available: useEventSelectOptionsGroup(selectionFiltration, 'selection_devices') } })
            }
        }
    }
    useEffect(() => {
        filterOtherSelection()
    }, [devicesNames.selected])

    useEffect(() => {
        filterOtherSelection()
    }, [project])

    useEffect(() => {
        dispatchDevicesNames({
            type: 'initialize',
            payload: { available: useEventSelectOptionsGroup(project.project_selections, 'selection_devices') },
        })
    }, [])

    return (
        <>
            {devicesNames.selected && devicesNames.available.length > 1 && (
                <div style={{ width: '196px' }} id='deviceNameSelect'>
                    <div className='row justify-content-center align-items-center'>
                        <div style={dropDownStyle}>
                            <Select
                                options={devicesNames.available}
                                styles={customStyles}
                                isDisabled={isPublicUser}
                                value={devicesNames.selected}
                                onChange={(selectedOption) => {
                                    dispatchDevicesNames({ type: 'onSelect', payload: { selected: selectedOption } })
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default DeviceFilter
