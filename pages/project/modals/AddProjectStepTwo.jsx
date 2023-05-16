import React, { useEffect, useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { find, isEmpty, isArray, isObject } from 'lodash'
import { Collapse, CardBody, Card } from 'reactstrap'
import NProgress from 'nprogress'
import LabelEditModal from './labelEditModal'
import notify from '../../../lib/notifier'
import string from '../../../utils/LanguageTranslation.js'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import Input from '../../../components/common/form-elements/input/Input'
import Button from '../../../components/common/form-elements/button/Button'
import ProjectSelection from '../../../components/projects/ProjectSelection'
import '../../../static/css/projectSecond.css'
import { Table } from 'react-bootstrap'
import Switch from 'react-ios-switch'
import { addTruck, fetchTrucks } from '../../../lib/api/truck'
import { addContainer, fetchContainers } from '../../../lib/api/container'
import { addGroup, fetchGroups } from '../../../lib/api/group'
import { addItem, fetchItems } from '../../../lib/api/item'
import { fetchDevices } from '../../../lib/api/device'
import { otherLanguage } from '../../../utils/selectedLanguage'
import { fetchSelectionProject, fetchAllProjectSelections } from '../../../lib/api/project'
import { dynamicLanguageStringChange } from '../../../utils/globalFunc'
import Spinner from '../../../components/common/OverlaySpinner'

const AddProjectStepTwo = ({ mode, setState, state, changeStep, project_id, isReadOnly }) => {
    if (typeof window === 'undefined') {
        return null
    }
    const [allProjects, setAllProjects] = useState([])
    const [itemID, setItemID] = useState('')
    const [groupID, setGroupID] = useState('')
    const [containerID, setContainerID] = useState('')
    const [truckID, setTruckID] = useState('')
    const [field, setField] = useState('')
    const [showEditModal, setShowEditModal] = useState(false)
    const [initialItems, setInitialItems] = useState(0)
    const [isLoadingContent, setIsLoadingContent] = useState(false)

    const [labels, setLabels] = useState({
        group3: 'Group 3',
        group2: 'Group 2',
        group1: 'Group 1',
        item: 'Item',
        local_group3: 'БАГЦ 3',
        local_group2: 'БАГЦ 2',
        local_group1: 'БАГЦ 1',
        local_item: 'Item',
    })

    const [selectionAllList, setSelectionAllList] = useState({
        groups: [],
        trucks: [],
        containers: [],
        items: [],
        devices: [],
    })

    // Below Common name declare for label name depends on language.
    const group3 = otherLanguage && labels.local_group3 ? labels.local_group3 : labels.group3
    const group2 = otherLanguage && labels.local_group2 ? labels.local_group2 : labels.group2
    const group1 = otherLanguage && labels.local_group1 ? labels.local_group1 : labels.group1
    const item = otherLanguage && labels.local_item ? labels.local_item : labels.item

    const updateSelectionAllList = (value, key) => {
        if (isArray(value)) {
            setSelectionAllList((preState) => ({
                ...preState,
                [key]: value,
            }))
        }
        if (isObject(value)) {
            setSelectionAllList((preState) => ({
                ...preState,
                ...value,
            }))
        }
    }

    const formik = useFormik({
        initialValues: {
            temperature_alert_min: state?.project?.temperature_alert_min || '',
            temperature_alert_max: state?.project?.temperature_alert_max || '',
            temperature_alert_interval: state?.project?.temperature_alert_interval || '',
            temperature_allowed_occurances: state?.project?.temperature_allowed_occurances || '',
            humidity_alert_min: state?.project?.humidity_alert_min || '',
            humidity_alert_max: state?.project?.humidity_alert_max || '',
            humidity_alert_interval: state?.project?.humidity_alert_interval || '',
            humidity_allowed_occurances: state?.project?.humidity_allowed_occurances || '',
            ambience_threshold: state?.project?.ambience_threshold || '',
            selections: [],
            ...state.project,
        },
        validationSchema: Yup.object({
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
        }),

        onSubmit: async (values, { resetForm }) => {
            setState({
                project: {
                    ...values,
                },
            })

            goToNextStep()
        },
    })

    const goInit = async () => {
        setIsLoadingContent(true)
        if (project_id) {
            const project = await fetchSelectionProject({ project_id })
            setInitialItems(project.length)
            constructProjectSelection(project)
        }
        const groups = await fetchGroups()
        const trucks = await fetchTrucks()
        const containers = await fetchContainers()
        const items = await fetchItems()
        const devices = await fetchDevices()
        setSelectionAllList({
            groups,
            trucks,
            containers,
            items,
            devices,
        })
        const allProjectSelections = await fetchAllProjectSelections()
        setAllProjects(allProjectSelections)
        setIsLoadingContent(false)
    }

    useEffect(() => {
        goInit()
    }, [project_id])

    const setCustomLabel = (custom_labels) => {
        setLabels(custom_labels)
        formik.setErrors({})
    }

    const constructProjectSelection = (project) => {
        const projectSelection = { ...project }
        projectSelection.selectedUsers = []
        projectSelection.selectedOrganizations = []
        projectSelection.selectedRoads = []
        const selections = []
        project.project_selections.map((project_selection) => {
            const selection = { devices: [] }
            const selectionTemperatureArray = project_selection.project_alerts.map((sel) => {
                const selectiontemprature = {
                    ...sel,
                    selectionId: sel.selection_element,
                }

                return selectiontemprature
            })
            selection.selectionTemperatureArray = selectionTemperatureArray
            project_selection.selection_items.map((item) => {
                selection.item_id = item.item_id
                selection.item_is_start = item.is_start
                selection.item_start_date_time = item.start_date_time
            })
            project_selection.selection_containers.map((container) => {
                selection.container_id = container.container_id
            })
            if (project_selection.selection_devices.length == 0) {
                selection.devices.push({
                    // Data interval remove from UI
                    // data_interval: '',
                    device_id: '',
                    tag: '',
                })
            } else
                project_selection.selection_devices.map((device) => {
                    // Data interval remove from UI
                    // selection.data_interval = device.data_interval
                    selection.device_id = device.device_id
                    selection.tag = device?.device?.tag
                    selection.devices.push({
                        // Data interval remove from UI
                        // data_interval: device.data_interval,
                        device_id: device.device_id,
                        tag: device?.device?.tag,
                    })
                })
            project_selection.selection_groups.map((group) => {
                selection.group_id = group.group_id
            })
            project_selection.selection_trucks.map((truck) => {
                selection.truck_id = truck.truck_id
            })
            selection.disableContainer = true
            selection.disableTruck = true
            selection.disableGroup = true
            selections.push(selection)
        })
        projectSelection.selections = selections
        if (project.custom_labels) setCustomLabel({ ...labels, ...JSON.parse(project.custom_labels) })
        formik.setValues({ ...formik.values, ...projectSelection })
    }

    const addItemData = async (itemID) => {
        const { items } = selectionAllList
        if (
            items.filter(function (e) {
                return e.itemID.toLowerCase() === itemID.trim().toLowerCase()
            }).length > 0
        ) {
            notify(`${dynamicLanguageStringChange(string.project.itemAlreadyExists, labels)}`)
            return false
        }
        NProgress.start()
        const item = await addItem({ itemID: itemID })
        items.push(item)
        updateSelectionAllList({ items })
        NProgress.done()
        notify(`${dynamicLanguageStringChange(string.project.itemidHasBeenAdded, labels)}`)
        return true
    }

    const addGroupData = async (groupID) => {
        const { groups } = selectionAllList
        if (
            groups.filter(function (e) {
                return e.groupID.toLowerCase() === groupID.trim().toLowerCase()
            }).length > 0
        ) {
            notify(`${dynamicLanguageStringChange(string.project.group3AlreadyExists, labels)}`)
            return false
        }
        NProgress.start()
        const group = await addGroup({ groupID: groupID })
        groups.push(group)
        updateSelectionAllList({ groups })
        NProgress.done()
        notify(`${dynamicLanguageStringChange(string.project.group3IdHasBeenAdded, labels)}`)
        return true
    }

    const addTruckData = async (truckID) => {
        const { trucks } = selectionAllList
        if (
            trucks.filter(function (e) {
                return e.truckID.toLowerCase() === truckID.trim().toLowerCase()
            }).length > 0
        ) {
            notify(`${dynamicLanguageStringChange(string.project.group2AlreadyExists, labels)}`)
            return false
        }
        NProgress.start()
        const truck = await addTruck({ truckID: truckID })
        trucks.push(truck)
        updateSelectionAllList({ trucks })
        NProgress.done()
        notify(`${dynamicLanguageStringChange(string.project.group2IdHasBeenAdded, labels)}`)
        return true
    }

    const addContainerData = async (containerID) => {
        const { containers } = selectionAllList
        if (
            containers.filter(function (e) {
                return e.containerID.toLowerCase() === containerID.trim().toLowerCase()
            }).length > 0
        ) {
            notify(`${dynamicLanguageStringChange(string.project.group1AlreadyExists, labels)}`)
            return false
        }
        NProgress.start()
        const container = await addContainer({
            containerID: containerID,
        })
        containers.push(container)
        updateSelectionAllList({ containers })
        NProgress.done()
        notify(`${dynamicLanguageStringChange(string.project.group1IdHasBeenAdded, labels)}`)
        return true
    }

    const backStep = (event) => {
        event.preventDefault()
        changeStep(1)
    }

    const _addSelection = () => {
        const newSelection = {
            item_id: '',
            container_id: '',
            tag: '',
            device_id: '',
            devices: [
                {
                    device_id: '',
                    tag: '',
                },
            ],
            projectselectiontype: '',
            group_id: 1,
            truck_id: 1,
            selectionTemperatureArray: [],
            isTemporary: true,
            disableContainer: true,
            disableTruck: true,
            disableGroup: true,
        }

        const selections = formik.values.selections
        selections.push(newSelection)
        formik.setFieldValue('selections', selections)
    }

    const goToNextStep = async () => {
        let error = false

        // Validate empty state
        if (formik.values.selections.length == 0) {
            notify(`${string.project.noSelectionMade}`)
            return false
        }

        allProjects.map((project) => {
            if (!project.isDraft) {
                if (project.id != formik.values.id) {
                    project.project_selections.map((old_selection) => {
                        formik.values.selections.map((current_selection, i) => {
                            // Item
                            const ifCardoExists = find(old_selection.selection_items, (item) => item.item_id == current_selection.item_id)
                            if (ifCardoExists) {
                                formik.setFieldError(`item_id_${i}`, `${dynamicLanguageStringChange(string.project.itemAlreadyInUse, labels)}`)
                                error = true
                            } else if (formik.values.selections.length > 1) {
                                const ifItemInOtherContainer = formik.values.selections.find((sel, seli) => seli < i && sel.container_id != current_selection.container_id && sel.item_id == current_selection.item_id)
                                if (ifItemInOtherContainer) {
                                    formik.setFieldError(`item_id_${i}`, `${dynamicLanguageStringChange(string.project.itemAlreadyInUse, labels)}`)
                                    error = true
                                }
                            }

                            // Truck
                            if (current_selection.truck_id != 1) {
                                const ifTruckExists = find(old_selection.selection_trucks, (item) => item.truck_id == current_selection.truck_id)
                                if (ifTruckExists) {
                                    formik.setFieldError(`truck_id_${i}`, `${dynamicLanguageStringChange(string.project.group2AlreadyInUse, labels)}`)
                                    error = true
                                } else if (formik.values.selections.length > 1) {
                                    const ifTruckInOtherGp = formik.values.selections.find((sel, seli) => seli < i && sel.group_id != current_selection.group_id && sel.truck_id == current_selection.truck_id)
                                    if (ifTruckInOtherGp) {
                                        formik.setFieldError(`truck_id_${i}`, `${dynamicLanguageStringChange(string.project.group2AlreadyInUse, labels)}`)
                                        error = true
                                    }
                                }
                            }

                            // Container
                            const ifContainerExists = find(old_selection.selection_containers, (item) => item.container_id == current_selection.container_id)
                            if (ifContainerExists && current_selection.container_id != 1) {
                                formik.setFieldError(`container_id_${i}`, `${dynamicLanguageStringChange(string.project.group1AlreadyInUse, labels)}`)
                                error = true
                            } else if (formik.values.selections.length > 1) {
                                const ifContainerInOtherTruck = formik.values.selections.find((sel, seli) => seli < i && sel.truck_id != current_selection.truck_id && sel.container_id == current_selection.container_id)
                                if (ifContainerInOtherTruck) {
                                    formik.setFieldError(`container_id_${i}`, `${dynamicLanguageStringChange(string.project.group1AlreadyInUse, labels)}`)
                                    error = true
                                }
                            }
                        })
                    })
                }
            }
        })

        // Custom validations
        formik.values.selections.map((selection, i) => {
            if (!selection.item_id) {
                formik.setFieldError(`item_id_${i}`, `${item} ${string.errors.required}`)
                error = true
            }
            if (!selection.container_id) {
                formik.setFieldError('container_id_' + i, `${group1} ${string.errors.required}`)
                error = true
            }
            if (!selection.group_id) {
                formik.setFieldError('group_id_' + i, `${group3} ${string.errors.required}`)
                error = true
            }
            if (!selection.truck_id) {
                formik.setFieldError('truck_id_' + i, `${group2} ${string.errors.required}`)
                error = true
            }
        })
        const value = formik.values
        value.custom_labels = JSON.stringify(labels)
        delete value.name
        delete value.project_category_id
        delete value.project_category
        setState({ project: { ...state.project, ...value } })
        if (isEmpty(formik.errors) && !error) {
            changeStep(3)
        }
    }

    const submitProject = (formik) => {
        // formik.values.isDraft = 0
        formik.handleSubmit(formik.values)
    }

    const updateSelectionalert = () => {
        if (
            formik.errors.temperature_alert_min == undefined &&
            formik.errors.temperature_alert_max == undefined &&
            formik.errors.temperature_alert_interval == undefined &&
            formik.errors.temperature_allowed_occurances == undefined &&
            formik.errors.humidity_alert_min == undefined &&
            formik.errors.humidity_alert_max == undefined &&
            formik.errors.humidity_alert_interval == undefined &&
            formik.errors.humidity_allowed_occurances == undefined &&
            formik.errors.ambience_threshold == undefined
        ) {
            formik.values.selections.map(function (selection, i) {
                selection.selectionTemperatureArray.map((selectionAlert) => {
                    selectionAlert.selectionId = ''
                    selectionAlert.changed_selection = '0'
                    selectionAlert.ambience_threshold = formik.values.ambience_threshold
                    selectionAlert.humidity_alert_interval = formik.values.humidity_alert_interval
                    selectionAlert.humidity_alert_max = formik.values.humidity_alert_max
                    selectionAlert.humidity_alert_min = formik.values.humidity_alert_min
                    selectionAlert.humidity_allowed_occurances = formik.values.humidity_allowed_occurances
                    selectionAlert.temperature_alert_interval = formik.values.temperature_alert_interval
                    selectionAlert.temperature_alert_max = formik.values.temperature_alert_max
                    selectionAlert.temperature_alert_min = formik.values.temperature_alert_min
                    selectionAlert.temperature_allowed_occurances = formik.values.temperature_allowed_occurances

                    return selectionAlert
                })
                selection.projectselectiontype = ''
                return selection
            })
            notify(`${string.project.projectSelectionUpdated}`)
        } else {
            notify(`${string.project.errorprojectSelectionUpdated}`)
        }
    }

    const setEditMode = (fieldName) => {
        setField(fieldName)
        setShowEditModal(!showEditModal)
    }

    if (typeof window === 'undefined') {
        return null
    }
    let isDisabled = false
    if (mode == 'edit' && state.selectedTab == 'PROJECT_LISTING') {
        isDisabled = true
    }

    return (
        <div className='project-steps'>
            {isLoadingContent && <Spinner />}
            <div>
                <div className='row borderProject rounded mb-3 p-2 ml-0 mr-0'>
                    <div className='col-md-6 pl-0 pr-0'>
                        <div className='row m-0'>
                            <div className='form-group col-md-6 pl-0'>
                                <label className='col-md-12 col-form-label pl-0 text-uppercase'>
                                    {`${string.project.add} ${group3}`}
                                    <i className='fa fa-pencil-alt ml-1 cursor-pointer' onClick={() => setEditMode('group3')} />
                                </label>
                                <div className='col-md-12 position-relative p-0 d-flex'>
                                    <Input
                                        type='text'
                                        name='groupID'
                                        value={groupID || ''}
                                        placeholder={string.project.typeId}
                                        className='form-control borderProject radius-0'
                                        onChange={(event) => {
                                            setGroupID(event.target.value)
                                        }}
                                        disabled={isReadOnly}
                                    />
                                    {/* add btn */}
                                    {isReadOnly ? (
                                        <div
                                            className='add-btn'
                                            onClick={async (event) => {
                                                event.preventDefault()
                                            }}
                                        >
                                            <Button
                                                disabled={isReadOnly}
                                                className='btn'
                                                style={{
                                                    border: '1px solid #C0C0C0',
                                                    cursor: 'not-allowed',
                                                }}
                                            >
                                                <i className='fas fa-plus fa-sm' />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div
                                            className='add-btn'
                                            onClick={async (event) => {
                                                event.preventDefault()
                                                if (!groupID.trim()) {
                                                    notify(`${dynamicLanguageStringChange(string.project.pleaseEnterGroup3Id, labels)}`)
                                                    setGroupID('')
                                                    return false
                                                }
                                                const pattern = /^(?!.*["'`\\])/
                                                if (!pattern.test(groupID)) {
                                                    notify(`${dynamicLanguageStringChange(string.project.invalidGroup3Id, labels)}`)
                                                    return false
                                                }
                                                // call parent class's function to add new Item
                                                ;(await addGroupData(groupID)) ? setGroupID('') : ''
                                            }}
                                        >
                                            <Button
                                                className='btn'
                                                style={{
                                                    border: '1px solid #C0C0C0',
                                                }}
                                            >
                                                <i className='fas fa-plus fa-sm' />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className='form-group col-md-6 pl-0'>
                                <label className='col-md-12 col-form-label pl-0 text-uppercase'>
                                    {`${string.project.add} ${group2}`}
                                    <i className='fa fa-pencil-alt ml-1 cursor-pointer' onClick={() => setEditMode('group2')} />
                                </label>
                                <div className='col-md-12 position-relative p-0 d-flex'>
                                    <Input
                                        disabled={isReadOnly}
                                        type='text'
                                        name='truckID'
                                        value={truckID || ''}
                                        placeholder={string.project.typeId}
                                        className='form-control borderProject radius-0'
                                        onChange={(event) => {
                                            setTruckID(event.target.value)
                                        }}
                                    />
                                    {/* add btn */}
                                    {isReadOnly ? (
                                        <div
                                            className='add-btn'
                                            onClick={async (event) => {
                                                event.preventDefault()
                                            }}
                                        >
                                            <Button
                                                disabled={isReadOnly}
                                                style={{
                                                    border: '1px solid #C0C0C0',
                                                    cursor: 'not-allowed',
                                                }}
                                                className='btn'
                                            >
                                                <i className='fas fa-plus fa-sm' />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div
                                            className='add-btn'
                                            onClick={async (event) => {
                                                event.preventDefault()
                                                if (!truckID.trim()) {
                                                    notify(dynamicLanguageStringChange(string.project.pleaseEnterGroup2Id, labels))
                                                    setTruckID('')
                                                    return false
                                                }
                                                const pattern = /^(?!.*["'`\\])/
                                                if (!pattern.test(truckID)) {
                                                    notify(`${dynamicLanguageStringChange(string.project.invalidGroup2Id, labels)}`)
                                                    return false
                                                }
                                                //call parent class's function to add new Truck
                                                ;(await addTruckData(truckID)) ? setTruckID('') : ''
                                            }}
                                        >
                                            <Button
                                                style={{
                                                    border: '1px solid #C0C0C0',
                                                }}
                                                className='btn'
                                            >
                                                <i className='fas fa-plus fa-sm' />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {/* //add btn */}
                            </div>
                        </div>
                    </div>
                    <div className='col-md-6 pl-0 pr-0'>
                        <div className='row m-0 '>
                            <div className='form-group col-md-6 pl-0'>
                                <label className='col-md-12 col-form-label pl-0 text-uppercase'>
                                    {`${string.project.add} ${group1}`}
                                    <i className='fa fa-pencil-alt ml-1 cursor-pointer' onClick={() => setEditMode('group1')} />
                                </label>
                                <div className='col-md-12 text-dark position-relative p-0 d-flex'>
                                    <Input
                                        disabled={isReadOnly}
                                        type='text'
                                        name='containerID'
                                        value={containerID || ''}
                                        placeholder={string.project.typeId}
                                        className='form-control borderProject radius-0'
                                        onChange={(event) => {
                                            setContainerID(event.target.value)
                                        }}
                                    />
                                    {isReadOnly ? (
                                        <div
                                            className='add-btn'
                                            onClick={async (event) => {
                                                event.preventDefault()
                                            }}
                                        >
                                            <Button
                                                disabled={isReadOnly}
                                                style={{
                                                    border: '1px solid #C0C0C0',
                                                    cursor: 'not-allowed',
                                                }}
                                                className='btn'
                                            >
                                                <i className='fas fa-plus fa-sm' />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div
                                            className='add-btn'
                                            onClick={async (event) => {
                                                event.preventDefault()
                                                if (!containerID.trim()) {
                                                    notify(`${dynamicLanguageStringChange(string.project.pleaseEnterGroup1Id, labels)}`)
                                                    setContainerID('')
                                                    return false
                                                }
                                                const pattern = /^(?!.*["'`\\])/
                                                if (!pattern.test(containerID)) {
                                                    notify(`${dynamicLanguageStringChange(string.project.invalidGroup1Id, labels)}`)
                                                    return false
                                                }

                                                ;(await addContainerData(containerID)) ? setContainerID('') : ''
                                            }}
                                        >
                                            <Button
                                                style={{
                                                    border: '1px solid #C0C0C0',
                                                }}
                                                className='btn'
                                            >
                                                <i className='fas fa-plus fa-sm' />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className='form-group col-md-6 pl-0'>
                                <label className='col-md-12 col-form-label pl-0 text-uppercase'>
                                    {`${string.project.add} ${item}`}
                                    <i className='fa fa-pencil-alt ml-1 cursor-pointer' onClick={() => setEditMode('item')} />
                                </label>
                                <div className='col-md-12 position-relative p-0 d-flex'>
                                    <Input
                                        disabled={isReadOnly}
                                        type='text'
                                        name='itemID'
                                        placeholder={dynamicLanguageStringChange(string.project.addTypeItemId, labels)}
                                        value={itemID || ''}
                                        className='form-control borderProject radius-0'
                                        onChange={(event) => {
                                            setItemID(event.target.value)
                                        }}
                                    />
                                    {/* add btn */}
                                    {isReadOnly ? (
                                        <div
                                            className='add-btn'
                                            onClick={async (event) => {
                                                event.preventDefault()
                                            }}
                                        >
                                            <Button
                                                disabled={isReadOnly}
                                                style={{
                                                    border: '1px solid #C0C0C0',
                                                    cursor: 'not-allowed',
                                                }}
                                                className='btn'
                                            >
                                                <i className='fas fa-plus fa-sm' />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div
                                            className='add-btn'
                                            onClick={async (event) => {
                                                event.preventDefault()
                                                if (!itemID.trim()) {
                                                    notify(dynamicLanguageStringChange(string.pleaseEnterItemId, labels))
                                                    setItemID('')
                                                    return false
                                                }
                                                const pattern = /^(?!.*["'`\\])/
                                                if (!pattern.test(itemID)) {
                                                    notify(`${dynamicLanguageStringChange(string.project.invalidItemId, labels)}`)
                                                    return false
                                                }
                                                // call parent class's function to add new Item
                                                ;(await addItemData(itemID)) ? setItemID('') : ''
                                            }}
                                        >
                                            <Button
                                                style={{
                                                    border: '1px solid #C0C0C0',
                                                }}
                                                className='btn'
                                            >
                                                <i className='fas fa-plus fa-sm' />
                                            </Button>
                                        </div>
                                    )}

                                    {/* //add btn */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='borderProject p-2 pb-4 rounded'>
                    <div>
                        <h5 className='text-dark projectAlert'>{string.alertEvents}</h5>
                    </div>
                    <div className='flex'>
                        <Collapse isOpen>
                            <Card className='border-0 mt-1'>
                                <form className='form-container' onSubmit={formik.handleSubmit}>
                                    <CardBody className='p-0'>
                                        <div className='mt-1'>
                                            <div className='ProjectContainertemp d-flex borderProject alertBox1 rounded py-2'>
                                                <div className='col-1 p-0'>
                                                    <div className='projectIcon2'>
                                                        <img src='../../static/img/thermometer.png' width='20px' />
                                                    </div>
                                                </div>
                                                <div className='col-5 p-0'>
                                                    <label className='col-md-12 col-form-label pl-0'>{string.project.tempraturedegree}</label>
                                                    <div className='col-md-12 d-flex p-0'>
                                                        <div className='col-6 p-0 pr-2'>
                                                            <Input type='text' name='temperature_alert_min' value={formik.values.temperature_alert_min || ''} className='form-control borderProject radius-0' placeholder={string.project.minRange} onChange={formik.handleChange} disabled={isDisabled} />
                                                            {formik.errors.temperature_alert_min ? <FormHelperMessage className='err' message={formik.errors.temperature_alert_min} /> : null}
                                                        </div>
                                                        <div className='col-6 p-0 pr-2'>
                                                            <Input type='text' name='temperature_alert_max' value={formik.values.temperature_alert_max || ''} className='form-control borderProject radius-0' placeholder={string.project.maxRange} onChange={formik.handleChange} disabled={isDisabled} />
                                                            {formik.errors.temperature_alert_max ? <FormHelperMessage className='err' message={formik.errors.temperature_alert_max} /> : null}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='col-3 p-0'>
                                                    <label className='col-md-12 col-form-label pl-0'>{string.project.tempratureinterval}</label>
                                                    <Input
                                                        type='text'
                                                        name='temperature_alert_interval'
                                                        value={formik.values.temperature_alert_interval || ''}
                                                        className='form-control borderProject radius-0'
                                                        placeholder={string.project.intervalMinutes}
                                                        onChange={formik.handleChange}
                                                        disabled={isDisabled}
                                                    />
                                                    {formik.errors.temperature_alert_interval ? <FormHelperMessage className='err' message={formik.errors.temperature_alert_interval} /> : null}
                                                </div>
                                                <div className='col-3'>
                                                    <label className='col-md-12 col-form-label pl-0'>{string.project.allowedOccurance}</label>
                                                    <Input
                                                        type='text'
                                                        name='temperature_allowed_occurances'
                                                        value={formik.values.temperature_allowed_occurances || ''}
                                                        className='form-control borderProject radius-0'
                                                        placeholder={string.project.times}
                                                        onChange={formik.handleChange}
                                                        disabled={isDisabled}
                                                    />
                                                    {formik.errors.temperature_allowed_occurances ? <FormHelperMessage className='err' message={formik.errors.temperature_allowed_occurances} /> : null}
                                                </div>
                                            </div>
                                            <div className='ProjectContainertemp d-flex borderProject alertBox1 rounded py-2'>
                                                <div className='col-1 p-0'>
                                                    <div className='projectIcon2'>
                                                        <img src='../../static/img/humidity.png' width='20px' />
                                                    </div>
                                                </div>
                                                <div className='col-5 p-0'>
                                                    <label className='col-md-12 col-form-label pl-0'>{string.project.humidityperc}</label>
                                                    <div className='col-md-12 d-flex p-0'>
                                                        <div className='col-6 p-0 pr-2'>
                                                            <Input type='text' name='humidity_alert_min' value={formik.values.humidity_alert_min || ''} className='form-control borderProject radius-0' placeholder={string.project.minRange} onChange={formik.handleChange} disabled={isDisabled} />
                                                            {formik.errors.humidity_alert_min ? <FormHelperMessage className='err' message={formik.errors.humidity_alert_min} /> : null}
                                                        </div>
                                                        <div className='col-6 p-0 pr-2'>
                                                            <Input type='text' name='humidity_alert_max' value={formik.values.humidity_alert_max || ''} className='form-control borderProject radius-0' placeholder={string.project.maxRange} onChange={formik.handleChange} disabled={isDisabled} />
                                                            {formik.errors.humidity_alert_max ? <FormHelperMessage className='err' message={formik.errors.humidity_alert_max} /> : null}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='col-3 p-0'>
                                                    <label className='col-md-12 col-form-label pl-0'>{string.project.tempratureinterval}</label>
                                                    <Input
                                                        type='text'
                                                        name='humidity_alert_interval'
                                                        value={formik.values.humidity_alert_interval || ''}
                                                        className='form-control borderProject radius-0'
                                                        placeholder={string.project.intervalMinutes}
                                                        onChange={formik.handleChange}
                                                        disabled={isDisabled}
                                                    />
                                                    {formik.errors.humidity_alert_interval ? <FormHelperMessage className='err' message={formik.errors.humidity_alert_interval} /> : null}
                                                </div>
                                                <div className='col-3'>
                                                    <label className='col-md-12 col-form-label pl-0'>{string.project.allowedOccurance}</label>
                                                    <Input type='text' name='humidity_allowed_occurances' value={formik.values.humidity_allowed_occurances || ''} className='form-control borderProject radius-0' placeholder={string.project.times} onChange={formik.handleChange} disabled={isDisabled} />
                                                    {formik.errors.humidity_allowed_occurances ? <FormHelperMessage className='err' message={formik.errors.humidity_allowed_occurances} /> : null}
                                                </div>
                                            </div>
                                            <div className='ProjectContainertemp d-flex borderProject alertBox1 rounded py-2'>
                                                <div className='col-1 p-0'>
                                                    <div className='projectIcon2'>
                                                        <img src='../../static/img/seal.png' width='20px' />
                                                    </div>
                                                </div>
                                                <div className='col-5 p-0'>
                                                    <label className='col-md-12 col-form-label pl-0'>{string.project.sealingambience}</label>
                                                    <div className='d-flex p-0'>
                                                        <div className='col-6 p-0 pr-2'>
                                                            <Input type='text' name='ambience_threshold' value={formik.values.ambience_threshold || ''} className='form-control borderProject radius-0' placeholder={string.project.brakingPoints} onChange={formik.handleChange} disabled={isDisabled} />
                                                            {formik.errors.ambience_threshold ? <FormHelperMessage className='err' message={formik.errors.ambience_threshold} /> : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='d-flex mt-3 ios-switch-btn'>
                                                <div className='sw-btn-col-1'>{string.perprojectalert}</div>
                                                <div className='sw-btn-col-2'>
                                                    <Switch
                                                        checked={formik.values?.alert_type > 1}
                                                        onChange={(val) => {
                                                            formik.setFieldValue('alert_type', !val ? 1 : 2)
                                                        }}
                                                        onColor='red'
                                                    />
                                                </div>
                                                <div className='sw-btn-col-3'>{string.perunitalert}</div>
                                                <Button style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }} disabled={isDisabled} className='btn btn-primary large-btn' type='button' onClick={updateSelectionalert}>
                                                    {string.updatebtnval}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardBody>
                                </form>
                            </Card>
                        </Collapse>
                    </div>
                </div>
                <div className='project-table-listing borderProject p-2 mt-3 rounded table-responsive'>
                    <div>
                        <Table responsive='xl'>
                            <thead>
                                <tr className='text-center text-light'>
                                    <th className='align-middle'>{group3}</th>
                                    <th className='align-middle'>{group2}</th>
                                    <th className='align-middle'>{group1}</th>
                                    <th className='align-middle'>{item}</th>
                                    <th width='30%'>
                                        <div className='row align-items-center'>
                                            <span className='col-6 pl-0'>{string.project.device}</span>
                                            <span className='col-5 px-0'>{string.project.tag}</span>
                                            {/* Data interval remove from UI */}
                                            {/* <span className='col-4 pr-0 text-left'>{string.project.dataInterval}</span> */}
                                        </div>
                                    </th>
                                    <th width='8%' className='align-middle'>
                                        {string.project.actions}
                                    </th>
                                </tr>
                            </thead>
                            <tbody style={{ verticalAlign: 'top' }}>
                                {formik.values.selections.map((selection, i) => {
                                    return (
                                        <ProjectSelection
                                            key={i}
                                            selectionAllList={selectionAllList}
                                            updateSelectionAllList={updateSelectionAllList}
                                            project_selections={formik.values.selections}
                                            formik={formik}
                                            i={i}
                                            state={state}
                                            setState={setState}
                                            selection={selection}
                                            labels={labels}
                                            projectalerttype={formik.values?.alert_type != '2'}
                                            selectedTab={state.selectedTab}
                                            initialItems={initialItems}
                                            shouldDisabled={!selection?.isTemporary && mode === 'edit' && state.selectedTab === 'PROJECT_LISTING'}
                                        />
                                    )
                                })}
                            </tbody>
                        </Table>
                    </div>
                    {isReadOnly ? (
                        <div
                            className='add-btn'
                            style={{ margin: 'auto' }}
                            onClick={async (event) => {
                                event.preventDefault()
                            }}
                        >
                            <Button style={{ cursor: 'not-allowed' }} className='btn'>
                                <i className='fas fa-plus fa-sm' disabled />
                            </Button>
                        </div>
                    ) : (
                        <div
                            className='add-btn'
                            style={{ margin: 'auto' }}
                            onClick={async (event) => {
                                event.preventDefault()
                                _addSelection()
                            }}
                        >
                            <Button className='btn'>
                                <i className='fas fa-plus fa-sm' />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            <div className='modal-footer'>
                <Button className='btn btn-secondary large-btn' type='button' onClick={backStep}>
                    {string.onboarding.btn.back}
                </Button>
                <Button className='btn btn-primary large-btn' type='button' onClick={() => submitProject(formik)}>
                    {string.project.next}
                </Button>
            </div>
            <LabelEditModal isOpen={showEditModal} toggle={() => setShowEditModal(!showEditModal)} setCustomLabel={setCustomLabel} labels={labels} field={field} />
        </div>
    )
}

AddProjectStepTwo.propTypes = {}
AddProjectStepTwo.defaultProps = {}

export default AddProjectStepTwo
