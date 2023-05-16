import React, { useContext, useEffect } from 'react'
import Select from 'react-select'
import EventContext from '../../../../store/event/eventContext'
import useEventSelectOptionsGroup from '../../../../utils/customHooks/useEventSelectOptionsGroup'
import { dynamicLanguageStringChange } from '../../../../utils/globalFunc'

const GroupNameFilter = ({ isPublicUser = false, project, customStyles, dropDownStyle }) => {
    const { groupNames, dispatchGroupNames, filterProjectSelection, updateAllStateAvailable, clearAllSelections, filterParentsDependancy, labels, getSelection } = useContext(EventContext)
    const filterOtherSelection = () => {
        if (project?.project_selections && project?.project_selections.length > 0 && groupNames.selected) {
            const selectionFiltration = project.project_selections.filter(filterProjectSelection)
            updateAllStateAvailable(selectionFiltration, 'group')
            if (selectionFiltration.length) filterParentsDependancy(project.project_selections, selectionFiltration)
        }
    }

    useEffect(() => {
        filterOtherSelection()
    }, [groupNames.selected])

    useEffect(() => {
        dispatchGroupNames({
            type: 'updateAvailable',
            payload: { available: useEventSelectOptionsGroup(project?.project_selections, 'selection_groups') },
        })
        getSelection('group')
        filterOtherSelection()
    }, [project])

    useEffect(() => {
        dispatchGroupNames({
            type: 'initialize',
            payload: { available: useEventSelectOptionsGroup(project.project_selections, 'selection_groups') },
        })
    }, [])

    const availables = groupNames.available.map((group) => ({ ...group, label: dynamicLanguageStringChange(group.label, labels) }))
    const selected = { value: groupNames.selected?.value, label: dynamicLanguageStringChange(groupNames.selected?.label, labels) }

    return (
        <>
            {groupNames.selected && groupNames.available.length > 1 && (
                <div style={dropDownStyle} id='groupNameSelect'>
                    <Select
                        options={availables}
                        styles={customStyles}
                        isDisabled={isPublicUser}
                        value={selected}
                        onChange={(selectedOption) => {
                            clearAllSelections('group')
                            window.localStorage.setItem(`${project.id}_selection`, JSON.stringify({ group: selectedOption }))
                            dispatchGroupNames({ type: 'onSelect', payload: { selected: selectedOption } })
                        }}
                    />
                </div>
            )}
        </>
    )
}

export default GroupNameFilter
