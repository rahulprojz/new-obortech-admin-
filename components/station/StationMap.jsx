import React, { useRef, useMemo, useEffect, useImperativeHandle } from 'react'
import Autocomplete from 'react-google-autocomplete'
import { MapContainer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import ReactLeafletGoogleLayer from 'react-leaflet-google-layer'
import Geocode from 'react-geocode'
import string from '../../utils/LanguageTranslation'

const { GOOGLE_API_KEY } = process.env
Geocode.setApiKey(GOOGLE_API_KEY)
let searchChange = true

const StationMap = ({ selectedPosition, setSelectedPosition }) => {
    const searchRef = useRef()

    useMemo(() => {
        setTimeout(() => {
            if (searchRef?.current?.setViewMap) {
                searchRef.current.setViewMap(selectedPosition)
            }
        }, 500)
    }, [selectedPosition, searchRef.current])

    const oneIcon = L.icon({
        iconUrl: '/static/img/marker-icon.png',
        iconSize: [30, 30],
        iconAnchor: [10, 10],
        popupAnchor: [0, -5],
    })

    const setAddress = (lat, lng) => {
        Geocode.fromLatLng(lat, lng).then(
            (response) => {
                const address = response.results[0].formatted_address
                if (document.querySelector('.form-control.pac-target-input')) {
                    document.querySelector('.form-control.pac-target-input').value = address
                }
            },
            (error) => {
                console.error(error)
            },
        )
    }

    const Markers = ({ mapRef }) => {
        const map = useMapEvents({
            click(e) {
                setSelectedPosition([e.latlng.lat, e.latlng.lng])
                map.setView(e.latlng)
            },
        })
        useImperativeHandle(mapRef, () => ({
            setViewMap: (sposition) => {
                map.setView(sposition)
            },
        }))

        return selectedPosition ? <Marker icon={oneIcon} key={selectedPosition[0]} position={selectedPosition} interactive={false} /> : null
    }

    const onAddressSeleted = (location) => {
        Geocode.fromAddress(location.formatted_address).then(
            (response) => {
                const { lat, lng } = response.results[0].geometry.location
                searchChange = false
                setSelectedPosition([lat, lng])
            },
            (error) => {
                console.error(error)
            },
        )
    }

    useEffect(() => {
        if (searchChange && (selectedPosition[0] || selectedPosition[1])) {
            setAddress(selectedPosition[0], selectedPosition[1])
        }
        searchChange = true
    }, [selectedPosition])

    return (
        <>
            <div className='form-group col-md-12 p-0'>
                <label htmlFor='longitude' className='col-md-12 col-form-label pl-0'>
                    {string.onboarding.address}
                </label>
                <Autocomplete
                    apiKey={GOOGLE_API_KEY}
                    onPlaceSelected={(selected) => {
                        onAddressSeleted(selected)
                    }}
                    options={{
                        types: [],
                    }}
                    className='form-control'
                />
            </div>
            <MapContainer center={selectedPosition} zoom={12} scrollWheelZoom attributionControl={false}>
                <ReactLeafletGoogleLayer apiKey={GOOGLE_API_KEY} type='hybrid' />
                <Markers mapRef={searchRef} />
            </MapContainer>
        </>
    )
}

export default StationMap
