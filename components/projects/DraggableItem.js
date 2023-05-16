import React, { useState, useMemo, useRef, useEffect } from 'react'
import Sortable from 'sortablejs'
// import interact from 'interactjs'
import dynamic from 'next/dynamic'
import Input from '../common/form-elements/input/Input'
import CustomSelect from '../common/form-elements/select/CustomSelect'
import string from '../../utils/LanguageTranslation'
import notify from '../../lib/notifier'
import MapGeofencing from './MapGeofencing'

export const DraggableItem = (props) => {
    const interact = dynamic(() => import('interactjs'), { ssr: false })
    const { mode, selectedTab, listItems, initialItems, project, state, setState, updateSelectedRoadRadius, stations, allRoadsMappingRef, selectedRoadRadius } = props
    const [selectedStation, setSelectedStation] = useState({})
    const [listIndex, setListIndex] = useState({})
    const selectedRoadRadiusRef = useRef(selectedRoadRadius)
    const mapRef = useRef()
    const allRoadsMapping = allRoadsMappingRef.current
    const [isOpen, setIsOpen] = useState(false)
    const modalOpen = (index) => {
        setSelectedStation(listItems[index])
        setListIndex(index)
        setIsOpen(true)
    }

    const getDrawingMode = () => {
        if (mapRef?.current?.getDrawingMode) {
            return mapRef.current.getDrawingMode()
        }
        return 'draw-circle'
    }

    const onSubmit = () => {
        listItems[listIndex].notEditable = true
        const drawingMode = getDrawingMode()
        listItems[listIndex].drawingMode = drawingMode
        drawingMode == 'draw-shape' ? (listItems[listIndex].radius = allRoadsMapping[listItems[listIndex].road_id].radius) : (listItems[listIndex].pathArray = [])
        setIsOpen(false)
    }

    const onBack = () => {
        listItems[listIndex].radius = allRoadsMapping[listItems[listIndex].road_id].radius
        setIsOpen(false)
    }

    const updateSelectedRoad = (value, i) => {
        if (listItems[i]?.drawingMode == 'draw-shape') {
            listItems[i].pathArray = []
        }
        const newobj = {
            ...listItems[i],
            radius: value,
        }
        listItems[i] = newobj
        // inputRef.value= value
        setState({
            project: Object.assign({}, project, {
                selectedRoads: listItems,
            }),
        })
    }
    useEffect(() => {
        selectedRoadRadiusRef.current = props.selectedRoadRadius
    }, [props.selectedRoadRadius])

    const el = document.getElementById('station-lists')
    if (el) {
        Sortable.create(el, {
            group: 'station-lists',
            animation: 100,
            filter: '.ignore-drag',
            // onMove: (e) => {
            //     if (dragTimer) clearTimeout(dragTimer)
            //     dragTimer = setTimeout(() => {
            //         updatePosition(e.target)
            //     }, 1000)
            // },
        })
    }

    const allItemLists = useMemo(() => {
        return listItems
    }, [listItems])

    return (
        <>
            <ul id='station-lists' className='p-0'>
                {allItemLists.map((it, i) => {
                    const disableStatus = mode == 'edit' && !state?.project?.isDraft ? i < initialItems : false
                    const isDisabled = disableStatus && mode == 'edit' && selectedTab == 'PROJECT_LISTING'
                    if (isDisabled || it.notEditable) it.radius = it.radius || (it.road_id && allRoadsMapping[it.road_id] && allRoadsMapping[it.road_id].radius)
                    const selectedRoad = it
                    const isDefaultRadius = selectedRoad.radius == allRoadsMapping[selectedRoad.road_id]?.radius

                    return (
                        <li id={selectedRoad?.road_id}>
                            <tr>
                                <td width='4%'>
                                    <i className='fa fa-sort' />
                                </td>
                                <td width='27%'>
                                    <CustomSelect
                                        className='form-control'
                                        disabled={isDisabled}
                                        onChange={(event) => {
                                            event.preventDefault()
                                            const index = selectedRoadRadiusRef.current.filter((roadData, index) => i != index && roadData.latitude == allRoadsMapping[event.target.value]?.latitude && roadData.longitude == allRoadsMapping[event.target.value]?.longitude)
                                            if (index.length) {
                                                event.stopPropagation()
                                                notify(string.selectRoadOverlapError)
                                                return
                                            }

                                            const tmpSelectedRoads = listItems
                                            listItems[i].notEditable = true
                                            tmpSelectedRoads[i].road_id = event.target.value
                                            tmpSelectedRoads[i].radius = allRoadsMapping[selectedRoad.road_id].radius
                                            tmpSelectedRoads[i].pathArray = []
                                            setState({
                                                project: Object.assign({}, project, {
                                                    selectedRoads: tmpSelectedRoads,
                                                }),
                                            })
                                            updateSelectedRoadRadius(tmpSelectedRoads)
                                        }}
                                        value={selectedRoad.road_id || '0'}
                                        options={stations}
                                    />
                                </td>
                                <td width='20%'>
                                    <span>{selectedRoad.road_id && allRoadsMapping[selectedRoad.road_id] ? allRoadsMapping[selectedRoad.road_id].latitude : `${string.selectRoad}`}</span>
                                </td>
                                <td width='20%'>
                                    <span>{selectedRoad.road_id && allRoadsMapping[selectedRoad.road_id] ? allRoadsMapping[selectedRoad.road_id].longitude : `${string.selectRoad}`}</span>
                                </td>
                                <td width='18%'>
                                    <Input
                                        type='number'
                                        className='w-100'
                                        placeholder={allRoadsMapping[selectedRoad.road_id]?.radius || ''}
                                        name={`radius${i}`}
                                        onFocus={() => (listItems[i].notEditable = false)}
                                        onChange={(e) => {
                                            updateSelectedRoad(e.target.value, i)
                                        }}
                                        disabled={(disableStatus && mode == 'edit') || !selectedRoad.road_id}
                                        value={selectedRoad.radius || ''}
                                    />
                                </td>
                                <td width='11%'>
                                    <div className='d-flex'>
                                        <div onClick={() => !disableStatus && selectedRoad.road_id && modalOpen(i)}>
                                            {' '}
                                            <img
                                                src={`/static/img/event-icon/${(disableStatus && mode == 'edit' && selectedTab == 'PROJECT_LISTING') || !selectedRoad.road_id ? 'geofencing-disable' : 'geofencing'}.png`}
                                                style={{ cursor: (disableStatus && mode == 'edit' && selectedTab == 'PROJECT_LISTING') || !selectedRoad.road_id ? 'not-allowed' : 'pointer' }}
                                                alt='OBORTECH'
                                            />
                                        </div>
                                        {disableStatus && mode == 'edit' && selectedTab == 'PROJECT_LISTING' ? (
                                            <i className='fa fa-trash mt-2' style={{ color: '#BEBEBE', cursor: 'not-allowed' }} />
                                        ) : (
                                            <i
                                                className='fa fa-trash mt-2'
                                                onClick={(event) => {
                                                    event.preventDefault()
                                                    const selectedRoads = listItems
                                                    selectedRoads.splice(i, 1)
                                                    project.selectedRoads = selectedRoads
                                                    setState({
                                                        project: Object.assign({}, project, { selectedRoads }),
                                                    })
                                                    updateSelectedRoadRadius(selectedRoads)
                                                }}
                                            />
                                        )}
                                    </div>
                                </td>
                            </tr>
                        </li>
                    )
                })}
            </ul>
            {isOpen && <MapGeofencing isOpen={isOpen} allRoadsMapping={allRoadsMapping} selectedRoad={selectedStation} listIndex={listIndex} listItems={listItems} onBack={onBack} onSubmit={onSubmit} mapRef={mapRef} />}
        </>
    )
}
