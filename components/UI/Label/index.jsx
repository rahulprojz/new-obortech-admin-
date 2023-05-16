import React, { Fragment } from 'react'

const FormatLabel = ({ user, org }) => {
    return (
        <Fragment>
            <span style={{ color: '#ED8931' }}>{user} </span>
            <span style={{ color: '#a56233' }}>{org}</span>
        </Fragment>
    )
}

export default FormatLabel
