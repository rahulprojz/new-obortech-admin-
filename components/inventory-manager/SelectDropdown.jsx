import React, { useState } from 'react'
import Select from 'react-select'

const SelectDropdown = (props) => {
    const { availables = [], className = '', isPublicUser = false, styleDropdown, index, setFilterObj, filterObj, text, isSearchable = false } = props
    const [selectedOption, setSelectedOption] = useState(availables[0])

    return (
        <>
            <div className={className} style={styleDropdown ? { ...styleDropdown, width: '17%' } : { width: '180px' }} id='groupNameSelect'>
                <Select
                    isSearchable={isSearchable}
                    options={availables}
                    styles={{
                        valueContainer: (provided, state) => ({
                            ...provided,
                            display: 'flex',
                            justifyContent: 'center',
                        }),
                    }}
                    menuPortalTarget={document.querySelector('body')}
                    isDisabled={isPublicUser}
                    value={selectedOption}
                    onChange={(option) => {
                        setSelectedOption(option)
                        if (filterObj) {
                            const filterVal = filterObj
                            if (text == 'Suppliers' || text == 'Receivers') {
                                filterVal[Object.keys(filterVal)[index - 1]] = option.value
                            } else {
                                filterVal[Object.keys(filterVal)[index - 1]] = text == 'Category' ? option.value : option.value ? option.label : ''
                            }
                            setFilterObj({ ...filterObj, ...filterVal })
                        }
                    }}
                />
            </div>
        </>
    )
}

export default SelectDropdown
