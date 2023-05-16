import React, { useState, useContext, useEffect, useMemo } from 'react'
import { Modal, ModalBody, ModalHeader, ModalFooter } from 'reactstrap'
import { ReactFormGenerator } from 'chaincodedev-form-builder'
import html2canvas from 'html2canvas'
import EventContext from '../../store/event/eventContext'
import { isValidJsonString } from '../../utils/globalFunc.js'
import string from '../../utils/LanguageTranslation.js'
import { getRootUrl } from '../../lib/api/getRootUrl'
import { _fetchLocationLogs } from '../../components/iotreport/filterIotReportData'
import '../../pages/form-builder/form-builder.css'
import { fetchProjectSelections, fetchProjectDetails } from '../../lib/api/project'
import { fetchBorderInfo } from '../../lib/api/border-info'
import { fetchLocationLogs } from '../../lib/api/logs'
import { _momentDateFormat } from '../../utils/globalFunc'
import { fetchTemperatureLogs, fetchHumidityLogs } from '../../lib/api/logs'
import moment from 'moment-timezone'
import { getLocalTime, b64toBlob, checkFileSize, _generateUniqId } from '../../utils/globalFunc'
import jsPDF from 'jspdf'
import { areaConversion } from 'geolib'
import { addDevice } from '../../lib/api/device.js'
import WatchAllEventContext from '../../store/watchAllEvent/watchAllEventContext'

