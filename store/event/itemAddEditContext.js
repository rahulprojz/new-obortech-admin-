import React, { createContext, useEffect, useState } from 'react'
import { fetchDevices } from '../../lib/api/device'

const ItemAddEditContext = createContext({})

export const ItemAddEditContextProvider = (props) => {
    const [modal, setModal] = useState(false)
    const [operation, setOperation] = useState('')
    const [availableIotDevices, setAvailableIotDevices] = useState(null)

    useEffect(() => {
        ;(async () => {
            let devices = await fetchDevices()
            setAvailableIotDevices(devices)
        })()
    }, [])

    const operator = {
        CREATE: 'create',
        EDIT: 'edit',
    }

    const context = {
        modal,
        setModal,
        operation,
        setOperation,
        operator,
        availableIotDevices,
    }

    return <ItemAddEditContext.Provider value={context}>{props.children}</ItemAddEditContext.Provider>
}

export default ItemAddEditContext
