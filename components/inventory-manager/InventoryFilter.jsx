import React from 'react'
import SelectDropDown from './SelectDropdown'

const InventoryFilter = (props) => {
    const { tabOptions, filterObj, setFilterObj, isVisible } = props

    return (
        <div className='d-flex event-filter' style={{ width: '90%' }}>
            {tabOptions?.tableHeaders.map((option, index) => {
                if (option.filterOptions && option.isAvailable && (option.text == 'Category' ? isVisible : true))
                    return <SelectDropDown isSearchable text={option.text} availables={option.filterOptions} index={index} styleDropdown={{ ...option.colGroupStyle.style, marginLeft: '4%' }} filterObj={filterObj} setFilterObj={setFilterObj} />
            })}
        </div>
    )
}

export default InventoryFilter
