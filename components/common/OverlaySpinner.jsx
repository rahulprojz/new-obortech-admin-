import React from 'react'
import { Spinner } from 'reactstrap'

const OverlaySpinner = () => {
    const spinnerStyle = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        opacity: '0.7',
        zIndex: '9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    }

    return (
        <div style={spinnerStyle} className='modal-spinner-box'>
            <Spinner size='sm' />
        </div>
    )
}

export default OverlaySpinner
