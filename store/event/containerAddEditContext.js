import React, { createContext, useEffect, useState } from 'react'
import { fetchDevices } from '../../lib/api/device'

const ContainerAddEditContext = createContext({})

export const ContainerAddEditContextProvider = (props) => {
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

    return <ContainerAddEditContext.Provider value={context}>{props.children}</ContainerAddEditContext.Provider>
}

export default ContainerAddEditContext
