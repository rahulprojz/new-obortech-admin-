import React, { useContext, useEffect, useMemo } from 'react'
import Select from 'react-select'
import WatchAllEventContext from '../../../../store/watchAllEvent/watchAllEventContext'
import useWatchAllEventSelectOptionsGroup from '../../../../utils/customHooks/useWatchAllEventSelectOptionsGroup'
import { dynamicLanguageStringChange } from '../../../../utils/globalFunc'
import string from '../../../../utils/LanguageTranslation'

let firstload = 0
const ItemNameFilterWatchAll = ({ project, customStyles, dropDownStyle }) => {
    const { itemsNames, dispatchItemsNames, filterProjectSelection, updateAllStateAvailable, clearAllSelections, filterParentDepandencies, labels, isSelected } = useContext(WatchAllEventContext)

    useEffect(() => {
        if (project && project.length > 0 && itemsNames.selected) {
            const selectionFiltration = project.map((proj) => proj.project_selections.filter(filterProjectSelection))
            updateAllStateAvailable(selectionFiltration, 'item', project)
            filterParentDepandencies(project, selectionFiltration)
        }
    }, [itemsNames.selected])

    useEffect(() => {
        firstload += 1
        dispatchItemsNames({
            type: 'initialize',
            payload: { available: useWatchAllEventSelectOptionsGroup(project, 'selection_items'), labels },
        })
    }, [])

    useMemo(() => {
        if (firstload > 1) {
            dispatchItemsNames({
                type: 'updateAvailable',
                payload: { available: useWatchAllEventSelectOptionsGroup(project, 'selection_items'), labels },
            })
        }
        firstload += 1
    }, [project])

    if (!isSelected) {
        itemsNames.available[0] = { value: null, label: string.all }
    }
    const availables = itemsNames.available.map((item) => ({ ...item, label: dynamicLanguageStringChange(item.label, labels) }))
    const selected = { value: itemsNames.selected?.value, label: isSelected ? dynamicLanguageStringChange(itemsNames.selected?.label, labels) : string.all }

    return (
        <div style={dropDownStyle} id='itemNameSelect'>
            <Select
                styles={customStyles}
                options={availables}
                value={selected}
                onChange={(selectedOption) => {
                    clearAllSelections('item')
                    dispatchItemsNames({ type: 'onSelect', payload: { selected: selectedOption } })
                }}
            />
        </div>
    )
}

export default ItemNameFilterWatchAll
