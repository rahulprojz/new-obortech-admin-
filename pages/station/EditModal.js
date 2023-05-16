// updated
import React, { useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import dynamic from 'next/dynamic'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import FormHelperMessage from '../../components/common/form-elements/formHelperMessage'
import Input from '../../components/common/form-elements/input/Input'
import string from '../../utils/LanguageTranslation'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'
import notify from '../../lib/notifier'

const StationMap = dynamic(
    () => {
        return import('../../components/station/StationMap')
    },
    { ssr: false },
)
function EditModal({ isOpen, toggle, station, state, updateStation, paginationData }) {
    const [selectedPosition, setSelectedPosition] = useState([station.latitude, station.longitude])
    const [submitBtnDisable, setSubmitBtnDisable] = useState(false)
    const [overlapError, setOverlapError] = useState(false)

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            name: station.name || '',
            latitude: selectedPosition[0] || '',
            longitude: selectedPosition[1] || '',
            radius: station.radius || 0,
        },
        validationSchema: Yup.object().shape({
            name: Yup.string()
                .trim()
                .required(`${string.tableColName} ${string.errors.required}`)
                .matches(/^(?!.*["'`\\])/, `${string.tableColName} ${string.errors.invalid}`),
            latitude: Yup.number().typeError(`${string.latitude} ${string.errors.mustbeNumber}`).required(`${string.latitude} ${string.errors.required}`),
            longitude: Yup.number().typeError(`${string.longitude} ${string.errors.mustbeNumber}`).required(`${string.longitude} ${string.errors.required}`),
            radius: Yup.number().typeError(`${string.radiusTxt} ${string.errors.mustbeNumber}`).moreThan(0, `${string.radiusTxt} ${string.errors.mustGreaterthan} 0`).required(`${string.radiusTxt} ${string.errors.required}`),
        }),
        onSubmit: async (values, { resetForm }) => {
            setSubmitBtnDisable(true)
            const overlapValue = paginationData.list.every((element) => {
                if (element.id === station.id) {
                    return true
                }
                const lat1 = element.latitude
                const lon1 = element.longitude
                const rad1 = element.radius
                const lat2 = values.latitude
                const lon2 = values.longitude
                const rad2 = values.radius
                const radiusSum = parseFloat(rad1) + parseFloat(rad2)
                var R = 6378.137 // Radius of earth in KM
                var dLat = (lat2 * Math.PI) / 180 - (lat1 * Math.PI) / 180
                var dLon = (lon2 * Math.PI) / 180 - (lon1 * Math.PI) / 180
                var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
                var d = R * c
                var distanceInMeter = d * 1000 //meter

                if (distanceInMeter < radiusSum) {
                    return false
                }
                return true
            })
            if (values.latitude == 0 || values.longitude == 0) {
                notify(`${string.station.addressErr}`)
                setSubmitBtnDisable(false)
            } else if (!overlapValue) {
                notify(`${string.selectRoadOverlapError}`)
                setSubmitBtnDisable(false)
                resetForm({})
            } else {
                state({
                    station: Object.assign({}, station, {
                        name: values.name,
                        latitude: values.latitude,
                        longitude: values.longitude,
                        radius: values.radius,
                    }),
                })

                await updateStation(values)
                setSubmitBtnDisable(false)
                toggle()
                resetForm({})
            }
        },
    })

    const updateSelectPosition = (position) => {
        setSelectedPosition(position)
        formik.setFieldValue('latitude', position[0])
        formik.setFieldValue('longitude', position[1])
    }

    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <Modal isOpen={isOpen} toggle={toggle} className='customModal' size='xl'>
                <ModalHeader toggle={toggle}>
                    <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                        {string.station.editStation}
                    </h5>
                </ModalHeader>
                <ModalBody className='text-left mb-5'>
                    <form className='form-container' onSubmit={formik.handleSubmit}>
                        <div className='row'>
                            <div className='col-6 row ml-0 mr-0 content-block'>
                                <div className='form-group col-md-12 p-0'>
                                    <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                        {string.tableColName}
                                    </label>
                                    <Input type='text' name='name' id='name' className='form-control' placeholder={string.tableColName} onChange={formik.handleChange} value={formik.values.name} />
                                    {formik.errors.name ? <FormHelperMessage className='err' message={formik.errors.name} /> : null}
                                </div>

                                <div className='form-group col-md-12 p-0'>
                                    <label htmlFor='latitude' className='col-md-12 col-form-label pl-0'>
                                        {string.latitude}
                                    </label>
                                    <Input type='number'
                                           name='latitude' 
                                           id='latitude' 
                                           className='form-control' 
                                           placeholder={string.latitude} 
                                           onChange={(e)=>{
                                            formik.handleChange(e);
                                            const latt = e.target.value;
                                            updateSelectPosition([latt,selectedPosition[1]]) 
                                        }} 
                                           value={formik.values.latitude} 
                                    />
                                    {formik.errors.latitude ? <FormHelperMessage className='err' message={formik.errors.latitude} /> : null}
                                </div>

                                <div className='form-group col-md-12 p-0'>
                                    <label htmlFor='longitude' className='col-md-12 col-form-label pl-0'>
                                        {string.longitude}
                                    </label>
                                    <Input type='number' 
                                           name='longitude' 
                                           id='longitude' 
                                           className='form-control' 
                                           placeholder={string.longitude} 
                                           onChange={(e)=>{
                                            formik.handleChange(e);
                                            const lang = e.target.value;
                                            updateSelectPosition([selectedPosition[0],lang])
                                           }} 
                                           value={formik.values.longitude} 
                                    />
                                    {formik.errors.longitude ? <FormHelperMessage className='err' message={formik.errors.longitude} /> : null}
                                </div>

                                <div className='form-group col-md-12 p-0'>
                                    <label htmlFor='longitude' className='col-md-12 col-form-label pl-0'>
                                        {string.radius}
                                    </label>
                                    <Input type='number' name='radius' id='radius' className='form-control' placeholder={string.radius} onChange={formik.handleChange} value={formik.values.radius} />
                                    {formik.errors.radius ? <FormHelperMessage className='err' message={formik.errors.radius} /> : null}
                                </div>
                                <div style={{ margin: '30px auto' }}>
                                    <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={submitBtnDisable} text={string.updateBtnTxt} />
                                </div>
                            </div>
                            <div className='col-6'>
                                <StationMap selectedPosition={selectedPosition} setSelectedPosition={setSelectedPosition} />
                            </div>
                        </div>
                    </form>
                </ModalBody>
            </Modal>
        )
    }
}

EditModal.propTypes = {}
EditModal.defaultProps = {}

export default EditModal
