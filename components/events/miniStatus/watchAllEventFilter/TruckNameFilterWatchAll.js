import React, { useContext, useEffect, useMemo } from 'react'
import Select from 'react-select'
import WatchAllEventContext from '../../../../store/watchAllEvent/watchAllEventContext'
import useWatchAllEventSelectOptionsGroup from '../../../../utils/customHooks/useWatchAllEventSelectOptionsGroup'
import { dynamicLanguageStringChange } from '../../../../utils/globalFunc'
import string from '../../../../utils/LanguageTranslation'

let firstload = 0
const TruckNameFilterWatchAll = ({ project = null, customStyles, dropDownStyle }) => {
    const { truckNames, dispatchTruckNames, filterProjectSelection, updateAllStateAvailable, filterNoTruck, clearAllSelections, filterParentDepandencies, labels, isSelected } = useContext(WatchAllEventContext)

    useEffect(() => {
        if (project && project.length > 0 && truckNames.selected) {
            const selectionFiltration = project.map((proj) => proj.project_selections.filter(filterProjectSelection))
            updateAllStateAvailable(selectionFiltration, 'truck', project)
            filterParentDepandencies(project, selectionFiltration)
        }
    }, [truckNames.selected])

    useEffect(() => {
        firstload += 1
        dispatchTruckNames({
            type: 'initialize',
            payload: { available: filterNoTruck(useWatchAllEventSelectOptionsGroup(project, 'selection_trucks')), labels },
        })
    }, [])

    useMemo(() => {
        if (firstload > 1) {
            dispatchTruckNames({
                type: 'updateAvailable',
                payload: { available: filterNoTruck(useWatchAllEventSelectOptionsGroup(project, 'selection_trucks')), labels },
            })
        }
        firstload += 1
    }, [project])

    if (!isSelected) {
        truckNames.available[0] = { value: null, label: string.all }
    }
    const availables = truckNames.available.map((truck) => ({
        ...truck,
        label: dynamicLanguageStringChange(truck.label, labels),
    }))
    const selected = { value: truckNames.selected?.value, label: isSelected ? dynamicLanguageStringChange(truckNames.selected?.label, labels) : string.all }

    return (
        <>
            {truckNames.selected && truckNames.available.length > 1 && (
                <div style={dropDownStyle} id='truckNameSelect'>
                    <Select
                        styles={customStyles}
                        options={availables}
                        value={selected}
                        onChange={(selectedOption) => {
                            clearAllSelections('truck')
                            dispatchTruckNames({ type: 'onSelect', payload: { selected: selectedOption } })
                        }}
                    />
                </div>
            )}
        </>
    )
}

export default TruckNameFilterWatchAll
