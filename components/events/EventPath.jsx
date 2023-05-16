import React from 'react'

const EventPath = ({ project_event }) => {
    const { itemName, groupName, containerName, truckName, projectName } = project_event

    const checkGroup = (name) => {
        const position = `${name}`.search('No Group')
        return !(position > -1)
    }

    const eventPath = (
        <>
            <span>{itemName}</span> -<span>{containerName}</span>
            {checkGroup(truckName) && (
                <>
                    {' '}
                    -<span>{truckName}</span>
                </>
            )}{' '}
            {checkGroup(groupName) && (
                <>
                    -<span>{groupName}</span>
                </>
            )}{' '}
            -<span>{projectName}</span>
        </>
    )
    return (
        <>
            {eventPath}

            <style jsx>
                {`
                    span {
                        color: #6e707e;
                    }
                `}
            </style>
        </>
    )
}

export default EventPath