const EventPreview = ({ project, readOnly, changeReadOnly, isEditableMode = true, toggle, onPreviewSubmit, showForm, formData, previewFormData, answer_data, preview, project_event, user_id, subEvent, assets, watchall }) => {
    const { itemsNames } = watchall ? useContext(WatchAllEventContext) : useContext(EventContext)
    //iot on and iot off
    const projectSelection = window.localStorage[project_event.project_id + '_selection'] || ''
    const selectionsItems = projectSelection ? JSON.parse(projectSelection) : {}
    const [currentProjectId, setFormProjectId] = useState(project_event.project_id)
    const [selectedItemId, setSelectedItemId] = useState(selectionsItems?.item?.value)
    const [iotOnOf, setIotOnOf] = useState('')
    const [iotOnDevice, setIotOnDevice] = useState({
        device: null,
        elementId: null,
    })
    const [iotOffDevice, setIotOffDevice] = useState({
        device: null,
        elementId: null,
    })
    const [showFormBuilder, setShowFormBuilder] = useState(true)

    const [selectedDevice, setSelectedDevice] = useState({
        date: [
            {
                startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
                endDate: new Date(),
                key: 'selection',
            },
        ],
        device: null,
    })
    const [readsOnly, isReadOnly] = React.useState(readOnly)
    const [reRender, setRerender] = useState(null)
    const [selected, setSelected] = useState({
        selectedGroup: null,
        selectedTruck: null,
        selectedContainer: null,
        selectedItem: null,
        selectedDevice: null,
        selectedProject: null,
    })
    const [state, setState] = useState({
        mapMarker: null,
        polylines: null,
        stations: null,
        startMarker: null,
        endMarker: null,
        stations: null,
        activeRoadTrip: {},
    })
    const [projectRef, setProject] = useState({})
    const [locLogs, setLocLogs] = useState(null)
    const [borderInfo, setBorderInfo] = useState(null)
    const [routeDatas, setRouteDatas] = useState({
        stations: [],
        startMarker: {
            name: '',
            radius: '',
            pos: '',
        },
        endMarker: {
            name: '',
            radius: '',
            pos: '',
        },
        polylines: [],
        mapMarker: [],
    })
    //HANDLING CHART DATA
    const { groupNames, truckNames, containersName } = useContext(EventContext)
    const [projectDetail, setProjectDetail] = useState(null)
    const [projectAnalyticsSelections, setProjectAalyticsSelection] = useState({
        item_id: itemsNames.selected.value,
        device_id: selectedDevice.device?.id,
        container_id: null,
        group_id: null,
        truck_id: null,
    })
    const [chartData, setChartData] = useState({
        elementId: null,
        device: null,
        data: null,
        isLoading: true,
        iotReport: null,
    })

    const [filterData, setFilterData] = useState({
        group: null,
        truck: null,
        container: null,
        item: itemsNames.selected.value,
        device_id: selectedDevice.device?.id || null,
    })
    const [selectedElement, setSelectedElement] = useState('')

    //HANDLING CHART DATA

    const updateState = (newState) =>
        setState((preState) => ({
            ...preState,
            ...newState,
        }))

    const updateRouteDatas = (newState) =>
        setRouteDatas((preState) => ({
            ...preState,
            ...newState,
        }))
    const checkFormData = () => {
        const preview = previewFormData?.find(({ label }) => label === 'IoTReport')
        if (preview || readOnly) {
            return previewFormData
        } else {
            return formData
        }
    }
    const formAnswer = isValidJsonString(answer_data) ? JSON.parse(answer_data) : answer_data
    const form_data = checkFormData()
    const printForm = () => {
        const printSection = document.getElementById('event-form-print')
        html2canvas(printSection, { allowTaint: true, useCORS: true }).then((canvas) => {
            var image = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream')

            const pdf = new jsPDF({
                orientation: 'l', // landscape
                unit: 'pt', // points, pixels won't work properly
                format: [canvas.width, canvas.height], // set needed dimensions for any element
            })
            // @ts-ignore
            pdf.addImage(image, 'PNG', 0, 0)
            pdf.save('download.pdf')
        })
    }
    let previewContentstyle = 'justify-content-center w-100'
    if (isEditableMode && !preview && readOnly) previewContentstyle = 'justify-content-center w-75'

    const showUpdateButton = !!Array.isArray(project) || (!Array.isArray(project) && !project.is_completed)

    // to get  a  selected device  in iotOn and iotOff
    const getSelectedIotDevice = (data) => {
        if (data.type === 'iotOn') {
            setIotOnDevice({
                device: data.device,
                elementId: data.elementId,
            })
            setIotOnOf('iot-data-on')
        }
        if (data.type === 'iotOff') {
            setIotOnOf('iot-data-off')
            setIotOffDevice({
                device: data.device,
                elementId: data.elementId,
            })
        }
    }

    const _fetchProjectDetails = async (project_id) => {
        const project_details = await fetchProjectDetails({ ...projectAnalyticsSelections, project_id })
        let project_data = await fetchProjectSelections({ project_id })
        setProjectDetail({ ...project_data, ...project_details })
        return project_details
    }

    //get all the chart data  chart options and as well as the chart options
    const _getChartData = (projectDetails, filterDatas, rgbColor, labels, label, values, type, dateRange, activeDevice) => {
        const allFilterNull = Object.values(filterDatas).some((filter) => filter)

        //chart first input chart Data
        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: label,
                    fill: false,
                    lineTension: 0.1,
                    backgroundColor: 'rgba(' + rgbColor + ',0.4)',
                    borderColor: 'rgba(' + rgbColor + ',1)',
                    borderCapStyle: 'butt',
                    borderDash: [],
                    borderDashOffset: 0.0,
                    borderJoinStyle: 'miter',
                    pointBorderColor: 'rgba(' + rgbColor + ',1)',
                    pointBackgroundColor: '#fff',
                    pointBorderWidth: 1,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: 'rgba(' + rgbColor + ',1)',
                    pointHoverBorderColor: 'rgba(220,220,220,1)',
                    pointHoverBorderWidth: 2,
                    pointRadius: 3,
                    pointHitRadius: 10,
                    data: values,
                },
            ],
        }
        const getTicks = (range, type) => {
            if (values.length) {
                const val = _.map(values, (v) => v)
                if (type == 'min') {
                    const val = _.sortBy(values, null, ['asc'])
                    val.sort(function (a, b) {
                        return parseInt(a) - parseInt(b)
                    })
                    if (parseInt(val[0]) <= range) {
                        return parseInt(val[0]) - 10
                    }
                }
                if (type == 'max') {
                    val.sort(function (a, b) {
                        return parseInt(b) - parseInt(a)
                    })
                    if (parseInt(val[0]) >= range) {
                        return parseInt(val[0]) + 10
                    }
                }
            }
            return range
        }

        let tempmax,
            tempmin,
            humidmax,
            humidmin = 0
        let selections = projectDetails.project_selections
        if (projectDetails.alert_type === 1 && allFilterNull) {
            tempmax = projectDetails.temperature_alert_max
            tempmin = projectDetails.temperature_alert_min
            humidmax = projectDetails.humidity_alert_max
            humidmin = projectDetails.humidity_alert_min
        } else {
            if (selections != undefined && allFilterNull) {
                const item_id = filterDatas.item
                const device_id = filterDatas.device
                selections.filter(function (val, i) {
                    let ifDeviceExists = val.selection_devices.filter(function (device) {
                        if (device.device_id == device_id) {
                            return device
                        }
                    })
                    let ifItemExists = val.selection_items.filter(function (item) {
                        if (item.item_id == item_id) {
                            return item
                        }
                    })
                    if ((device_id && item_id && ifDeviceExists.length > 0 && ifItemExists.length > 0) || (device_id && !item_id && ifDeviceExists.length > 0) || (!device_id && item_id && ifItemExists.length > 0)) {
                        let alerts = []

                        if (device_id) {
                            alerts = val.project_alerts.filter((alrt) => alrt.device_id == device_id)
                        }
                        if (!alerts.length) {
                            alerts = val.project_alerts.filter((alert) => !alert.device_id)
                        }

                        if (alerts.length > 0) {
                            tempmax = alerts[alerts.length - 1].temperature_alert_max
                            tempmin = alerts[alerts.length - 1].temperature_alert_min
                            humidmax = alerts[alerts.length - 1].humidity_alert_max
                            humidmin = alerts[alerts.length - 1].humidity_alert_min
                        } else {
                            tempmax = projectDetails.temperature_alert_max
                            tempmin = projectDetails.temperature_alert_min
                            humidmax = projectDetails.humidity_alert_max
                            humidmin = projectDetails.humidity_alert_min
                        }
                    }
                })
            }

            tempmax = projectDetails.temperature_alert_max
            tempmin = projectDetails.temperature_alert_min
            humidmax = projectDetails.humidity_alert_max
            humidmin = projectDetails.humidity_alert_min
        }

        const chartOpts = {
            scales: {
                yAxes: [
                    {
                        ticks: {
                            beginAtZero: true,
                            min: type == 'temp' ? getTicks(parseInt(tempmin) - parseInt(20), 'min') : getTicks(parseInt(humidmin) - parseInt(20), 'min'),
                            max: type == 'temp' ? getTicks(parseInt(tempmax) + parseInt(20), 'max') : getTicks(parseInt(humidmax) + parseInt(20), 'max'),
                            fontSize: 5,
                        },
                    },
                ],
                xAxes: [
                    {
                        ticks: {
                            fontSize: 5,
                        },
                    },
                ],
            },
            annotation: {
                annotations: [
                    {
                        type: 'line',
                        mode: 'horizontal',
                        scaleID: 'y-axis-0',
                        value: type == 'temp' ? tempmax : humidmax,
                        borderColor: 'rgb(255,0,0)',
                        borderWidth: 4,
                        label: {
                            enabled: true,
                            content: type == 'temp' ? `${string.chart.maxTemperature} ` + tempmax + ' °C' : `${string.chart.maxHumidity} ` + humidmax + '%',
                        },
                    },
                    {
                        type: 'line',
                        mode: 'horizontal',
                        scaleID: 'y-axis-0',
                        value: type == 'temp' ? tempmin : humidmin,
                        borderColor: 'rgb(255,0,0)',
                        borderWidth: 4,
                        label: {
                            enabled: true,
                            content: type == 'temp' ? `${string.chart.minTemperature} ` + tempmin + ' °C' : `${string.chart.minHumidity} ` + humidmin + '%',
                        },
                    },
                ],
            },
        }

        const groupNames = { selected: { value: project_event.group_id, label: project_event.groupName } }
        const itemsNames = { selected: { value: project_event.item_id, label: project_event.itemName } }
        const truckNames = { selected: { value: project_event.truck_id, label: project_event.truckName } }
        const containersName = { selected: { value: project_event.container_id, label: project_event.containerName } }

        const headerData = {
            data: {
                deviceName: activeDevice || selectedDevice?.device,
                selectedDate: dateRange || selectedDevice.date,
            },
            groupNames: groupNames,
            itemsNames: itemsNames,
            truckNames: truckNames,
            containersName: containersName,
        }
        return { chartData: chartData, chartOpts: chartOpts, headerData: headerData, size: 'sm' }
    }

    // get both temperature  and the  humidity data

    const _fetchChartData = async (projectSelections, project_id, dateRange, analyticsData, projectDetails, activeDevice, filterDatas) => {
        if (!projectDetails) {
            projectDetails = projectDetail
        }

        if (!filterDatas) {
            filterDatas = filterData
        }

        if (!activeDevice) {
            activeDevice = selectedDevice.device
        }

        if (!dateRange) {
            dateRange = selectedDevice.date
        }

        try {
            //set the loader to true
            setChartData({ isLoading: true, data: null, elementId: selectedElement })
            let iotReport = null
            if (selectedElement) {
                iotReport = await fetchMapData()
            }

            let chartLineColor
            const deviceData = analyticsData.map(async (type) => {
                const chartLabels = []
                const chartValue = []
                const payload = {
                    projectSelections,
                    project_id,
                    device_id: activeDevice?.id || null,
                    start_date: _momentDateFormat(dateRange[0].startDate, 'YYYY-MM-DD'),
                    end_date: moment(dateRange[0].endDate).set({ hour: 23, minute: 59, second: 59 }).format('YYYY-MM-DD HH:mm:ss'),
                }
                // Fetch and Save temperature logs, Fetch and Save humidity logs
                let temperatureHumitityLogs = type == 'temp' ? await fetchTemperatureLogs(payload) : await fetchHumidityLogs(payload)
                let chartLabel = type == 'temp' ? string.chart.Temperature : string.chart.Humidity
                temperatureHumitityLogs.data.map((log, i) => {
                    chartLabels.push(getLocalTime(log.createdAt))
                    const tempHumLog = type == 'temp' ? log.temperature : log.humidity
                    chartValue.push(tempHumLog)
                })
                chartLineColor = type == 'temp' ? '126,253,255' : '117,85,218'
                return _getChartData(projectDetails, filterDatas, chartLineColor, chartLabels, chartLabel, chartValue, type, dateRange, activeDevice)
            })
            let data = await Promise.all(deviceData)
            setChartData({
                elementId: selectedElement,
                device: selectedDevice.device,
                data,
                isLoading: false,
                iotReport,
            })
            return data
        } catch (err) {
            console.error(string.chart.Errorwhilefethinglogs + ' => ', err)
        }
    }

    const addDevicesInFormData = () => {
        form_data.forEach((formElement) => {
            JSON.parse(answer_data).forEach((answerElement) => {
                if (formElement.field_name === answerElement.name) {
                    formElement.activeDevice = answerElement.activeDevice
                    formElement.devices = answerElement.devices
                }
            })
            if (formElement.element === 'IotOff' && formElement.id === iotOffDevice.elementId && iotOffDevice.device) {
                formElement.activeDevice = iotOffDevice.device
            }
            if (formElement.element === 'IotOn' && formElement.id === iotOnDevice.elementId && iotOnDevice.device) {
                formElement.activeDevice = iotOnDevice.device
            }
        })
    }

    //IOT REPORT HANDLING
    const fetchMapData = async (body, date, activeDevice) => {
        if (!body) {
            body = {
                container: selected.selectedContainer,
                container_id: selected.selectedContainer,
                item_id: selected.selectedItem,
                project_id: currentProjectId,
                project: currentProjectId,
                device_id: selected.selectedDevice,
            }
        }
        if (!date) {
            date = selectedDevice.date
        }
        if (!activeDevice) {
            activeDevice = selectedDevice.device
        }

        // const response = await fetchFormData(formId)
        let iotReport = {}
        if (body.project_id) {
            const currentproject = await fetchProjectSelections({ project_id: body.project_id })
            const logs = await fetchLocationLogs(body)
            const destructLogs = await _fetchLocationLogs(logs)
            const border = await fetchBorderInfo(body)
            updateState({ mapData: logs.data })
            setBorderInfo(border)
            setProject(currentproject)
            updateRouteDatas({
                ...destructLogs.markerObj,
                ...destructLogs.markerLine,
            })
            const groupNames = { selected: { value: project_event.group_id, label: project_event.groupName } }
            const itemsNames = { selected: { value: project_event.item_id, label: project_event.itemName } }
            const truckNames = { selected: { value: project_event.truck_id, label: project_event.truckName } }
            const containersName = { selected: { value: project_event.container_id, label: project_event.containerName } }

            const headerData = {
                selectedDate: selectedDevice.date || date,
                deviceName: activeDevice?.deviceID || selectedDevice?.device?.deviceID,
                groupNames: groupNames,
                itemsNames: itemsNames,
                truckNames: truckNames,
                containersName: containersName,
            }
            const { endMarker, startMarker, stations } = destructLogs.markerObj
            const { mapMarker, polylines } = destructLogs.markerLine
            iotReport = { headerData, groupNames, truckNames, containersName, itemsNames, polylines, stations, startMarker, endMarker, mapMarker, border, projectDetails: projectRef }
            // formData.map((formData) => {
            //     formData.iotReport = iotReport
            // })
        }
        return iotReport
        // loader bug fix for react-form-builder npm
    }

    //only fetch the data for the first time
    const fetchPreviewData = async () => {
        const answerData = JSON.parse(answer_data)
        if (form_data && answerData && readsOnly) {
            for (let index = 0; index < answerData.length; index++) {
                const answer = answerData[index]
                const activeForm = form_data.find((form) => form?.field_name === answer.name)

                if (activeForm) {
                    const projectId = answer?.analyticsData?.project_id
                    const date = answer && answer.date
                    const body = answer && answer.iotReportData
                    const analyticsData = answer && answer?.analyticsData
                    const devices = answer && answer.devices
                    const activeDevice = answer && answer.activeDevice
                    const projectDetails = await _fetchProjectDetails(projectId)
                    const chartData = await _fetchChartData(analyticsData?.project_selection, projectId, date, ['temp', 'humidity'], projectDetails, activeDevice, analyticsData?.filterData)
                    const iotReport = await fetchMapData(body, date, activeDevice)
                    activeForm.iotReport = iotReport
                    activeForm.chartData = chartData
                    setRerender(Math.random())
                }
            }
        }
    }

    useEffect(() => {
        fetchPreviewData()
    }, [])

    useEffect(() => {
        if (!readsOnly) {
            fetchProjectDetails(currentProjectId)
        }
    }, [])

    useEffect(() => {
        if (projectDetail && selectedDevice.device) {
            _fetchChartData(projectAnalyticsSelections, currentProjectId, selectedDevice.date, ['temp', 'humidity'])
        }
    }, [projectDetail, selectedDevice])

    const setIotDevicesInFormData = async (form_data) => {
        if (!form_data) {
            return form_data
        }

        form_data?.forEach((ele) => {
            ele.enableMap = true
            ele.enableAnalytics = true
            if (ele.label === 'IoTReport') {
                ele.selectedDevice = getSelectedDevice
            }
            if (ele.label === 'IotOn') {
                ele.selectedDevice = getSelectedIotDevice
            }
            if (ele.label === 'IotOff') {
                ele.selectedDevice = getSelectedIotDevice
            }

            if (answer_data && readsOnly) {
                JSON.parse(answer_data).forEach((answerElement) => {
                    if (ele.field_name === answerElement.name) {
                        ele.activeDevice = answerElement.activeDevice
                        ele.devices = answerElement.devices
                        ele.analyticsData = answerElement.analyticsData
                        ele.iotReportData = answerElement.iotReportData
                        if (answerElement.name?.includes('IotOn') || answerElement.name?.includes('IotOff')) {
                            ele.selectedDevice = getSelectedIotDevice
                        }
                    }
                })
                if (ele.element === 'IotOff' && ele.id === iotOffDevice.elementId && iotOffDevice.device) {
                    ele.activeDevice = iotOffDevice.device
                }
                if (ele.element === 'IotOn' && ele.id === iotOnDevice.elementId && iotOnDevice.device) {
                    ele.activeDevice = iotOnDevice.device
                }
            }
            //if user wants to update form elements
            if (selectedElement == ele.id) {
                ele.activeDevice = selectedDevice.device
                ele.chartData = chartData.data
                ele.iotReport = chartData.iotReport
                ele.iotReportData = {
                    container: selected.selectedContainer,
                    container_id: selected.selectedContainer,
                    item_id: selected.selectedItem,
                    project_id: currentProjectId,
                    project: currentProjectId,
                    device_id: selected.selectedDevice,
                }
                ele.analyticsData = {
                    project_id: currentProjectId,
                    project_selection: projectAnalyticsSelections,
                    item_id: selectedItemId,
                    device: selectedDevice.device,
                }
                ele.date = selectedDevice.date
            }
        })
    }

    // to get  a selected device
    const getSelectedDevice = (elementData) => {
        if (elementData.device) {
            setSelectedDevice(elementData)
            setProjectAalyticsSelection({ ...setProjectAalyticsSelection, device_id: elementData.device.id })
        }
        if (!elementData.device) {
            Object.assign(selectedDevice, { date: [elementData.date] })
            setSelectedDevice({ ...selectedDevice, elementData })
        }
        elementData.elementId && setSelectedElement(elementData.elementId)
    }

    if (form_data) {
        setIotDevicesInFormData(form_data)
        // addDevicesInFormData()
    }

    const changeStateValue = () => {
        setShowFormBuilder(false)
        setTimeout(() => {
            setShowFormBuilder(true)
        }, 1000)
    }

    const assetsData = useMemo(() => {
        changeStateValue()
        return assets
    }, [JSON.stringify(assets)])
    return (
        <Modal size='lg' isOpen={showForm} className='customModal document'>
            <ModalHeader toggle={toggle} cssModule={{ 'modal-title': 'modal-title text-dark font-weight-bold d-flex text-center' }}>
                {isEditableMode && !preview && readOnly && (
                    <div className='w-0 pl-4'>
                        <a
                            href='#'
                            className='flex-start '
                            onClick={(e) => {
                                e.preventDefault()
                                printForm()
                            }}
                        >
                            <img src='/static/img/printing.png' />
                        </a>
                    </div>
                )}
                <span className={previewContentstyle} style={{ padding: '0px 100px' }}>
                    {preview ? string.formBuilder.Formpreview : project_event?.event?.eventName}
                </span>
                {isEditableMode && !preview && readOnly && !subEvent && showUpdateButton && (
                    <button className='btn btn-primary large-btn flex-end edit' onClick={() => changeReadOnly(false)}>
                        {string.updateBtnTxt} <i className='fa fa-pencil-alt' />
                    </button>
                )}
            </ModalHeader>
            <ModalBody>
                <div key={`${user_id}${showFormBuilder}`} id='event-form-print'>
                    {showFormBuilder ? (
                        <ReactFormGenerator
                            rootURL={getRootUrl()}
                            user_id={user_id}
                            show_btns={!readOnly}
                            read_only={readOnly}
                            translate={string}
                            data={form_data.length > 0 && form_data}
                            assetsData={assetsData}
                            itemLength={1}
                            enableMap={true}
                            eventId={project_event.event_submission_id}
                            enableAnalytics={true}
                            answer_data={formAnswer}
                            _goback={toggle}
                            onSubmit={(event) => {
                                onPreviewSubmit(event)
                                toggle()
                            }}
                        />
                    ) : null}
                </div>
            </ModalBody>
            <ModalFooter />
        </Modal>
    )
}

export default EventPreview
