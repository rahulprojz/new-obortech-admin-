import React, { useContext } from 'react'
import EventContext from '../../../store/event/eventContext'
import ItemAddEditContext from '../../../store/event/itemAddEditContext'
import { dynamicLanguageStringChange } from '../../../utils/globalFunc'
import string from '../../../utils/LanguageTranslation'

const ItemModalSelectionDetails = () => {
    const { groupNames, truckNames, containersName, labels } = useContext(EventContext)
    const { operation, operator } = useContext(ItemAddEditContext)

    const selectionArray = []
    if (groupNames.selected) {
        selectionArray.push(groupNames.selected.value == 1 ? `${string.event.acceptno} ${labels.group3}` : groupNames.selected.label)
    }
    if (truckNames.selected) {
        selectionArray.push(truckNames.selected.value == 1 ? `${string.event.acceptno} ${labels.group2}` : truckNames.selected.label)
    }
    if (containersName.selected) {
        selectionArray.push(containersName.selected.label)
    }

    const selectedItems = selectionArray.length > 0 ? selectionArray.join(' - ') : ''

    return (
        <>
            {operation == operator.CREATE && (
                <div className='row form-group'>
                    <div className='col-sm'>{selectedItems && <span className='text-grey'>{selectedItems}</span>}</div>
                </div>
            )}
            <div className='row'>
                <div className='col-sm-10'>
                    <label htmlFor='itemName' className='col-form-label'>
                        {dynamicLanguageStringChange(string.itemTxt, labels)}
                    </label>
                </div>
                <div className='col-sm-2'>
                    {operation == operator.CREATE && (
                        <div className='text-center'>
                            <label htmlFor='itemName' className='col-form-label'>
                                {string.event.addQrCode}
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default ItemModalSelectionDetails
