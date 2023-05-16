import React, { useState, useRef, useCallback } from 'react'
import { withGoogleMap, withScriptjs, GoogleMap, Polygon, Circle } from 'react-google-maps'
import { computeOffset } from 'spherical-geometry-js'
import { PolyUtil } from 'node-geometry-library'
import notify from '../../lib/notifier'
import string from '../../utils/LanguageTranslation'

const GeoFencing = ({ props }) => {
    const { selectedRoad, allRoadsMapping, listItems, listIndex, drawingMode, setDrawingMode } = props
    const isDefaultPolygon = !!(selectedRoad.road_id && allRoadsMapping[selectedRoad.road_id] && allRoadsMapping[selectedRoad.road_id].paths)
    const lat = selectedRoad.road_id && allRoadsMapping[selectedRoad.road_id] ? parseFloat(allRoadsMapping[selectedRoad.road_id].latitude) : 0
    const lng = selectedRoad.road_id && allRoadsMapping[selectedRoad.road_id] ? parseFloat(allRoadsMapping[selectedRoad.road_id].longitude) : 0
    let paths = listItems[listIndex]?.pathArray || (selectedRoad.road_id && allRoadsMapping[selectedRoad.road_id] && allRoadsMapping[selectedRoad.road_id].paths ? JSON.parse(allRoadsMapping[selectedRoad.road_id].paths) || [] : [])
    let radius = parseInt(listItems[listIndex].radius) || (selectedRoad.road_id && allRoadsMapping[selectedRoad.road_id] ? parseInt(allRoadsMapping[selectedRoad.road_id].radius) : 200)
    const zoomLevel = listItems[listIndex].zoomLevel || 12
    const [polygonData, setPolygonData] = useState(paths)
    const drawingManager = [
        { mode: 'stop-drawing', title: 'Stop drawing' },
        { mode: 'draw-circle', title: 'Draw a circle' },
        { mode: 'draw-shape', title: 'Draw a shape' },
    ]

    // Define refs for Polygon instance
    const polygonRef = useRef(null)

    // Call manipulate the polygon path
    function updatePolygon(e) {
        let coords = e
            .getPath()
            .getArray()
            .map((coord) => {
                return {
                    lat: coord.lat(),
                    lng: coord.lng(),
                }
            })
        const isContainsLocation = PolyUtil.containsLocation({ lat, lng }, coords)
        if (!isContainsLocation) {
            coords = paths
            notify(string.drawPolygonSelectedPoint)
        }
        paths = coords
        setPolygonData([...coords])
        listItems[listIndex].pathArray = coords
    }

    // Call update the circle radius
    function updateRadius() {
        const updatedRadius = this.getRadius()
        radius = updatedRadius
        paths = []
        listItems[listIndex].pathArray = []
        listItems[listIndex].radius = updatedRadius
    }

    // Call change the circle center
    function updateCenter() {
        try {
            const circleLat = this.center.lat()
            const circleLng = this.center.lng()

            if (circleLat != lat || circleLng != lng) this.setCenter({ lat, lng })
        } catch (error) {
            console.log(error)
        }
    }

    // Get polygon path points from circle
    const getCirclePath = (points) => {
        const circlePoints = []
        const p = 360 / points
        let d = 0
        for (let i = 0; i < points; ++i, d += p) {
            circlePoints.push({ lat: computeOffset({ lat, lng }, radius, d).lat(), lng: computeOffset({ lat, lng }, radius, d).lng() })
        }
        return circlePoints
    }

    // Call change the shape
    const changeShape = (shapeType) => {
        listItems[listIndex].drawingMode = shapeType
        if (shapeType !== 'stop-drawing') {
            setDrawingMode(shapeType)
        }
        if (shapeType === 'draw-shape') {
            if (!isDefaultPolygon && !paths.length) {
                const circlePoints = getCirclePath(6)
                paths = circlePoints
                listItems[listIndex].pathArray = circlePoints
                setPolygonData([...circlePoints])
            }
        }
        if (shapeType === 'draw-circle') {
            radius = radius || 200
        }
    }

    function handleZoomChanged() {
        listItems[listIndex].zoomLevel = this.getZoom()
    }

    // Call setPath with new edited polygon path
    const onEdit = useCallback(() => {
        const polyRef = polygonRef.current
        if (polyRef) {
            updatePolygon(polyRef)
        }
    }, [setPolygonData])

    return (
        <>
            <div className='drawing-manager' role='menubar'>
                {drawingManager.length > 0 &&
                    drawingManager.map((drawingModes) => (
                        <div className={drawingModes.mode}>
                            <button type='button' className={drawingMode === drawingModes.mode || drawingModes.mode === 'stop-drawing' ? 'active' : undefined} aria-label={drawingModes.title} title={drawingModes.title} onClick={() => changeShape(drawingModes.mode)}>
                                <span>
                                    <div>
                                        <img alt='' src='/static/img/drawing-manager.png' />
                                    </div>
                                </span>
                            </button>
                        </div>
                    ))}
            </div>
            <GoogleMap defaultZoom={zoomLevel} defaultCenter={{ lat, lng }} onZoomChanged={handleZoomChanged} options={{ streetViewControl: false, mapTypeControl: false }} mapTypeId='hybrid'>
                {drawingMode === 'draw-circle' && (
                    <Circle
                        draggable={false}
                        defaultDraggable={false}
                        defaultCenter={{
                            lat,
                            lng,
                        }}
                        radius={radius}
                        editable
                        options={{
                            fillColor: '#000',
                            fillOpacity: 0.5,
                            strokeWeight: 2,
                            zIndex: 1,
                            draggable: false,
                        }}
                        onRadiusChanged={updateRadius}
                        onCenterChanged={updateCenter}
                    />
                )}
                {drawingMode === 'draw-shape' && <Polygon ref={polygonRef} editable draggable={false} path={polygonData} onMouseUp={onEdit} />}
            </GoogleMap>
        </>
    )
}

const MapComponent = withScriptjs(withGoogleMap(GeoFencing))

const ProjectMap = (props) => (
    <MapComponent
        googleMapURL={`https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_API_KEY}&v=3.exp&libraries=geometry,drawing,places`}
        loadingElement={<div style={{ height: `100%` }} />}
        containerElement={<div style={{ height: `400px`, width: '100%' }} />}
        mapElement={<div style={{ height: `100%` }} />}
        props={props}
    />
)

export default ProjectMap
