import React, { useContext, useEffect, useMemo } from 'react'
import Select from 'react-select'
import WatchAllEventContext from '../../../../store/watchAllEvent/watchAllEventContext'
import useWatchAllEventSelectOptionsGroup from '../../../../utils/customHooks/useWatchAllEventSelectOptionsGroup'

let firstload = 0
const ProjectFilter = ({ project, customStyles, dropDownStyle }) => {
    const { projectNames, dispatchProjectNames, filterProjectSelection, updateAllStateAvailable, clearAllSelections, filterParentDepandencies, labels } = useContext(WatchAllEventContext)

    useEffect(() => {
        if (project && project.length > 0 && projectNames.selected) {
            const selectionFiltration = project.map((proj) => proj.project_selections.filter(filterProjectSelection))
            updateAllStateAvailable(selectionFiltration, 'project', project)
            filterParentDepandencies(project, selectionFiltration)
        }
    }, [projectNames.selected])

    useEffect(() => {
        firstload += 1
        dispatchProjectNames({
            type: 'initialize',
            payload: { available: useWatchAllEventSelectOptionsGroup(project, 'selection_project', 'selection_project'), labels },
        })
    }, [])

    useMemo(() => {
        if (firstload > 1) {
            dispatchProjectNames({
                type: 'updateAvailable',
                payload: { available: useWatchAllEventSelectOptionsGroup(project, 'selection_project', 'selection_project'), labels },
            })
        }
        firstload += 1
    }, [project])

    return (
        <div style={dropDownStyle} id='groupNameSelect'>
            <Select
                options={projectNames.available}
                styles={customStyles}
                value={projectNames.selected}
                onChange={(selectedOption) => {
                    clearAllSelections('project')
                    dispatchProjectNames({ type: 'onSelect', payload: { selected: selectedOption } })
                }}
            />
        </div>
    )
}

export default ProjectFilter
