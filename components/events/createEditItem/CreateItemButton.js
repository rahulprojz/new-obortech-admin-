import React, { useContext } from 'react'
import EventContext from '../../../store/event/eventContext'
import CreateItemModal from './CreateItemModal'
import notify from '../../../lib/notifier'
import ItemAddEditContext from '../../../store/event/itemAddEditContext'
import QrCodeContext from '../../../store/event/qrCodeContext'
import string from '../../../utils/LanguageTranslation'
import { dynamicLanguageStringChange } from '../../../utils/globalFunc'

const CreateItemButton = ({ selectedProject, refetchProjectSelection }) => {
    const { modal, setModal, setOperation, operator } = useContext(ItemAddEditContext)
    const { groupNames, truckNames, containersName, labels } = useContext(EventContext)

    const handleCreateItem = () => {
        if (groupNames?.selected?.value && truckNames?.selected?.value && containersName?.selected?.value) {
            setOperation(operator.CREATE)
            setModal(true)
        } else {
            let tempString = ''
            if (groupNames.available.length == 1 && truckNames.available.length == 1 && !containersName?.selected?.value) {
                tempString = string.errors.pleaseSelectGroup1
            } else if (groupNames.available.length == 1 && !truckNames?.selected?.value && !containersName?.selected?.value) {
                tempString = string.errors.pleaseSelectGroup2Group1
            } else if (!groupNames?.selected?.value && !truckNames?.selected?.value && !containersName?.selected?.value) {
                tempString = string.errors.pleaseSelectGroup1Group2Group3
            } else if (groupNames?.selected?.value && !truckNames?.selected?.value && !containersName?.selected?.value) {
                tempString = string.errors.pleaseSelectGroup2Group1
            } else if (groupNames?.selected?.value && truckNames?.selected?.value && !containersName?.selected?.value) {
                tempString = string.errors.pleaseSelectGroup1
            }
            notify(dynamicLanguageStringChange(tempString, labels))
        }
    }
    return (
        <>
            <div className='col-md-2' id='createNewItem'>
                <button
                    type='button'
                    disabled={selectedProject?.is_completed}
                    style={{ cursor: selectedProject?.is_completed ? 'not-allowed' : 'pointer', color: '#6e707e', borderColor: '#6e707e', height: '35px', fontSize: '14px', lineHeight: '14px', marginLeft: '7px', width: '140px' }}
                    className='btn text-uppercase'
                    onClick={handleCreateItem}
                >
                    {dynamicLanguageStringChange(string.event.createItemm, labels)}
                </button>
            </div>
            {/* The Following Modal is used for Both Create and Edit Item */}
            {modal && <CreateItemModal selectedProject={selectedProject} labels={labels} refetchProjectSelection={refetchProjectSelection} />}
        </>
    )
}

export default CreateItemButton
