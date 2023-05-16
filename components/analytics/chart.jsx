import { useState, useEffect } from 'react'
import NProgress from 'nprogress'
import { Line } from 'react-chartjs-2'
import _ from 'lodash'
import * as ChartAnnotation from 'chartjs-plugin-annotation'
import { fetchTemperatureLogs, fetchHumidityLogs } from '../../lib/api/logs'
import { getLocalDBValue, getLocalTime, _momentDateFormat } from '../../utils/globalFunc'
import string from '../../utils/LanguageTranslation.js'
import moment from 'moment'

const LineChart = (props) => {
    const { projectDetails, dateRange, rgbColor, type, filterDatas, projectSelections, project_id } = props
    const [labels, setLabels] = useState([])
    const [values, setValues] = useState([])
    const [label, setLabel] = useState([])
    const allFilterNull = Object.values(filterDatas).some((filter) => filter)

    useEffect(() => {
        const { device_id, item_id } = projectSelections
        if (getLocalDBValue(project_id) || device_id || item_id) _fetchChartData()
    }, [JSON.stringify(projectSelections)])

    useEffect(() => {
        if (dateRange[0].startDate && dateRange[0].endDate) {
            _fetchChartData()
        }
    }, [JSON.stringify(dateRange)])

    const _fetchChartData = async () => {
        NProgress.start()
        try {
            const chartLabels = []
            const chartValue = []
            const payload = {
                projectSelections,
                project_id,
                start_date: _momentDateFormat(dateRange[0].startDate, 'YYYY-MM-DD'),
                end_date: moment(dateRange[0].endDate).set({ hour: 23, minute: 59, second: 59 }).format('YYYY-MM-DD HH:mm:ss'),
            }
            // Fetch and Save temperature logs, Fetch and Save humidity logs
            let temperatureHumitityLogs = type == 'temp' ? await fetchTemperatureLogs(payload) : await fetchHumidityLogs(payload)
            setLabel(type == 'temp' ? string.chart.Temperature : string.chart.Humidity)
            temperatureHumitityLogs.data.map((log, i) => {
                chartLabels.push(getLocalTime(log.createdAt))
                const tempHumLog = type == 'temp' ? log.temperature : log.humidity
                chartValue.push(tempHumLog)
            })
            setLabels(chartLabels)
            setValues(chartValue)

            NProgress.done()
        } catch (err) {
            console.error(string.chart.Errorwhilefethinglogs + ' => ', err)
            NProgress.done()
        }
    }

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
    if (projectDetails.alert_type == '1' && allFilterNull) {
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
    }

    const chartOpts = {
        scales: {
            yAxes: [
                {
                    ticks: {
                        beginAtZero: true,
                        min: type == 'temp' ? getTicks(parseInt(tempmin) - parseInt(20), 'min') : getTicks(parseInt(humidmin) - parseInt(20), 'min'),
                        max: type == 'temp' ? getTicks(parseInt(tempmax) + parseInt(20), 'max') : getTicks(parseInt(humidmax) + parseInt(20), 'max'),
                    },
                },
            ],
            xAxes: [
                {
                    ticks: {
                        autoSkip: true,
                        maxRotation: 90,
                        minRotation: 90,
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

    return (
        <div className='project-table-listing table-responsive mt-2 mb-2'>
            <Line data={chartData} options={chartOpts} plugins={[ChartAnnotation]} />
        </div>
    )
}

export default LineChart
