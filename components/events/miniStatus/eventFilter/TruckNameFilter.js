import React, { useContext, useEffect } from 'react'
import Select from 'react-select'
import EventContext from '../../../../store/event/eventContext'
import useEventSelectOptionsGroup from '../../../../utils/customHooks/useEventSelectOptionsGroup'
import { dynamicLanguageStringChange } from '../../../../utils/globalFunc'

const TruckNameFilter = ({ isPublicUser = false, project, customStyles, dropDownStyle }) => {
    const { truckNames, groupNames, dispatchTruckNames, updateAllStateAvailable, filterProjectSelection, clearAllSelections, filterParentsDependancy, labels, getSelection } = useContext(EventContext)

    const filterOtherSelection = () => {
        if (project?.project_selections && project?.project_selections.length > 0 && truckNames.selected) {
            const selectionFiltration = project.project_selections.filter(filterProjectSelection)
            updateAllStateAvailable(selectionFiltration, 'truck')
            if (truckNames.selected.value == null && groupNames.selected) {
                dispatchTruckNames({ type: 'updateAvailable', payload: { available: useEventSelectOptionsGroup(project.project_selections, 'selection_trucks') } })
            }
            if (selectionFiltration.length) filterParentsDependancy(project.project_selections, selectionFiltration)
        }
    }

    useEffect(() => {
        filterOtherSelection()
    }, [truckNames.selected])

    useEffect(() => {
        dispatchTruckNames({
            type: 'updateAvailable',
            payload: { available: useEventSelectOptionsGroup(project?.project_selections, 'selection_trucks') },
        })
        getSelection('truck')
        filterOtherSelection()
    }, [project])

    useEffect(() => {
        dispatchTruckNames({
            type: 'initialize',
            payload: { available: useEventSelectOptionsGroup(project.project_selections, 'selection_trucks') },
        })
    }, [])

    const availables = truckNames.available.map((truck) => ({ ...truck, label: dynamicLanguageStringChange(truck.label, labels) }))
    const selected = { value: truckNames.selected?.value, label: dynamicLanguageStringChange(truckNames.selected?.label, labels) }

    return (
        <>
            {truckNames.selected && truckNames.available.length > 1 && (
                <div style={dropDownStyle} id='truckNameSelect'>
                    <Select
                        options={availables}
                        styles={customStyles}
                        isDisabled={isPublicUser}
                        value={selected}
                        onChange={(selectedOption) => {
                            clearAllSelections('truck')
                            window.localStorage.setItem(`${project.id}_selection`, JSON.stringify({ truck: selectedOption }))
                            dispatchTruckNames({ type: 'onSelect', payload: { selected: selectedOption } })
                        }}
                    />
                </div>
            )}
        </>
    )
}

export default TruckNameFilter
