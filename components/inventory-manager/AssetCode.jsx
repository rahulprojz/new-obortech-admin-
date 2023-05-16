import React, { useState } from 'react'
import ShortUniqueId from 'short-unique-id'

import FormHelperMessage from '../common/form-elements/formHelperMessage'
import string from '../../utils/LanguageTranslation'

const AssetCode = ({ code, message, setAssetCode, isEditMode }) => {
    const [manualCode, setManualCode] = useState(false)
    const randomCode = new ShortUniqueId({ length: 10, dictionary: 'number' })

    const generateCode = () => {
        setAssetCode('asset_code', randomCode())
        setManualCode(true)
    }

    const handleChange = (e) => {
        const numberReg = /^[0-9\b]+$/
        if (e.target.value === '' || numberReg.test(e.target.value)) {
            setAssetCode('asset_code', e.target.value)
        }
    }

    return (
        <>
            <label htmlFor='asset-code' className='col-md-12 col-form-label pl-0 mb-1 text-secondary'>
                {string.inventory.assetCode}
            </label>
            <div className='row'>
                <input type='text' name='asset_code' id='asset_code' maxLength={10} className='form-control col-md-9 font-weight-bold text-dark' value={code} onChange={handleChange} onInput={(e) => setManualCode(false)} style={{ borderColor: '#cccccc' }} disabled={isEditMode || manualCode} />
                <div className='col-md-3'>
                    <button type='button' className='btn btn-primary ' style={{ width: '100%', padding: '4px 0px' }} onClick={generateCode} disabled={code != ''}>
                        {string.event.generate}
                    </button>
                </div>
            </div>
            <FormHelperMessage className='err mb-4' message={message} />
        </>
    )
}

export default AssetCode
