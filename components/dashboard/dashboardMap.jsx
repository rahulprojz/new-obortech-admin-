import { MapContainer, Marker, Popup, Polyline, Circle, Polygon,useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useState } from 'react'
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer'
import { useEffect } from 'react'
const { GOOGLE_API_KEY } = process.env

const DashboardMap = ({ mapMarker, polylines, startMarker, endMarker, stations }) => {
    const [zoom, setZoom] = useState(5)
    const [showStation, setShowStation] = useState(false)
    const defaultMapLoc = [stations[0]?.station?.latitude, stations[0]?.station?.longitude]
    const [center,setCenter] = useState(polylines.length ? [polylines[polylines.length - 1]?.fromLat, polylines[polylines?.length - 1].fromLong] : defaultMapLoc)
    const completedIcon = L.icon({
        iconUrl: '/static/img/red.png',
        iconSize: [20, 30], // size of the icon
        iconAnchor: [10, 15], // point of the icon which will correspond to marker's location
        popupAnchor: [0, -5], // point from which the popup should open relative to the iconAnchor
    })

    const oneIcon = L.icon({
        iconUrl: '/static/img/1.png',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -5],
    })
    const twoIcon = L.icon({
        iconUrl: '/static/img/2.png',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -5],
    })

    const showHideStations = () => {
        setShowStation(!showStation)
    }

    function ChangeView({ center, zoom }) {
        const map = useMap();
        map.flyTo(center);
        return null;
      }
      useEffect(()=>{
        const center =polylines.length ? [polylines[polylines.length - 1]?.fromLat, polylines[polylines?.length - 1].fromLong] : defaultMapLoc
        setCenter(center)
      },[polylines])

    return (
        !!stations.length && (
            <MapContainer style={{ zIndex: '1' }} center={center} zoom={zoom} scrollWheelZoom attributionControl={false}>
                <ChangeView center={center} zoom={zoom} />
                <ReactLeafletGoogleLayer apiKey={GOOGLE_API_KEY} type='hybrid' />
                {!!polylines.length && (
                    <>
                        {/* Current truck position marker */}
                        <Marker
                            position={mapMarker}
                            icon={completedIcon}
                            eventHandlers={{
                                click: () => {
                                    showHideStations()
                                },
                            }}
                        >
                            <Popup>
                                {mapMarker[0]} , {mapMarker[1]}
                            </Popup>
                        </Marker>
                        {/* Start position marker */}
                        <Marker position={startMarker.pos} icon={oneIcon}>
                            <Popup>
                                {startMarker.name}, {startMarker.pos[0]} - {startMarker.pos[1]}
                            </Popup>
                        </Marker>
                        {/* End position marker */}
                        <Marker position={endMarker.pos} icon={twoIcon}>
                            <Popup>
                                {endMarker.name}, {endMarker.pos[0]} - {endMarker.pos[1]}
                            </Popup>
                        </Marker>
                    </>
                )}
                {stations?.map((station, i) => {
                    if (showStation) {
                        if (station.paths) {
                            const path = JSON.parse(station.paths)
                            const polygon = []
                            path.map((item) => {
                                polygon.push([item.lat, item.lng])
                            })
                            return <Polygon key={i} positions={polygon} opacity={100} pathOptions={{ opacity: 0.8, weight: 2, fillOpacity: 0.5 }} />
                        }
                        return <Circle key={i} center={{ lat: station.station.latitude, lng: station.station.longitude }} radius={station.station.radius} opacity={100} pathOptions={{ opacity: 0.8, weight: 2, fillOpacity: 0.5 }} />
                    }
                })}
                {polylines?.map(({ fromLat, fromLong, toLat, toLong }, idx) => {
                    if (toLat) {
                        return (
                            <Polyline
                                key={idx}
                                positions={[
                                    [fromLat, fromLong],
                                    [toLat, toLong],
                                ]}
                                color='red'
                            />
                        )
                    }
                    return null
                })}
            </MapContainer>
        )
    )
}

export default DashboardMap
