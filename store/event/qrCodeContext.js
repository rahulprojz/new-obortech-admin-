import React, { createContext, useState } from 'react'
import ShortUniqueId from 'short-unique-id'

const QrCodeContext = createContext({})

export const QrCodeContextProvider = (props) => {
    const [modal, setModal] = useState(false)
    const [qrCodeValue, setQrCodeValue] = useState(null)
    const randomCode = new ShortUniqueId({ length: 30 })

    const context = {
        modal,
        setModal,
        randomCode,
        qrCodeValue,
        setQrCodeValue,
    }

    return <QrCodeContext.Provider value={context}>{props.children}</QrCodeContext.Provider>
}

export default QrCodeContext
