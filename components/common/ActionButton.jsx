import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import propTypes from 'prop-types'

const ActionButton = ({ icon, title, onClick, width, activeItem }) => {
    const [currentSubmitErrors, setCurrentSubmitErrors] = useState([])

    const submissionEventsError = useSelector((state) => state.integrityChecker.submissionEventsError)

    useEffect(() => setCurrentSubmitErrors(submissionEventsError), [submissionEventsError])
    const currentIntegrity = currentSubmitErrors.find(({ id }) => id === activeItem?._id)
    if (currentIntegrity && !currentIntegrity.status) {
        if (icon !== 'fas fa-sync fa-spin' && icon !== 'fa fa-refresh text-muted disable') {
            return (
                <i title={title}>
                    {' '}
                    <img className='integrity_img' width={width || 20} src='/static/img/icons8-refresh-error.svg' onClick={() => onClick()} />
                </i>
            )
        }
        if (icon === 'fa fa-refresh text-muted disable') {
            return (
                <i title={title}>
                    {' '}
                    <img style={{ opacity: '20%', cursor: 'not-allowed' }} className='integrity_img' width={width || 20} src='/static/img/icons8-refresh-error.svg' onClick={() => onClick()} />
                </i>
            )
        }
    }
    if (currentIntegrity && currentIntegrity.status) {
        if (icon !== 'fas fa-sync fa-spin' && icon !== 'fa fa-refresh text-muted disable') {
            return (
                <i title={title}>
                    {' '}
                    <img className='integrity_img' width={width || 20} src='/static/img/icons8-refresh-success.svg' onClick={() => onClick()} />
                </i>
            )
        }
        if (icon === 'fa fa-refresh text-muted disable') {
            return (
                <i title={title}>
                    {' '}
                    <img style={{ opacity: '20%', cursor: 'not-allowed' }} className='integrity_img' width={width || 20} src='/static/img/icons8-refresh-success.svg' onClick={() => onClick()} />
                </i>
            )
        }
    }
    if (icon === 'fa fa-refresh') {
        return (
            <i title={title}>
                <img className='integrity_img' width={width || 20} src='/static/img/icons8-refresh.svg' onClick={() => onClick()} />
            </i>
        )
    }
    if (icon === 'fas fa-sync fa-spin') {
        return (
            <i title={title}>
                <img className='integrity_img' width={width || 20} src='/static/img/icons8-refresh.gif' onClick={() => onClick()} />
            </i>
        )
    }
    if (icon === 'fa fa-refresh text-muted disable') {
        return (
            <i title={title}>
                <img style={{ opacity: '20%', cursor: 'not-allowed' }} className='integrity_img' width={width || 20} src='/static/img/icons8-refresh.svg' />
            </i>
        )
    }
    return <i className={`integrity_img ${icon}`} role='button' title={title} onClick={() => onClick()} />
}

ActionButton.propTypes = {
    title: propTypes.string.isRequired,
    icon: propTypes.string.isRequired,
    onClick: propTypes.func.isRequired,
}

export default ActionButton
