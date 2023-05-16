import React, { useContext, useEffect, useMemo } from 'react'
import Select from 'react-select'
import WatchAllEventContext from '../../../../store/watchAllEvent/watchAllEventContext'
import useWatchAllEventSelectOptionsGroup from '../../../../utils/customHooks/useWatchAllEventSelectOptionsGroup'
import { dynamicLanguageStringChange } from '../../../../utils/globalFunc'
import string from '../../../../utils/LanguageTranslation'

let firstload = 0
const GroupNameFilterWatchAll = ({ project, customStyles, dropDownStyle }) => {
    const { groupNames, dispatchGroupNames, filterProjectSelection, updateAllStateAvailable, filterNoGroup, clearAllSelections, filterParentDepandencies, labels, isSelected } = useContext(WatchAllEventContext)

    useEffect(() => {
        if (project && project.length > 0 && groupNames.selected) {
            const selectionFiltration = project.map((proj) => proj.project_selections.filter(filterProjectSelection))
            updateAllStateAvailable(selectionFiltration, 'group', project)
            filterParentDepandencies(project, selectionFiltration)
        }
    }, [groupNames.selected])

    useEffect(() => {
        firstload += 1
        dispatchGroupNames({
            type: 'initialize',
            payload: { available: filterNoGroup(useWatchAllEventSelectOptionsGroup(project, 'selection_groups')), labels },
        })
    }, [])

    useMemo(() => {
        if (firstload > 1) {
            dispatchGroupNames({
                type: 'updateAvailable',
                payload: { available: filterNoGroup(useWatchAllEventSelectOptionsGroup(project, 'selection_groups')), labels },
            })
        }
        firstload += 1
    }, [project])

    if (!isSelected) {
        groupNames.available[0] = { value: null, label: string.all }
    }
    const availables = groupNames.available.map((group) => ({
        ...group,
        label: dynamicLanguageStringChange(group.label, labels),
    }))
    const selected = { value: groupNames.selected?.value, label: isSelected ? dynamicLanguageStringChange(groupNames.selected?.label, labels) : string.all }

    return (
        <>
            {groupNames.selected && availables.length > 1 && (
                <div style={dropDownStyle} id='groupNameSelect'>
                    <Select
                        styles={customStyles}
                        options={availables}
                        value={selected}
                        onChange={(selectedOption) => {
                            clearAllSelections('group')
                            dispatchGroupNames({ type: 'onSelect', payload: { selected: selectedOption } })
                        }}
                    />
                </div>
            )}
        </>
    )
}

export default GroupNameFilterWatchAll
