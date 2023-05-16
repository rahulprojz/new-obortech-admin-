import { useContext, useEffect } from 'react'
import { uniqBy } from 'lodash'
import EventContext from '../../store/event/eventContext'
import string from '../../utils/LanguageTranslation'
import SearchAndResults from './SearchAndResults'
import WatchAllEventContext from '../../store/watchAllEvent/watchAllEventContext'

const RightDrawer = ({ projectSelections, selections, setSelection, watchAll = false }) => {
    if (typeof window === 'undefined') {
        return null
    }

    const { selectedGroup, selectedTruck, selectedContainer, selectedItem } = useContext(EventContext)
    const { selectedGroup: wSelectedGroup, selectedTruck: wSelectedTruck, selectedContainer: wSelectedContainer, selectedItem: wSelectedItem } = useContext(WatchAllEventContext)

    const makeCondition = (selection) => {
        let condition
        const groupId = watchAll ? wSelectedGroup : selectedGroup
        const truckId = watchAll ? wSelectedTruck : selectedTruck
        const containerId = watchAll ? wSelectedContainer : selectedContainer
        const itemId = watchAll ? wSelectedItem : selectedItem
        if (groupId) {
            condition = selection.selection_groups[0].group_id == groupId
            if (truckId) {
                condition = selection.selection_groups[0].group_id == groupId && selection.selection_trucks[0].truck_id == truckId
                if (containerId) {
                    condition = selection.selection_groups[0].group_id == groupId && selection.selection_trucks[0].truck_id == truckId && selection.selection_containers[0].container_id == containerId
                    if (itemId) {
                        condition = selection.selection_groups[0].group_id == groupId && selection.selection_trucks[0].truck_id == truckId && selection.selection_containers[0].container_id == containerId && selection.selection_items[0].item_id == itemId
                    }
                }
            }
        }

        return condition
    }

    const prepareSelection = () => {
        const itemArray = []
        const containerArray = []
        const isSelectedArray = []
        const tempProjectSelections = projectSelections.map((pSelection) => {
            const isSelected = makeCondition(pSelection)
            if (isSelected) {
                isSelectedArray.push(pSelection.selection_containers[0].container_id)
            }
            return { ...pSelection, isSelected }
        })

        if (tempProjectSelections.length) {
            tempProjectSelections.map((pSelection) => {
                pSelection.selection_items[0].item.container_id = pSelection.selection_containers[0].container_id
                pSelection.selection_items[0].label = pSelection.selection_items[0].item.itemID
                pSelection.selection_containers[0].label = pSelection.selection_containers[0].container.containerID
                const item = {
                    ...pSelection.selection_items[0],
                    container_id: pSelection.selection_containers[0].container_id,
                    truck_id: pSelection.selection_trucks[0].truck_id,
                    group_id: pSelection.selection_groups[0].group_id,
                    isSelected: pSelection.isSelected,
                }

                const container = {
                    ...pSelection.selection_containers[0],
                    isSelected: isSelectedArray.includes(pSelection.selection_containers[0].container_id),
                }
                itemArray.push(item)
                containerArray.push(container)
            })
        }
        setSelection({
            items: itemArray,
            containers: uniqBy(containerArray, 'container_id'),
        })
    }

    const updateSelection = (event, type, status) => {
        let itemsArray = []
        let containerArray = []
        if (event) {
            if (type == 'container') {
                const events = status ? event[0].container : event
                const containerIndex = selections.containers.findIndex((sel) => sel.container_id == events.id)
                itemsArray = selections.items.map((item) => {
                    if (item.container_id == events.id) {
                        item.isSelected = status
                    }
                    return item
                })
                if (containerIndex > -1) {
                    selections.containers[containerIndex].isSelected = status
                    containerArray = selections.containers
                }
            } else {
                const events = status ? event[0].item : event
                const itemIndex = selections.items.findIndex((sel) => sel.item_id == events.id)
                if (itemIndex > -1) {
                    selections.items[itemIndex].isSelected = status
                    itemsArray = selections.items
                    const isContainerAvail =
                        selections.items.filter((item) => {
                            return item.isSelected && item.container_id == selections.items[itemIndex].container_id
                        }).length > 0 || false
                    if (status || !isContainerAvail) {
                        const containerIndex = selections.containers.findIndex((sel) => sel.container_id == selections.items[itemIndex].container_id)
                        if (containerIndex > -1) {
                            selections.containers[containerIndex].isSelected = status
                            containerArray = selections.containers
                        }
                    }
                }
            }
            containerArray = selections.containers
            setSelection({
                items: itemsArray,
                containers: containerArray,
            })
        }
    }

    useEffect(() => {
        prepareSelection()
    }, [selectedGroup, selectedTruck, selectedContainer, selectedItem, wSelectedGroup, wSelectedTruck, wSelectedContainer, wSelectedItem])

    return (
        <div className='right-drawer'>
            <h5 className='text-center'>{string.submittingTo}</h5>
            <SearchAndResults selections={selections} updateSelection={updateSelection} searchType='container' />
            <SearchAndResults selections={selections} updateSelection={updateSelection} />
        </div>
    )
}

export default RightDrawer
