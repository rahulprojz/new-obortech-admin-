import React, { useContext, useEffect, useMemo } from 'react'
import Select from 'react-select'
import WatchAllEventContext from '../../../../store/watchAllEvent/watchAllEventContext'
import useWatchAllEventSelectOptionsGroup from '../../../../utils/customHooks/useWatchAllEventSelectOptionsGroup'
import { dynamicLanguageStringChange } from '../../../../utils/globalFunc'
import string from '../../../../utils/LanguageTranslation'

let firstload = 0
const ContainerNameFilterWatchAll = ({ project, customStyles, dropDownStyle }) => {
    const { containersName, dispatchContainersName, filterProjectSelection, updateAllStateAvailable, clearAllSelections, filterParentDepandencies, labels, isSelected } = useContext(WatchAllEventContext)

    useEffect(() => {
        if (project && project.length > 0 && containersName.selected) {
            const selectionFiltration = project.map((proj) => proj.project_selections.filter(filterProjectSelection))
            updateAllStateAvailable(selectionFiltration, 'container', project)
            filterParentDepandencies(project, selectionFiltration)
        }
    }, [containersName.selected])

    useEffect(() => {
        firstload += 1
        dispatchContainersName({
            type: 'initialize',
            payload: { available: useWatchAllEventSelectOptionsGroup(project, 'selection_containers') },
        })
    }, [])

    useMemo(() => {
        if (firstload > 1) {
            dispatchContainersName({
                type: 'updateAvailable',
                payload: { available: useWatchAllEventSelectOptionsGroup(project, 'selection_containers') },
            })
        }
        firstload += 1
    }, [project])

    if (!isSelected) {
        containersName.available[0] = { value: null, label: string.all }
    }
    const availables = containersName.available.map((cont) => ({ value: cont.value, label: dynamicLanguageStringChange(cont.label, labels) }))
    const selected = { value: containersName.selected?.value, label: isSelected ? dynamicLanguageStringChange(containersName.selected?.label, labels) : string.all }
    return (
        <>
            <div style={dropDownStyle} id='containerNameSelect'>
                <Select
                    styles={customStyles}
                    options={availables}
                    value={selected}
                    onChange={(selectedOption) => {
                        clearAllSelections('container')
                        dispatchContainersName({ type: 'onSelect', payload: { selected: selectedOption } })
                    }}
                />
            </div>
        </>
    )
}

export default ContainerNameFilterWatchAll
