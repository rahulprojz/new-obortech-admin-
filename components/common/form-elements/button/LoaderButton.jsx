import React from 'react'
import PropTypes from 'prop-types'
import { Spinner } from 'reactstrap'
import './Button.css'

const LoaderButton = (props) => {
    const { text, isLoading, type = '', cssClass, className, ...btnprops } = props
    const cssclass = className || `btn btn-primary large-btn ${cssClass}`
    return (
        <button {...btnprops} type={type} className={isLoading ? `deactivebutton ${cssclass}` : `${cssclass}`}>
            {isLoading ? <Spinner size='sm' /> : text}
        </button>
    )
}

LoaderButton.defaultProps = {
    text: 'Save',
    type: '',
    isLoading: false,
    cssClass: '',
    className: '',
}

LoaderButton.propTypes = {
    text: PropTypes.any,
    type: PropTypes.string,
    isLoading: PropTypes.bool,
    cssClass: PropTypes.string,
}

export default LoaderButton
