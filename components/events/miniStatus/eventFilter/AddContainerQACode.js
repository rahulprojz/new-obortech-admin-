import React, { useContext, useEffect, useState } from 'react'
import notify from '../../../../lib/notifier'
import EventContext from '../../../../store/event/eventContext'
import QrCodeContext from '../../../../store/event/qrCodeContext'
import QrCodeComponent from '../../../item/QrCodeComponent'
import string from '../../../../utils/LanguageTranslation.js'
import { dynamicLanguageStringChange } from '../../../../utils/globalFunc'

const AddContainerQRCode = () => {
    const [loadQrComponent, setLoadQrComponent] = useState(false)
    const { itemsNames, containersName, labels } = useContext(EventContext)
    const { modal: qrModal, setModal: setQrModal, setQrCodeValue } = useContext(QrCodeContext)

    useEffect(() => {
        if (!qrModal) {
            setLoadQrComponent(false)
        }
    }, [qrModal])

    const handleEditQR = () => {
        if (containersName?.selected?.value) {
            setQrCodeValue(null)
            setLoadQrComponent(true)
            setQrModal(true)
        } else {
            notify(dynamicLanguageStringChange(string.container.pleaseSelectGroup1, labels))
        }
    }
    return (
        <div onClick={handleEditQR} style={{ width: '30px', marginLeft: '10px', fontSize: '16px' }}>
            <i style={{ backgroundColor: '#e8e8e8', padding: '10px', cursor: 'pointer', color: 'gray', borderRadius: '5px' }} className='fas fa-qrcode' />
            {qrModal && loadQrComponent && <QrCodeComponent isContainer={true} />}
        </div>
    )
}

export default AddContainerQRCode
