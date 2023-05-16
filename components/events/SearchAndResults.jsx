import { components } from 'react-select'
import AdvanceSelect from '../common/form-elements/select/AdvanceSelect'
import string from '../../utils/LanguageTranslation'

const viewCustomStyles = {
    multiValueRemove: (base, state) => {
        return state.data.isFixed ? { ...base, display: 'none' } : base
    },
    menu: (base, state) => {
        return {
            ...base,
            boxShadow: state?.selectProps?.inputValue ? base.boxShadow : 'none',
        }
    },
}

const SearchAndResults = ({ selections, updateSelection, searchType = 'item' }) => {
    if (typeof window === 'undefined') {
        return null
    }

    const isContainer = searchType == 'container'
    const selection = isContainer ? selections.containers : selections.items

    const onChangeAction = (select, action, type) => {
        updateSelection(select, type, true)
    }

    const filterOption = (option, inputValue, type) => {
        const { label } = option
        let otherKey = []
        if (type == 'container') {
            if (!inputValue.trim()) return selections.containers
            otherKey = selections.containers.filter((opt) => opt.label === label && opt.label.toLowerCase().includes(inputValue.toLowerCase()))
        } else {
            if (!inputValue.trim()) return selections.items
            otherKey = selections.items.filter((opt) => opt.label === label && opt.label.toLowerCase().includes(inputValue.toLowerCase()))
        }
        return label.includes(inputValue) || otherKey.length > 0
    }

    const IndicatorsContainer = () => {
        return null
    }

    const MenuList = (props) => {
        if (props?.selectProps?.inputValue) return <components.MenuList {...props}>{props.children}</components.MenuList>
        return null
    }

    return (
        <>
            <div className={`group-item-container ${isContainer ? 'pb-3' : ''}`}>
                <AdvanceSelect
                    isMulti
                    className='basic-single'
                    classNamePrefix='select'
                    isClearable={false}
                    isSearchable
                    filterOption={(option, inputValue) => filterOption(option, inputValue, searchType)}
                    name={string.fileName}
                    options={selection.filter((groupItems) => !groupItems.isSelected)}
                    components={{ IndicatorsContainer, MenuList }}
                    placeholder=''
                    onChange={(select, action) => onChangeAction(select, action, searchType)}
                    value={[]}
                    styles={viewCustomStyles}
                />
                <div className={`${searchType}-list mt-2`}>
                    {selection.length > 0 &&
                        selection
                            .filter((container) => container.isSelected)
                            .map((groupItems) => (
                                <div className='group-item-badge'>
                                    <div className='group-item-label'>
                                        <span style={{ color: isContainer ? '#a940a5' : '#6a8fd7' }}>{groupItems[searchType][`${searchType}ID`]}</span>
                                    </div>
                                    <div className='group-item-remove' onClick={() => updateSelection(groupItems[searchType], searchType, false)}>
                                        <svg height='14' width='14' viewBox='0 0 20 20' aria-hidden='true' focusable='false' className='css-19bqh2r'>
                                            <path d='M14.348 14.849c-0.469 0.469-1.229 0.469-1.697 0l-2.651-3.030-2.651 3.029c-0.469 0.469-1.229 0.469-1.697 0-0.469-0.469-0.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-0.469-0.469-0.469-1.228 0-1.697s1.228-0.469 1.697 0l2.652 3.031 2.651-3.031c0.469-0.469 1.228-0.469 1.697 0s0.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c0.469 0.469 0.469 1.229 0 1.698z' />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                </div>
            </div>
        </>
    )
}

export default SearchAndResults
