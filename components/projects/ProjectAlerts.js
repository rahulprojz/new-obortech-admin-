import { useEffect, useState } from 'react'
import _ from 'lodash'
import string from '../../utils/LanguageTranslation.js'
import notify from '../../lib/notifier'
import Input from '../common/form-elements/input/Input'
import Button from '../common/form-elements/button/Button'
import FormHelperMessage from '../common/form-elements/formHelperMessage'
import { Collapse, CardBody, Card } from 'reactstrap'
import { useFormik } from 'formik'
import * as Yup from 'yup'

const DEVICEDROPDOWN = '5'

const validationSchema = Yup.object().shape({
    temperature_alert_min: Yup.number()
        .typeError(`${string.project.minimumTemprature} ${string.errors.mustbeNumber}`)
        .lessThan(Yup.ref('temperature_alert_max'), `${string.project.minimumTemprature} ${string.errors.mustLessThan} ${string.project.maximumTemprature}`)
        .required(`${string.project.minimumTemprature} ${string.errors.required}`),

    temperature_alert_max: Yup.number()
        .typeError(`${string.project.maximumTemprature} ${string.errors.mustbeNumber}`)
        .moreThan(Yup.ref('temperature_alert_min'), `${string.project.maximumTemprature} ${string.errors.mustGreaterthan} ${string.project.minimumTemprature}`)
        .required(`${string.project.maximumTemprature} ${string.errors.required}`),

    temperature_alert_interval: Yup.number()
        .moreThan(0, `${string.project.alertInterval} ${string.errors.mustGreaterthan} 0`)
        .integer(`${string.project.alertInterval} ${string.errors.mustBeInteger}`)
        .typeError(`${string.project.alertInterval} ${string.errors.mustbeNumber}`)
        .required(`${string.project.alertInterval} ${string.errors.required}`),

    temperature_allowed_occurances: Yup.number()
        .integer(`${string.project.temperatureAllowedOccurence} ${string.errors.mustBeInteger}`)
        .typeError(`${string.project.temperatureAllowedOccurence} ${string.errors.mustbeNumber}`)
        .moreThan(-1, `${string.project.temperatureAllowedOccurence} ${string.errors.mustBeInteger}`)
        .required(`${string.project.temperatureAllowedOccurence} ${string.errors.required}`),

    humidity_alert_min: Yup.number()
        .typeError(`${string.project.minimumHumidity} ${string.errors.mustbeNumber}`)
        .lessThan(Yup.ref('humidity_alert_max'), `${string.project.minimumHumidity} ${string.errors.mustLessThan} ${string.project.maximumHumidityInterval}`)
        .required(`${string.project.minimumHumidity} ${string.errors.required}`),

    humidity_alert_max: Yup.number()
        .typeError(`${string.project.maximumHumidityInterval} ${string.errors.mustbeNumber}`)
        .notOneOf([Yup.ref('humidity_alert_min'), null], `${string.project.maximumHumidityInterval} ${string.errors.mustEqualTo} ${string.project.minimumHumidity}`)
        .moreThan(Yup.ref('humidity_alert_min'), `${string.project.maximumHumidityInterval} ${string.errors.mustGreaterthan} ${string.project.minimumHumidity}`)
        .required(`${string.project.maximumHumidityInterval} ${string.errors.required}`),

    humidity_alert_interval: Yup.number()
        .moreThan(0, `${string.project.humidityInterval} ${string.errors.mustGreaterthan} 0`)
        .integer(`${string.project.humidityInterval} ${string.errors.mustBeInteger}`)
        .typeError(`${string.project.humidityInterval} ${string.errors.mustbeNumber}`)
        .required(`${string.project.humidityInterval} ${string.errors.required}`),

    humidity_allowed_occurances: Yup.number()
        .integer(`${string.project.humidityOccurence} ${string.errors.mustBeInteger}`)
        .typeError(`${string.project.humidityOccurence} ${string.errors.mustbeNumber}`)
        .moreThan(-1, `${string.project.humidityOccurence} ${string.errors.mustBeInteger}`)
        .required(`${string.project.humidityOccurence} ${string.errors.required}`),

    ambience_threshold: Yup.number()
        .integer(`${string.project.ambience} ${string.errors.mustBeInteger}`)
        .typeError(`${string.project.ambience} ${string.errors.mustbeNumber}`)
        .moreThan(-1, `${string.project.ambience} ${string.errors.mustBeInteger}`)
        .required(`${string.project.ambience} ${string.errors.required}`),
})

