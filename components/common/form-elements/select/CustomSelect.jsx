import React from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import './Select.css'
import string from '../../../../utils/LanguageTranslation.js'

const CustomSelect = (props) => {
    const { children, options, value, onChange, className, id, name, defaultOptionText = `${string.project.selectOne}` } = props
    return (
        <select
            {...props}
            // onChange={onChange ? onChange : null}
            className={`default-css ${className}`}
            id={id ? id : null}
            name={name ? name : null}
            // value={value ? value : null}
        >
            {children ? (
                children
            ) : (
                <>
                    <option value=''>{defaultOptionText}</option>
                    {_.map(options, (option, i) => (
                        <option key={i} value={option.id}>
                            {option.name}
                        </option>
                    ))}
                </>
            )}
        </select>
    )
}

CustomSelect.propTypes = {
    onChange: PropTypes.func,
    className: PropTypes.string,
    name: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    children: PropTypes.node,
    defaultOptionText: PropTypes.string,
}

export default CustomSelect
