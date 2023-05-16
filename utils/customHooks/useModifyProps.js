import React, { useState, useRef } from 'react'

/**
 * Hook that modify the inital passed props to a component one time
 */
const useModifyProps = (callback) => {
    const [flag, setFlag] = useState(true)
    const data = useRef({})
    if (flag) {
        data.current = callback()
        setFlag(false)
    }
    return data
}

export default useModifyProps