const ProjectAlertsModel = ({ formik, i, state, devices, selection, isOpensec, toggle, index, projectSelectionObj, shouldDisabled = false }) => {
    const [device, setDevice] = useState({})

    const alertFormik = useFormik({
        initialValues: {
            device_id: projectSelectionObj.device_id,
            temperature_alert_min: '',
            temperature_alert_max: '',
            temperature_alert_interval: '',
            temperature_allowed_occurances: '',
            humidity_alert_min: '',
            humidity_alert_max: '',
            humidity_alert_interval: '',
            humidity_allowed_occurances: '',
            ambience_threshold: '',
            selectionId: projectSelectionObj.projectSelectionId,
            changed_selection: '1',
        },
        validationSchema: validationSchema,
        // validateOnChange: false,
        onSubmit: (values) => {
            saveProject(values)
        },
    })

    const selectionTemperature = alertFormik.values
    const setSelectionTemperature = alertFormik.setFieldValue

    const onInit = () => {
        if (formik.values && !selection.projectselectiontype) {
            const device = devices.find((dev) => dev.id == projectSelectionObj.device_id)
            let selectionObj = {}
            setDevice(device)
            const selectedTempAlertDevice = selection.selectionTemperatureArray?.find((temp) => temp.device_id == projectSelectionObj.device_id)
            const selectedTempAlert = selection.selectionTemperatureArray?.find((temp) => temp.selectionId == projectSelectionObj.projectSelectionId && temp.selectionId != '5' && projectSelectionObj.projectSelectionId != '5')
            if (selectedTempAlertDevice) {
                selectionObj = selectedTempAlertDevice
            } else if (selectedTempAlert) {
                selectionObj = selectedTempAlert
            } else {
                selectionObj = {
                    ...alertFormik.values,
                    device_id: projectSelectionObj.device_id,
                    selectionId: projectSelectionObj.projectSelectionId,
                    temperature_alert_min: formik.values.temperature_alert_min,
                    temperature_alert_max: formik.values.temperature_alert_max,
                    temperature_alert_interval: formik.values.temperature_alert_interval,
                    temperature_allowed_occurances: formik.values.temperature_allowed_occurances,
                    humidity_alert_min: formik.values.humidity_alert_min,
                    humidity_alert_max: formik.values.humidity_alert_max,
                    humidity_alert_interval: formik.values.humidity_alert_interval,
                    humidity_allowed_occurances: formik.values.humidity_allowed_occurances,
                    ambience_threshold: formik.values.ambience_threshold,
                }
            }
            alertFormik.setValues(selectionObj)
        }

        if (selection.projectselectiontype == 'group' || selection.projectselectiontype == 'truck') {
            let grpdata, alertObject
            if (selection.projectselectiontype == 'group') {
                grpdata = state.project.selections.filter(function (item) {
                    return item.group_id == selection.group_id && item.selectionTemperatureArray.some((temp) => temp.selectionId == '1')
                })
                alertObject = grpdata[0].selectionTemperatureArray.find((temp) => temp.selectionId == '1')
            } else {
                grpdata = state.project.selections.filter(function (item) {
                    return item.truck_id == selection.truck_id && item.selectionTemperatureArray.some((temp) => temp.selectionId == '2')
                })
                alertObject = grpdata[0].selectionTemperatureArray.find((temp) => temp.selectionId == '2')
            }
            if (alertObject)
                alertFormik.setValues({
                    ...alertFormik.values,
                    device_id: null,
                    temperature_alert_min: parseInt(alertObject.temperature_alert_min),
                    temperature_alert_max: parseInt(alertObject.temperature_alert_max),
                    temperature_alert_interval: parseInt(alertObject.temperature_alert_interval),
                    temperature_allowed_occurances: parseInt(alertObject.temperature_allowed_occurances),
                    humidity_alert_min: parseInt(alertObject.humidity_alert_min),
                    humidity_alert_max: parseInt(alertObject.humidity_alert_max),
                    humidity_alert_interval: parseInt(alertObject.humidity_alert_interval),
                    humidity_allowed_occurances: parseInt(alertObject.humidity_allowed_occurances),
                    ambience_threshold: parseInt(alertObject.ambience_threshold),
                    selectionId: projectSelectionObj.projectSelectionId,
                })
        }
    }
    useEffect(() => {
        onInit()
    }, [projectSelectionObj.device_id])

    const saveProject = (values) => {
        try {
            // this section was onlt execute for Device because we have multiple devices for one item
            if (projectSelectionObj.projectSelectionId == DEVICEDROPDOWN) {
                const isAllDevice = selection?.selectionTemperatureArray?.every((sel) => sel.selectionId == projectSelectionObj.projectSelectionId)
                if (!isAllDevice) {
                    selection.selectionTemperatureArray = []
                }

                const alertIndex = selection?.selectionTemperatureArray.findIndex((sel) => sel.device_id == projectSelectionObj.device_id)
                if (alertIndex > -1) selection.selectionTemperatureArray = selection?.selectionTemperatureArray?.splice(alertIndex, 1, values)
                else
                    selection?.selectionTemperatureArray.push({
                        ...values,
                    })
            } else {
                selection.selectionTemperatureArray = []
                selection?.selectionTemperatureArray.push({
                    ...values,
                })
            }

            notify(`${string.project.projectSelectionUpdated}`)
            toggle()
            return false
        } catch (err) {
            console.log(err)
        }
    }

    const resetProject = () => {
        alertFormik.setValues({
            device_id: projectSelectionObj.device_id,
            temperature_alert_min: '',
            temperature_alert_max: '',
            temperature_alert_interval: '',
            temperature_allowed_occurances: '',
            humidity_alert_min: '',
            humidity_alert_max: '',
            humidity_alert_interval: '',
            humidity_allowed_occurances: '',
            ambience_threshold: '',
            selectionId: '',
        })
    }

    return (
        <tr className='hide-table-padding'>
            <td colSpan='10' style={{ border: '0px' }}>
                <Collapse id='collapseOne' isOpen={isOpensec} className=''>
                    <div className='row m-0 mb-2'>
                        <div className='col-12'>
                            <div className='projectArea'>
                                <div className='row m-0 mb-2 w-100 d-flex justify-content-between'>
                                    <div className='text-left'>
                                        <span>{device?.deviceID}</span>
                                    </div>
                                    <div className='text-right'>
                                        <i className='fas fa-times-circle' onClick={toggle}></i>
                                    </div>
                                </div>
                                <div className='p-2 d-flex col-12'>
                                    <div className='col-1 p-0'>
                                        <div className='projectIcon2'>
                                            <img src='../../static/img/thermometer.png' width='20px' />
                                        </div>
                                    </div>
                                    <div className='col-5 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.project.tempraturedegree}</label>
                                        <div className='d-flex col-md-12 p-0'>
                                            <div className='col-6 p-0 pr-2'>
                                                <Input
                                                    type='text'
                                                    className='borderProject form-control radius-0'
                                                    placeholder={string.project.minRange}
                                                    name={'temperature_alert_min_' + index}
                                                    disabled={selection.projectselectiontype == 'group' ? true : ''}
                                                    onChange={(event) => {
                                                        setSelectionTemperature('temperature_alert_min', event.target.value)
                                                    }}
                                                    value={selectionTemperature?.temperature_alert_min}
                                                />
                                                {alertFormik.errors['temperature_alert_min'] ? <FormHelperMessage className='err' message={alertFormik.errors['temperature_alert_min']} /> : null}
                                            </div>
                                            <div className='col-6 p-0 pr-2'>
                                                <Input
                                                    type='text'
                                                    className='borderProject form-control radius-0'
                                                    placeholder={string.project.maxRange}
                                                    name={'temperature_alert_max_' + index}
                                                    disabled={selection.projectselectiontype == 'group' ? true : ''}
                                                    onChange={(event) => {
                                                        setSelectionTemperature('temperature_alert_max', event.target.value)
                                                    }}
                                                    value={selectionTemperature?.temperature_alert_max}
                                                />
                                                {alertFormik.errors['temperature_alert_max'] ? <FormHelperMessage className='err' message={alertFormik.errors['temperature_alert_max']} /> : null}
                                            </div>
                                        </div>
                                    </div>
                                    <div className='col-2 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.project.tempratureinterval}</label>
                                        <Input
                                            type='text'
                                            className='borderProject form-control radius-0'
                                            placeholder={string.project.intervalMinutes}
                                            name={'temperature_alert_interval_' + index}
                                            disabled={selection.projectselectiontype == 'group' ? true : ''}
                                            onChange={(event) => {
                                                setSelectionTemperature('temperature_alert_interval', event.target.value)
                                            }}
                                            value={selectionTemperature?.temperature_alert_interval}
                                        />
                                        {alertFormik.errors['temperature_alert_interval'] ? <FormHelperMessage className='err' message={alertFormik.errors['temperature_alert_interval']} /> : null}
                                    </div>
                                    <div className='col-4'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.project.allowedOccurance}</label>
                                        <Input
                                            type='text'
                                            className='borderProject form-control radius-0'
                                            placeholder={string.project.times}
                                            name={'temperature_allowed_occurances_' + index}
                                            disabled={selection.projectselectiontype == 'group' ? true : ''}
                                            onChange={(event) => {
                                                setSelectionTemperature('temperature_allowed_occurances', event.target.value)
                                            }}
                                            value={selectionTemperature?.temperature_allowed_occurances}
                                        />
                                        {alertFormik.errors['temperature_allowed_occurances'] ? <FormHelperMessage className='err' message={alertFormik.errors['temperature_allowed_occurances']} /> : null}
                                    </div>
                                </div>

                                <div className='p-2 d-flex col-12'>
                                    <div className='col-1 p-0'>
                                        <div className='projectIcon2'>
                                            <img src='../../static/img/humidity.png' width='20px' />
                                        </div>
                                    </div>
                                    <div className='col-5 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.project.humidityperc}</label>
                                        <div className='d-flex p-0 col-md-12'>
                                            <div className='col-6 p-0 pr-2'>
                                                <Input
                                                    type='text'
                                                    className='borderProject form-control radius-0'
                                                    placeholder={string.project.minRange}
                                                    name={'humidity_alert_min_' + index}
                                                    disabled={selection.projectselectiontype == 'group' ? true : ''}
                                                    onChange={(event) => {
                                                        setSelectionTemperature('humidity_alert_min', event.target.value)
                                                    }}
                                                    value={selectionTemperature?.humidity_alert_min}
                                                />
                                                {alertFormik.errors['humidity_alert_min'] ? <FormHelperMessage className='err' message={alertFormik.errors['humidity_alert_min']} /> : null}
                                            </div>
                                            <div className='col-6 p-0 pr-2'>
                                                <Input
                                                    type='text'
                                                    className='borderProject form-control radius-0'
                                                    placeholder={string.project.maxRange}
                                                    name={'humidity_alert_max_' + index}
                                                    disabled={selection.projectselectiontype == 'group' ? true : ''}
                                                    onChange={(event) => {
                                                        setSelectionTemperature('humidity_alert_max', event.target.value)
                                                    }}
                                                    value={selectionTemperature?.humidity_alert_max}
                                                />
                                                {alertFormik.errors['humidity_alert_max'] ? <FormHelperMessage className='err' message={alertFormik.errors['humidity_alert_max']} /> : null}
                                            </div>
                                        </div>
                                    </div>
                                    <div className='col-2 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.project.tempratureinterval}</label>
                                        <Input
                                            type='text'
                                            className='borderProject form-control radius-0'
                                            placeholder={string.project.intervalMinutes}
                                            name={'humidity_alert_interval_' + index}
                                            disabled={selection.projectselectiontype == 'group' ? true : ''}
                                            onChange={(event) => {
                                                setSelectionTemperature('humidity_alert_interval', event.target.value)
                                            }}
                                            value={selectionTemperature?.humidity_alert_interval}
                                        />
                                        {alertFormik.errors['humidity_alert_interval'] ? <FormHelperMessage className='err' message={alertFormik.errors['humidity_alert_interval']} /> : null}
                                    </div>
                                    <div className='col-4'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.project.allowedOccurance}</label>
                                        <Input
                                            type='text'
                                            className='borderProject form-control radius-0'
                                            placeholder={string.project.times}
                                            name={'humidity_allowed_occurances_' + index}
                                            disabled={selection.projectselectiontype == 'group' ? true : ''}
                                            onChange={(event) => {
                                                setSelectionTemperature('humidity_allowed_occurances', event.target.value)
                                            }}
                                            value={selectionTemperature?.humidity_allowed_occurances}
                                        />
                                        {alertFormik.errors['humidity_allowed_occurances'] ? <FormHelperMessage className='err' message={alertFormik.errors['humidity_allowed_occurances']} /> : null}
                                    </div>
                                </div>

                                <div className='p-2 d-flex col-12'>
                                    <div className='col-1 p-0'>
                                        <div className='projectIcon2'>
                                            <img src='../../static/img/seal.png' width='20px' />
                                        </div>
                                    </div>
                                    <div className='col-5 p-0'>
                                        <label className='col-md-12 col-form-label pl-0'>{string.project.sealingambience}</label>
                                        <div className='d-flex p-0'>
                                            <div className='col-6 p-0 pr-2'>
                                                <Input
                                                    type='text'
                                                    className='borderProject form-control radius-0'
                                                    placeholder={string.project.brakingPoints}
                                                    name={'ambience_threshold_' + index}
                                                    disabled={selection.projectselectiontype == 'group' ? true : ''}
                                                    onChange={(event) => {
                                                        setSelectionTemperature('ambience_threshold', event.target.value)
                                                    }}
                                                    value={selectionTemperature?.ambience_threshold}
                                                />
                                                {alertFormik.errors['ambience_threshold'] ? <FormHelperMessage className='err' message={alertFormik.errors['ambience_threshold']} /> : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className={`d-flex align-items-end p-3 justify-content-center ${shouldDisabled ? 'disabled-block' : ''}`}>
                                    <Button disabled={shouldDisabled} className='btnProject mr-2 btn btn-primary p-0' onClick={alertFormik.handleSubmit}>
                                        {string.save}
                                    </Button>
                                    <Button className='btnProject btn btn-dark p-0' onClick={resetProject}>
                                        {string.reset}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Collapse>
            </td>
        </tr>
    )
}

export default ProjectAlertsModel
