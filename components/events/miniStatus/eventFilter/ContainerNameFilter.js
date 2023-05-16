import React, { useContext, useEffect } from 'react'
import Select from 'react-select'
import EventContext from '../../../../store/event/eventContext'
import useEventSelectOptionsGroup from '../../../../utils/customHooks/useEventSelectOptionsGroup'
import { dynamicLanguageStringChange } from '../../../../utils/globalFunc'

const ContainerNameFilter = ({ isPublicUser = false, project, customStyles, dropDownStyle }) => {
    const { containersName, groupNames, truckNames, dispatchContainersName, filterProjectSelection, updateAllStateAvailable, clearAllSelections, filterParentsDependancy, labels, getSelection } = useContext(EventContext)
    const filterOtherSelection = () => {
        if (project?.project_selections && project?.project_selections.length > 0 && containersName.selected) {
            const selectionFiltration = project.project_selections.filter(filterProjectSelection)
            updateAllStateAvailable(selectionFiltration, 'container')
            if (containersName.selected.value == null && (groupNames.selected || truckNames.selected)) {
                dispatchContainersName({ type: 'updateAvailable', payload: { available: useEventSelectOptionsGroup(project.project_selections, 'selection_containers') } })
            }
            if (selectionFiltration.length) filterParentsDependancy(project.project_selections, selectionFiltration)
        }
    }

    useEffect(() => {
        filterOtherSelection()
    }, [containersName.selected])

    useEffect(() => {
        dispatchContainersName({
            type: 'updateAvailable',
            payload: { available: useEventSelectOptionsGroup(project?.project_selections, 'selection_containers') },
        })
        getSelection('container')
        filterOtherSelection()
    }, [project])

    useEffect(() => {
        dispatchContainersName({
            type: 'initialize',
            payload: { available: useEventSelectOptionsGroup(project.project_selections, 'selection_containers') },
        })
    }, [])

    const availables = containersName.available.map((cont) => ({ ...cont, label: dynamicLanguageStringChange(cont.label, labels) }))
    const selected = { value: containersName.selected?.value, label: dynamicLanguageStringChange(containersName.selected?.label, labels) }

    return (
        <>
            <div style={dropDownStyle} id='containerNameSelect'>
                <Select
                    options={availables}
                    styles={customStyles}
                    value={selected}
                    isDisabled={isPublicUser}
                    onChange={(selectedOption) => {
                        clearAllSelections('container')
                        window.localStorage.setItem(`${project.id}_selection`, JSON.stringify({ container: selectedOption }))
                        dispatchContainersName({ type: 'onSelect', payload: { selected: selectedOption } })
                    }}
                />
            </div>
        </>
    )
}

export default ContainerNameFilter
