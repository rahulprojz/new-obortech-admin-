import { useContext, useState } from 'react'
import { updateItem } from '../../lib/api/item'
import { updateContainer } from '../../lib/api/container'
import EventContext from '../../store/event/eventContext'
import notify from '../../lib/notifier'

function QrCodeHook(qrCodeValue, setQrCodeValue, setQrModal, manualQR, isContainer) {
    const [isLoading, setIsLoading] = useState(false)
    const { itemsNames, containersName, setLastItemUpdatedAt } = useContext(EventContext)

    const updateQrCode = async () => {
        try {
            setIsLoading((prev) => !prev)
            if (qrCodeValue) {
                if (!isContainer) await updateItem({ id: itemsNames.selected.value, manual_code: manualQR })
                else {
                    await updateContainer({ id: containersName.selected.value, containerID: containersName.selected.label, unique_code: qrCodeValue, manual_code: manualQR })
                }
            }
            setQrCodeValue(null)
            setQrModal((prev) => !prev)
            setLastItemUpdatedAt(new Date())
        } catch (err) {
            notify({ error: err.message || err.toString() })
        }
        setIsLoading((prev) => !prev)
    }

    return { isLoading, updateQrCode }
}

export default QrCodeHook
