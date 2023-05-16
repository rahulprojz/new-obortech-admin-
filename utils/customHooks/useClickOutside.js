import { useEffect, useState } from 'react'

/**
 * Hook that alerts clicks outside of the passed ref
 */
export function useOutsideClick(ref) {
    const [clickOutside, setOutside] = useState(false)
    useEffect(() => {
        /**
         * Alert if clicked on outside of element
         */
        function handleClickOutside(event) {
            const condition = Array.isArray(ref) ? event.target.innerHTML != '...' && event.target.getAttribute('name') != 'collapse' : ref.current && !ref.current.contains(event.target)
            if (condition) {
                setOutside(true)
            } else {
                setOutside(false)
            }
        }

        // Bind the event listener
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [ref])
    return clickOutside
}
