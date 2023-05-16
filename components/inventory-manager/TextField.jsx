import React from 'react'

import FormHelperMessage from '../common/form-elements/formHelperMessage'

const TextField = ({ name, label, value, onChange, error }) => {
    return (
        <>
            <label htmlFor={name} className='col-md-12 col-form-label pl-0 mb-1 text-secondary'>
                {label}
            </label>
            <input type='text' name={name} id='assetNameEng' className='form-control font-weight-bold text-dark' value={value} onChange={onChange} style={{ borderColor: '#cccccc' }} />
            <FormHelperMessage className='err mb-2' message={error} />
        </>
    )
}

export default TextField
