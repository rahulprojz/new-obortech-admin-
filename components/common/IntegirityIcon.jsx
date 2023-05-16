import React from 'react'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { Tooltip } from 'react-bootstrap';
import propTypes from 'prop-types';

function IntegrityIcon({ data }) {
    let isAuthentic = 'fa fa-check text-secondary'
    if (data.integrity_status !== null) {
        isAuthentic = data.integrity_status ? 'fa fa-check text-success' : 'fa fa-times text-danger'
    }
    if (!data?.integrity_status && data?.integrity_status !== null) {
        return <OverlayTrigger
            placement="right"
            overlay={
                <Tooltip >
                    <p className='mb-1'>Last checked at : {data?.integrity_checked_at}</p>
                </Tooltip>
            }
        >
            <i className={isAuthentic} />
        </OverlayTrigger>

    } else {
        return <i className={isAuthentic} />
    }
}

IntegrityIcon.propTypes = {
    data: propTypes.object.isRequired,
}

export default IntegrityIcon
