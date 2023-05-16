import React from 'react'
import ContainerNameFilterWatchAll from './watchAllEventFilter/ContainerNameFilterWatchAll'
import GroupNameFilterWatchAll from './watchAllEventFilter/GroupNameFilterWatchAll'
import ItemNameFilterWatchAll from './watchAllEventFilter/ItemNameFilterWatchAll'
import ProjectFilter from './watchAllEventFilter/ProjectFilter'
import TruckNameFilterWatchAll from './watchAllEventFilter/TruckNameFilterWatchAll'

const customStyles = {
    control: (provided) => ({
        ...provided,
        minHeight: 36,
        height: 36,
        fontSize: 14,
        borderRadius: 0,
        color: '#6e707e',
        borderLeft: 'none',
        borderTop: 'none',
        borderRight: 'none',
        outline: 'none',
    }),
    dropdownIndicator: (provided) => ({
        ...provided,
        borderLeft: 'none',
    }),
}

const dropDownStyle = { width: '170px', marginLeft: '12px' }

const WatchAllEventFilter = ({ project }) => {
    return (
        <>
            <ProjectFilter project={project} customStyles={customStyles} dropDownStyle={dropDownStyle} />
            <GroupNameFilterWatchAll project={project} customStyles={customStyles} dropDownStyle={dropDownStyle} />
            <TruckNameFilterWatchAll project={project} customStyles={customStyles} dropDownStyle={dropDownStyle} />
            <ContainerNameFilterWatchAll project={project} customStyles={customStyles} dropDownStyle={dropDownStyle} />
            <ItemNameFilterWatchAll project={project} customStyles={customStyles} dropDownStyle={dropDownStyle} />
        </>
    )
}

export default WatchAllEventFilter
