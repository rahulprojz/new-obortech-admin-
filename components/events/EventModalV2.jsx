import React, { useContext, useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import _, { sortBy } from 'lodash'
import moment from 'moment-timezone'
import { useRouter } from 'next/router'
import DatePicker from 'react-datepicker'
import { ReactFormGenerator } from 'chaincodedev-form-builder'
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import { components } from 'react-select'
import FormatLabel from '../UI/Label'
import DateCustomInput, { CustomTimeInput } from '../DateCustomInput'
import Loader from '../../components/common/Loader'
import RightDrawer from './RightDrawer'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import AdvanceSelect from '../common/form-elements/select/AdvanceSelect'
import { getLocalTime, b64toBlob, checkFileSize, _generateUniqId } from '../../utils/globalFunc'
import EventContext from '../../store/event/eventContext'
import WatchAllEventContext from '../../store/watchAllEvent/watchAllEventContext'
import notify from '../../lib/notifier'
import { fetchEvents } from '../../lib/api/event'
import { fetchPdcUsers } from '../../lib/api/user'
import { fetchFormData, getForm } from '../../lib/api/formBuilder'
import { fetchProjectPDC } from '../../lib/api/pdc-category'
import { fetchProjectSubEventsMongoose } from '../../lib/api/project-event'
import { fetchProjectEventDevice } from '../../lib/api/device'
import { fetchProjectViewAcceptOrg } from '../../lib/api/project-event'
import { fetchAssets } from '../../lib/api/inventory-assets'
import { saveEditedFile, saveImages, savePdf } from '../../lib/api/guest'
import { fetchCategoryPDC, fetchPDCByEvent, fetchEventByPDC } from '../../lib/api/pdc-category'
import { updateIotDataOn, updateIotDataOff } from '../../lib/api/device'
import { getRootUrl } from '../../lib/api/getRootUrl'
import string from '../../utils/LanguageTranslation.js'
import { otherLanguage } from '../../utils/selectedLanguage.js'
import { assetElementNames } from '../../lib/constants'
import '../../pages/form-builder/form-builder.css'
import '../../node_modules/react-datepicker/dist/react-datepicker.css'
import 'chaincodedev-form-builder/dist/app.css'
import SubEventsDocumentsComponent from './SubEventsDocumentsComponent'
import AddedSubEventsList from './AddedSubEventsList'
import { getGroupedData } from '../../utils/eventHelper'
import { fetchItemDevice } from '../../lib/api/item'
import { fetchProjectSelections, fetchProjectDetails, fetchGroups, fetchItems } from '../../lib/api/project'
import { fetchLocationLogs } from '../../lib/api/logs'
import { _fetchLocationLogs, normalizeRoadArr } from '../../components/iotreport/filterIotReportData'
import { useQueryBorderInfo, fetchBorderInfo } from '../../lib/api/border-info'
import { fetchTemperatureLogs, fetchHumidityLogs } from '../../lib/api/logs'
import { _momentDateFormat } from '../../utils/globalFunc'
// import {border,containersName,endMarker,groupNames,headerData,itemsNames,mapMarker,polylines,projectDetails,startMarker,stations,truckNames} from "../../static/mockData/iotReport"
import { fetchItemProject } from '../../lib/api/item'

const EventFileUploadEditor = dynamic(() => import('./EventFileUploadEditor'), {
    ssr: false,
})

import '../../node_modules/react-datepicker/dist/react-datepicker.css'

let isIotEventOn = false
let isIotEventOff = false

const viewCustomStyles = {
    multiValueRemove: (base, state) => {
        return state.data.isFixed ? { ...base, display: 'none' } : base
    },
    menu: (base, state) => {
        return {
            ...base,
            boxShadow: state?.selectProps?.inputValue ? base.boxShadow : 'none',
        }
    },
}

const acceptCustomStyles = {
    menu: (base, state) => {
        return {
            ...base,
            boxShadow: state?.selectProps?.inputValue ? base.boxShadow : 'none',
        }
    },
}

const EventModal = ({ project, projectSelections, categoryEvents, pdcEvents, isOpen, toggle, eventParticipantFilters, transportEvents, _submitEvent, is_submitting, watch_all, selectedProjectEvent, selectedPreviewEvent, currentUser, filteredEvent }) => {
    if (typeof window === 'undefined') {
        return null
    }
    const { itemsNames } = useContext(EventContext)
    const [eventSubmissionId, setEventSubmissionId] = useState(_generateUniqId())
    const [event_type, setEventType] = useState(0)
    const [event, setEvent] = useState({})
    const [event_time, setEventTime] = useState('')
    const [selectOptions, setSelectOptions] = useState([])
    const [subEvents, setSubEvents] = useState([])
    const [view_users, setViewUsers] = useState([])
    const [accept_users, setAcceptUsers] = useState([])
    const [event_title, setEventTitle] = useState('')
    const [event_description, setEventDescription] = useState('')
    const [event_location, setEventLocation] = useState('')
    const [event_file, setEventFile] = useState(null)
    const [inputImg, setInputImg] = useState(null)
    const [formexists, setformexists] = useState(false)
    const [formId, setformId] = useState('')
    const [isdisabled, setDisabled] = useState(false)
    const [deadlinedate, setdeadlinedate] = useState(168)
    const [blob, setBlob] = useState(null)
    const [formData, setFormData] = useState([])
    const [events, setEvents] = useState([])
    const [projectId, setProjectId] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [prevAttachment, setPrevAttachment] = useState(null)
    const [prevImageUrl, setPrevImageUrl] = useState(null)
    const [selectedPDC, setSelectedPDC] = useState()
    const [projectPDCList, setProjectPDCList] = useState([])
    const [canUserSubmitEvent, setCanUserSubmitEvent] = useState(true)
    const [isLoading, setIsLoading] = useState([])
    const [isNonPDCEvent, setIsNonPDCEvent] = useState(true)
    const [nonPDCEvent, setNonPDCEvent] = useState([])
    const [isFormLoading, setIsFormLoading] = useState(false)
    const [openPicker, setOpenPicker] = useState(false)
    const editDocument = !!_.size(selectedProjectEvent) && !!_.size(selectedPreviewEvent)
    const [show, setShow] = useState(false)
    const [editImage, setEditImage] = useState('')
    const [selectedPage, setSelectedPage] = useState(null)
    const { selectedItem, selectedContainer } = useContext(EventContext)
    const { selectedItem: selectedItemWatchall, selectedContainer: selectedContainerWatchall } = useContext(WatchAllEventContext)
    const projectDefaultPDCName = project?.pdc_name
    const isPublicEvent = view_users?.some((user) => user?.role == process.env.ROLE_PUBLIC_USER)
    const [selections, setSelection] = useState({
        items: [],
        containers: [],
    })

    const [selectedItemData, setSelectedItemData] = useState(null)
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
    const [mapDataFetched, setMapFetched] = useState(false)
    const [alert, setAlert] = useState({ sealingChecked: true, temperatureChecked: true, humidityChecked: true, tamperChecked: true })
    //iot on and iot off
    const projectSelection = window.localStorage[project.id + '_selection'] || ''
    const selectionsItems = projectSelection ? JSON.parse(projectSelection) : {}
    const [currentProjectId, setFormProjectId] = useState(project.id)
    const [selectedItemId, setSelectedItemId] = useState(selectionsItems?.item?.value)
    const [selectedItemDevices, setSelectedItemDevices] = useState(null)
    const [iotOnOf, setIotOnOf] = useState('')
    const [iotOnDevice, setIotOnDevice] = useState({
        device: null,
        elementId: null,
    })
    const [iotOffDevice, setIotOffDevice] = useState({
        device: null,
        elementId: null,
    })

    const itemLength = selections.items.filter((item) => item.isSelected).length || 1

    const router = useRouter()

    const _allUsers = () => {
        const acceptOptions = []
        const viewUsers = view_users

        if (eventParticipantFilters?.length) {
            let filteredParticipants = eventParticipantFilters

            if (router.query?.project_id && watch_all) {
                filteredParticipants = eventParticipantFilters.filter(({ project_id }) => {
                    return project_id == router.query?.project_id
                })
            }

            if (watch_all && selectedProjectEvent?.project_id) {
                filteredParticipants = eventParticipantFilters.filter(({ project_id }) => {
                    return project_id === selectedProjectEvent?.project_id
                })
            }
            filteredParticipants.map((participant) => {
                participant.organization?.users?.map((user) => {
                    if (user.isApproved && user.status) {
                        const option = {
                            label: `${user.username} ${participant.organization.name}`,
                            userName: user.username,
                            organizationName: participant.organization.name,
                            organization_id: participant.organization.id,
                            value: `${user.id}-${participant.organization.id}`,
                            isFixed: false,
                            role: user.role_id,
                        }
                        if (user.id == currentUser.id) {
                            viewUsers[0] = { ...option, isFixed: true }
                        }
                        acceptOptions.push(option)
                    }
                })
            })
        }
        if (!view_users.length) setViewUsers(viewUsers)
        return _.uniqBy(acceptOptions, 'value')
    }

    const viewAcceptUsersArray = () => {
        const { viewUsers, acceptUsers } = selectedProjectEvent

        return {
            view_orgs: _.map(viewUsers, (view) => `${view.user_id}-${view.organization_id}`),
            accept_orgs: _.map(acceptUsers, (accept) => `${accept.user_id}-${accept.organization_id}`),
        }
    }

    const _fetchProjectViewAcceptOrg = async (eventId = '') => {
        const selectedEventId = event_type || eventId
        if (selectedEventId) {
            const projectEventId = events.find(({ uniqId = '', ...rest }) => {
                return selectedEventId === uniqId
            })
            if (!projectEventId?.projectEventId && !selectedProjectEvent?._id) {
                return
            }
            const viewAccept = viewAcceptUsersArray()

            const acceptOptions = _allUsers()
            setSelectOptions(acceptOptions)

            const viewUserOptions = [],
                acceptUserOptions = []
            acceptOptions.map((option) => {
                let isAccepted = false
                const acceptIndex = viewAccept?.accept_orgs?.findIndex((accept) => option.value == accept)
                const viewIndex = viewAccept?.view_orgs?.findIndex((accept) => option.value == accept)

                if (acceptIndex != -1) {
                    isAccepted = true
                    acceptUserOptions[acceptIndex] = { ...option }
                }
                if (viewIndex != -1) {
                    if (isAccepted) {
                        option.isFixed = true
                    }
                    if (option.userName === currentUser.username) {
                        option.isFixed = true
                    }
                    viewUserOptions[viewIndex] = { ...option }
                }
            })
            setViewUsers(viewUserOptions)
            setAcceptUsers(acceptUserOptions)
        }
    }
    useEffect(() => {
        if (editDocument) {
            _fetchChildSubEvent(selectedProjectEvent.event_submission_id)
            startLoading()
            setdeadlinedate(_.get(selectedProjectEvent, 'document_deadline', 168))
            setEventLocation(selectedProjectEvent.location || '')
            setSelectedPDC(selectedProjectEvent.pdc_id ? selectedProjectEvent.pdc_id?.trim() : selectedProjectEvent.pdc_id || 0) // Fallback for live
            setEventDescription(selectedProjectEvent.description || '')
            setEventTime(selectedProjectEvent.due_date ? moment(getLocalTime(selectedProjectEvent.due_date)).toDate() : '')
            setEventTitle(selectedProjectEvent.title)
            onChangeEventType(selectedProjectEvent.event_id)
            setPrevAttachment(selectedProjectEvent.attachment)
            setPrevImageUrl(selectedProjectEvent.image_url)
            setEvent(selectedProjectEvent.event)
            setPDCUserDetails(selectedProjectEvent.event_id, selectedProjectEvent.pdc_id)
            if (selectedProjectEvent.pdc_id && selectedProjectEvent.pdc_id != 0 && selectedProjectEvent.pdc_id != projectDefaultPDCName) {
                onEventIdChange(selectedProjectEvent.event_id, selectedProjectEvent.pdc_id)
                setIsNonPDCEvent(false)
                setPDCUserDetails(selectedProjectEvent.event_id, selectedProjectEvent.pdc_id)
            } else {
                onEventIdChange(selectedProjectEvent.event_id)
                setEventType(selectedProjectEvent.event_id)
                setCanUserSubmitEvent(true)
                _fetchProjectViewAcceptOrg(selectedProjectEvent.event_id)
            }
            removeLoading()
        } else {
            setIsNonPDCEvent(false)
        }
    }, [])

    useEffect(() => {
        if (projectId && !!selectedProjectEvent.pdc_id) {
            getProjectPDCList()
        }
    }, [projectId, isNonPDCEvent])

    const _fetchChildSubEvent = async (event_submission_id) => {
        try {
            const subEventsList = await fetchProjectSubEventsMongoose({ event_submission_id })
            const subEvents = getGroupedData(subEventsList.projectEvents, '', categoryEvents)
            setSubEvents(subEvents)
        } catch (err) {
            console.log(err)
        }
    }

    const eventList = useMemo(() => {
        let newEvents = []
        let nonPDCEvents = []
        let allEvents = []
        projectPDCList.map((pdcEvent) => {
            pdcEvent.project_pdc_category_events.map(({ event_id }) => {
                if (!allEvents.includes(event_id)) {
                    allEvents.push(event_id)
                }

                if (pdcEvent.pdc_name === selectedPDC) {
                    newEvents.push({ projectEventId: pdcEvent.id, event_id })
                }
            })
        })

        let relatedEvents = []
        pdcEvents.map((item) => {
            if (newEvents?.some((event) => event.event_id === item.uniqId)) {
                relatedEvents.push({
                    ...item,
                    projectEventId: newEvents[0]?.projectEventId,
                })
            }

            if (!allEvents.includes(item.uniqId)) {
                nonPDCEvents.push({ ...item, projectEventId: newEvents[0]?.projectEventId })
            }
        })
        return !!selectedPDC && selectedPDC !== '0' && selectedPDC != projectDefaultPDCName ? relatedEvents || [] : nonPDCEvents
    }, [projectPDCList, pdcEvents, selectedPDC])

    useEffect(() => {
        if (editDocument && !event.uniqId) {
            const selectedEvent = eventList.find((e) => e.uniqId == selectedProjectEvent.event_id)
            setEvent(selectedEvent ? selectedEvent : selectedProjectEvent.event)
        }
        if (editDocument && selectedProjectEvent.event_id) {
            checkIfFormExists(selectedProjectEvent.event_id)
        }
    }, [eventList])

    const getEventDetails = async () => {
        try {
            startLoading()
            const itemProject = await fetchItemProject({ item_id: selectedItem || selectedItemWatchall, container_id: selectedContainer || selectedContainerWatchall })
            const _alertEvents = []
            const projectAlertEvents = await fetchEvents()
            projectAlertEvents.length &&
                projectAlertEvents.map((event) => {
                    _alertEvents.push(event)
                })
            setNonPDCEvent(_alertEvents || [])
            if (project?.id) {
                const projectId = project.id
                setProjectId(projectId)
                if (projectId && !isNonPDCEvent) {
                    await getProjectPDCList(projectId)
                }
                if (selectedPDC == '0') {
                    setCanUserSubmitEvent(true)
                }
            }
            // }
            removeLoading()
        } catch (error) {
            removeLoading()
        }
    }

    //fetch all the devices of a selected item
    useEffect(() => {
        const fetchItemDevices = async () => {
            let itemId
            String(selectedItemId).includes('_') ? (itemId = selectedItemId.split('_')[0]) : (itemId = selectedItemId)
            const response = await fetchItemDevice({
                project_id: currentProjectId,
                item_id: itemId,
                // item_id: selectedItemId,
                container_id: selectedContainer,
            })
            const devices = response?.deviceDetails?.map((ele) => ele.device)
            if (devices) {
                setSelectedItemDevices(devices)
                setSelectedItemData(devices)
                setSelectedDevice({
                    ...selectedDevice,
                    device: devices[0],
                })
            }
        }
        try {
            fetchItemDevices()
        } catch (err) {
            console.log(err)
        }
    }, [])

    useEffect(() => {
        startLoading()
        if ((selectedItem || selectedItemWatchall) && (selectedContainer || selectedContainerWatchall)) {
            getEventDetails()
        }
        const acceptOptions = _allUsers()
        setSelectOptions(acceptOptions)
        _fetchProjectViewAcceptOrg()
        removeLoading()
    }, [selectedItem, selectedItemWatchall, selectedContainer, selectedContainerWatchall, isNonPDCEvent])

    const updatedPDCUser = async (pdcObj, eventId) => {
        try {
            let acceptedUsers = []
            let options = []
            let users = []
            let participants = []
            let orgs = []
            let seeUser = []
            pdcObj?.pdc_orgs.map(({ org_id }) => {
                orgs.push(org_id)
            })
            pdcObj?.pdc_participants.map(({ participant_id }) => {
                participants.push(participant_id)
            })

            if (!!pdcObj) {
                const newUsers = await fetchPdcUsers({ orgs, participants })
                users = _.uniqBy(newUsers, 'id')
            }
            if (users.length) {
                users.map((user) => {
                    // if (user.id != currentUser) {
                    const option = {
                        label: `${user.username} ${user.organization?.name}`,
                        userName: user.username,
                        organizationName: user.organization?.name,
                        value: `${user.id}-${user.organization?.id}`,
                        isFixed: false,
                        role: user.role_id,
                    }
                    options.push(option)
                    // }
                })
            }
            // Update PDC Users with Existing allUsers (Project Participant Users)
            const uniqueOptions = _.uniqBy(options, 'value')
            setSelectOptions(uniqueOptions)
            pdcObj?.pdc_organizations.map((org) => {
                if (org.accept_user_id && org.accept_user_id > 0 && org.event_id === eventId) {
                    // Check whether the org -> accept_user_id contains the PDC Users
                    const orgData = users.find(({ id }) => id === org.accept_user_id)
                    // If org -> accept_user_id had the PDC Users & the user not in the accept users, manually push into it
                    if (orgData && !acceptedUsers.includes(`${org?.accept_user_id}-${orgData.organization?.id}`) && org?.accept_user_id != currentUser.id) {
                        acceptedUsers.push(`${org?.accept_user_id}-${orgData.organization?.id}`)
                    }
                }

                if (org.submit_user_id == currentUser.id && org.event_id === eventId) {
                    setCanUserSubmitEvent(true)
                }
                if (org.event_id === eventId) {
                    const orgData1 = users.find(({ id }) => id === org.see_user_id)
                    if (orgData1 && !seeUser.includes(`${org?.see_user_id}-${orgData1.organization?.id}`)) {
                        seeUser.push(`${org?.see_user_id}-${orgData1?.organization?.id}`)
                    }
                }
            })
            let uniqueChars = [...new Set(seeUser)]

            const array1 = uniqueChars.map((value) => {
                return { ...uniqueOptions.find((option) => option.value == value), isFixed: true }
            })
            const array = acceptedUsers.map((value) => {
                return { ...uniqueOptions.find((option) => option.value == value), isFixed: true }
            })
            if (!editDocument) {
                _handleSelect(array1, 'view_users', eventId)
                _handleSelect(array, 'accept_users', eventId)
            }
        } catch (error) {
            console.log({ error })
        }
    }

    const getProjectPDCList = async (id = projectId) => {
        try {
            startLoading()
            const pdcList = await fetchProjectPDC(id)
            if (pdcList.length && !isNonPDCEvent) {
                setProjectPDCList(pdcList)
                const selectedPDC = pdcList.find(({ is_default }) => is_default)
                if (!selectedPDC.pdc_name) {
                    setIsNonPDCEvent(true)
                } else {
                    if (selectedPDC && !editDocument) setSelectedPDC(selectedPDC.pdc_name)
                }
                removeLoading()
            }
            removeLoading()
        } catch (error) {
            console.log({ error })
            removeLoading()
        }
    }

    const onChangeView = (value, action, type) => {
        switch (action.action) {
            case 'remove-value':
            case 'pop-value':
                if (action.removedValue?.isFixed) {
                    return
                }
                break
            case 'clear':
        }
        _handleSelect(value, type)
    }

    const _handleSelect = (selected, type, eventId) => {
        if (type === 'view_users') {
            setViewUsers(selected)
            return
        }
        setAcceptUsers(selected)
        if (selected == null) {
            selected = []
        }

        let viewSelected = eventId ? [view_users[0]] : view_users || [view_users[0]]
        if (viewSelected == null) {
            viewSelected = []
        }
        const acceptedUserIds = _.map(selected, 'value')
        let viewOptions = _.uniqBy(viewSelected.concat(selected), 'value')
        // All accept users should add into viewusers without remove (Fixed Option)
        viewOptions = viewOptions.map((item) => {
            return { ...item, isFixed: acceptedUserIds.includes(item?.value) || item.userName == currentUser.username }
        })
        if (!eventId) {
            setViewUsers(viewOptions)
        }
    }

    const startLoading = () => {
        setIsLoading((prevState) => {
            prevState.push('true')
            return [...prevState]
        })
    }

    const removeLoading = () => {
        setIsLoading((prevState) => {
            prevState.pop()
            return [...prevState]
        })
    }

    const _onImageChange = async (e) => {
        try {
            const file = e.target.files[0]
            if (checkFileSize(file)) {
                return
            }
            if (file) {
                const file_types = ['image/png', 'image/jpeg', 'image/jpg']
                if (!file_types.includes(file.type)) {
                    notify(string.invalidFileFormat)
                    return false
                }
                const reader = new FileReader()
                setEventFile(file)
                let formData = new FormData()
                formData.append('file[]', file)
                setEditImage('')
                setShow(true)

                const response = await saveImages(formData)

                if (response.success) {
                    setpdfpagenames(response.images, file.type)

                    reader.addEventListener(
                        'load',
                        () => {
                            setEditImage(reader.result)
                            setInputImg(reader.result)
                            setShow(true)
                        },
                        false,
                    )
                    reader.readAsDataURL(file)
                } else {
                    setShow(false)
                    notify(string.eventAddingErr)
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    /*Set pdf number sequencing*/
    const setpdfpagenames = (pages, type) => {
        let pdf_arr = []
        let sortedArr = []
        if (type === 'image/png' || type === 'image/jpeg' || type === 'image/jpeg') {
            pages.forEach((page) => {
                sortedArr.push(page)
            })
        } else {
            pages.forEach((page) => {
                const nameArr = page.split('_')
                sortedArr[nameArr[2]] = page
            })
        }
        if (sortedArr.length > 0) {
            let i = 1
            sortedArr.forEach((val) => {
                let name = i + '-' + val
                pdf_arr.push(name)
                i++
            })
            const firstPageName = pdf_arr[0].split('-')
            setSelectedPage(firstPageName[1])
        }
    }

    const checkIfFormExists = async (value) => {
        const data = eventList.find((item) => item.uniqId == value)
        if (data && Object.keys(data).length > 0) {
            if (data.form_id && parseInt(data.form_id) >= 0) {
                const formdata = await getForm(data.form_id)
                if (formdata.formBuider) {
                    setformexists(true)
                    setformId(data.form_id)
                } else {
                    setformexists(false)
                    setformId('')
                }
            } else {
                setformexists(false)
                setformId('')
            }
        }
    }

    const checkUsersForNotPdcEvent = async (eventId, pdc) => {
        try {
            const acceptOptions = _allUsers()
            const viewUser = [view_users[0]]

            if (pdc) {
                let pdcObj = await fetchCategoryPDC(eventId, pdc)
                if ((!pdcObj || eventId == 0 || !eventId) && selectedProjectEvent?.pdc_id != projectDefaultPDCName) {
                    setViewUsers(viewUser)
                    setAcceptUsers([])

                    if (selectedProjectEvent) {
                        let acceptedUsers = []
                        selectedProjectEvent.acceptUsers?.map((user) => {
                            if (!acceptedUsers.includes(`${user?.user_id}-${user.organization_id}`)) {
                                acceptedUsers.push(`${user?.user_id}-${user.organization_id}`)
                            }
                        })
                        const array = acceptedUsers.map((value) => {
                            return { ...acceptOptions.find((option) => option.value == value), isFixed: true }
                        })
                        _handleSelect(array, 'accept_users', !eventId || eventId == '0')
                    }
                    return false
                }

                return pdcObj
            }
            return null
        } catch (error) {
            throw error
        }
    }

    const setPDCUserDetails = async (eventId, pdc) => {
        try {
            startLoading()
            const pdcObj = await checkUsersForNotPdcEvent(eventId, pdc)
            if (pdcObj) {
                await updatedPDCUser(pdcObj, eventId)
            }
            removeLoading()
        } catch (error) {
            removeLoading()
            console.log({ error })
        }
    }

    //HANDLING ANALYTICS REPORT DATA
    const { groupNames, truckNames, containersName } = useContext(EventContext)
    const [projectDetails, setProjectDetails] = useState(null)
    const [projectAnalyticsSelections, setProjectAalyticsSelection] = useState({
        item_id: selectedItemId,
        device_id: null,
        container_id: containersName?.selected?.value || null,
        group_id: groupNames?.selected?.value || null,
        truck_id: truckNames?.selected?.value || null,
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
        item: itemsNames?.selected?.value,
        device_id: selectedDevice?.device?.id || null,
    })
    const [selectedElement, setSelectedElement] = useState('')

    //method to  set the project Details
    const _fetchProjectDetails = async (project_id) => {
        const project_details = await fetchProjectDetails({ ...projectAnalyticsSelections, project_id })
        let project_data = await fetchProjectSelections({ project_id })
        setProjectDetails({ ...project_data, ...project_details })
    }

    //get all the chart data  chart options and as well as the chart options
    const _getChartData = (projectDetails, filterDatas, rgbColor, labels, label, values, type) => {
        const allFilterNull = Object.values(filterDatas)?.some((filter) => filter)

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

        const headerData = {
            data: {
                deviceName: selectedDevice?.device,
                selectedDate: selectedDevice.date,
            },
            groupNames: groupNames,
            itemsNames: itemsNames,
            truckNames: truckNames,
            containersName: containersName,
        }
        return { chartData: chartData, chartOpts: chartOpts, headerData: headerData, size: 'sm' }
    }

    // get both temperature  and the  humidity data
    const _fetchChartData = async (projectSelections, project_id, dateRange, analyticsData) => {
        try {
            //set the loader to true
            setChartData({ isLoading: true, data: null, elementId: selectedElement, setPageLoad: true })
            const { iotReport } = await fetchMapData()
            let chartLineColor
            const deviceData = analyticsData.map(async (type) => {
                const chartLabels = []
                const chartValue = []
                const payload = {
                    projectSelections,
                    project_id,
                    device_id: selectedDevice.device?.id || null,
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
                return _getChartData(projectDetails, filterData, chartLineColor, chartLabels, chartLabel, chartValue, type)
            })
            let data = await Promise.all(deviceData)
            setChartData({
                elementId: selectedElement,
                device: selectedDevice.device,
                data: data,
                isLoading: false,
                iotReport,
            })
            setOpenPage(true)
        } catch (err) {
            console.error(string.chart.Errorwhilefethinglogs + ' => ', err)
        }
    }

    //Project and item will remain the same so  we have to fetch it only once
    useEffect(() => {
        _fetchProjectDetails(currentProjectId)
    }, [])

    //get the chart data  only when if there is any selected  device
    useEffect(() => {
        if (projectDetails && selectedDevice.device) {
            _fetchChartData(projectAnalyticsSelections, currentProjectId, selectedDevice.date, ['temp', 'humidity'])
        }
    }, [projectDetails, selectedDevice])

    // HANDLING IOT REPORT DATA

    // const { groupNames, truckNames, containersName } = useContext(EventContext)
    let selectedDeviceID = selectedDevice?.device?.id || null
    const [selected, setSelected] = useState({
        selectedGroup: groupNames.selected?.value,
        selectedTruck: truckNames.selected?.value,
        selectedContainer: containersName.selected?.value,
        selectedItem: itemsNames.selected?.value,
        selectedDevice: selectedDeviceID,
        selectedProject: currentProjectId,
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
    const [openPage, setOpenPage] = useState(false)

    const _fetchItems = async (elm_type, elm_id, selectionArray = null, project_id) => {
        const selections = selectionArray || state.selections

        const items = await fetchItems({
            elm_type,
            elm_id,
            project_id,
            sealingChecked: alert.sealingChecked,
            temperatureChecked: alert.temperatureChecked,
            humidityChecked: alert.humidityChecked,
            tamperChecked: alert.tamperChecked,
            selections,
        })
        return sortBy(items, ['selection_id'])
    }
    const fetchMapData = async () => {
        const body = {
            container: selected.selectedContainer,
            container_id: selected.selectedContainer,
            item_id: selected.selectedItem,
            project_id: currentProjectId,
            project: currentProjectId,
            device_id: selected.selectedDevice,
        }
        const response = await fetchFormData(formId)
        let iotReport = {}
        if (currentProjectId) {
            //fetech groups
            const groupsResponse = await fetchGroups({
                project_id: currentProjectId,
                sealingChecked: alert.sealingChecked,
                temperatureChecked: alert.temperatureChecked,
                humidityChecked: alert.humidityChecked,
                tamperChecked: alert.tamperChecked,
            })
            const items = await _fetchItems('item', null, groupsResponse.selections, currentProjectId)
            const currentproject = await fetchProjectSelections({ project_id: currentProjectId })
            const logs = await fetchLocationLogs(body)
            const destructLogs = await _fetchLocationLogs(logs)
            const border = await fetchBorderInfo(body)
            updateState({ mapData: logs.data })
            setBorderInfo(border)
            setProject(currentproject)
            updateRouteDatas({
                ...destructLogs?.markerObj,
                ...destructLogs?.markerLine,
            })
            const headerData = {
                selectedDate: selectedDevice.date,
                deviceName: selectedDevice.device.deviceID,
            }
            const endMarker = destructLogs?.markerObj?.endMarker || []
            const startMarker = destructLogs?.markerObj?.startMarker || []
            const stations = destructLogs?.markerObj?.stations || []
            const mapMarker = destructLogs?.markerLine?.mapMarker || []
            const polylines = destructLogs?.markerLine?.polylines || []
            iotReport = { headerData, groupNames, truckNames, containersName, itemsNames, polylines, stations, startMarker, endMarker, mapMarker, border, projectDetails,startDate: items?.length>0 ? items[0]?.start_date_time :null }
            response.map((formData) => {
                formData.iotReport = iotReport
            })
        }
        return { response, iotReport }
        // loader bug fix for react-form-builder npm
    }

    const _getformdata = async () => {
        startLoading()
        const response = await fetchFormData(formId)
        const isIncludesAssets = response?.some((field) => assetElementNames.includes(field.element))
        let orgAssetsData
        if (isIncludesAssets) {
            orgAssetsData = await fetchAssets({ isInventory: true })
            orgAssetsData = orgAssetsData.map((assetData) => ({ ...assetData, quantity: assetData.assets_quantity ? assetData.assets_quantity.available_quantity : 0 }))
            removeLoading()
            if (!accept_users || accept_users.length === 0) {
                notify(string.pleaseSelectAcceptUsers)
                return false
            } else if (accept_users[0].organization_id === currentUser.organization_id && response.some((field) => field.element == 'TransferAsset')) {
                notify(string.pleaseSelectAcceptUsersNotOrg)
                return false
            }
        }
        setFormData({ data: response, assetsData: orgAssetsData })
        setShowForm(true)
        removeLoading()
        // loader bug fix for react-form-builder npm
        if ($('.form-builder-blk.loading-button button[type=submit]').children().length === 0) {
            $('.form-builder-blk.loading-button button[type=submit]').addClass('remove-after')
        } else {
            $('.form-builder-blk.loading-button button[type=submit]').removeClass('remove-after')
        }
    }

    const _goback = () => {
        setFormData([])
        setShowForm(false)
    }

    const handleChange = (deadline) => {
        if (isNaN(deadline.target.value) === false && parseInt(deadline.target.value) > parseInt(0)) {
            let number = deadline.target.value.replace(/^0+/, '')
            setdeadlinedate(number)
        } else if (parseInt(deadline.target.value) <= parseInt(0)) {
            setdeadlinedate(deadline.target.value)
            notify(`${string.emailmessages.acceptancedate} ${string.errors.required}`)
            return false
        } else {
            setdeadlinedate(deadline.target.value)
            notify(`${string.acceptancedeadlinereq}`)
            return false
        }
    }

    const setEventList = async (projectPDCList, pdc) => {
        try {
            startLoading()
            let newEvents = []
            projectPDCList.map((pdcEvent) => {
                pdcEvent.project_pdc_category_events.map(({ event_id }) => {
                    if (pdcEvent.pdc_name === pdc) {
                        newEvents.push({ projectEventId: pdcEvent.id, event_id })
                    }
                })
            })

            let relatedEvents = []
            pdcEvents.map((item) => {
                if (newEvents?.some((event) => event.event_id === item.uniqId)) {
                    relatedEvents.push({
                        ...item,
                        projectEventId: newEvents[0].projectEventId,
                    })
                    return {
                        ...item,
                        projectEventId: newEvents[0].projectEventId,
                    }
                }
            })
            setEvents(!!pdc && pdc !== '0' && pdc != projectDefaultPDCName ? relatedEvents || [] : pdcEvents)
            removeLoading()
        } catch (error) {
            console.log({ error })
            removeLoading()
        }
    }

    const onChangeEventType = async (value) => {
        setEventType(value)
        checkIfFormExists(value)
        if (value != '') {
            let eventjob = watch_all ? events : transportEvents
            let s = value
            let selected_event = eventjob?.filter((event) => event.id == s) || []

            if (selected_event.length > 0 && selected_event[0].document_deadline != null) {
                setDisabled(true)
                if (!Object.keys(selectedProjectEvent).length) setdeadlinedate(selected_event[0].document_deadline)
            } else {
                setDisabled(false)
                if (!Object.keys(selectedProjectEvent).length) setdeadlinedate(168)
            }
        }
    }
    const onEventIdChange = async (eventId, pdc = '') => {
        setEventType(eventId)
        const event = eventList.find((ev) => ev.uniqId == eventId)
        setEvent(event)
        checkIfFormExists(eventId)
        await getPDCDetails(eventId, pdc)
        _allUsers()

        if (eventId != '') {
            const targetValue = eventId
            const selected_event = events.filter((event) => event.uniqId == targetValue)
            if (selected_event.length > 0 && selected_event[0].deadline_hours != null) {
                setDisabled(true)
                if (!Object.keys(selectedProjectEvent).length) setdeadlinedate(selected_event[0].deadline_hours)
            } else {
                const event = eventList.find((ev) => ev.uniqId == eventId)
                setDisabled(false)
                if (!Object.keys(selectedProjectEvent).length) setdeadlinedate(event?.deadline_hours || 168)
            }
        }
    }

    const getPrevFile = () => {
        if (!!prevAttachment) {
            const file = prevAttachment.split('/')
            return file[file.length - 1]
        }
        if (!!prevImageUrl) {
            const file = prevImageUrl.split('/')
            return file[file.length - 1]
        }
        return null
    }

    const getPDCDetails = async (eventId, pdc) => {
        try {
            const viewUser = [view_users[0]]

            startLoading()
            if (eventId == 0 || !eventId) {
                setViewUsers(viewUser)
                setAcceptUsers([])
                await getProjectPDCList()
            }
            const shouldResetPDC = (selectedPDC == '' || selectedPDC == 0 || !selectedPDC) && eventId != 0
            let newPDCName = ''
            if (shouldResetPDC) {
                const acceptOptions = _allUsers()
                setSelectOptions(acceptOptions)
                const pdcDetails = await fetchPDCByEvent(eventId)
                if (!projectPDCList.find((item) => pdcDetails?.[0]?.pdc_name == item.pdc_name)) {
                    setCanUserSubmitEvent(true)
                    removeLoading()
                    return
                }
                newPDCName = pdcDetails?.[0]?.pdc_name
                setSelectedPDC(pdcDetails?.[0]?.pdc_name)
                setProjectPDCList(pdcDetails)
            }

            const pdcObj = await checkUsersForNotPdcEvent(eventId, shouldResetPDC ? newPDCName : selectedPDC || pdc)
            let reFetchedEvents = []
            if (newPDCName || !pdc || selectedPDC) {
                reFetchedEvents = await fetchEventByPDC(shouldResetPDC ? newPDCName : selectedPDC || pdc)
                await setEventList(reFetchedEvents, shouldResetPDC ? newPDCName : selectedPDC || pdc)
            }
            if (pdcObj) {
                await updatedPDCUser(pdcObj, eventId)
            }
            removeLoading()
        } catch (error) {
            console.log({ error })
            removeLoading()
        }
    }

    const onPdcChange = (event) => {
        setSelectedPDC(event.target.value)
        setEventType(0)
        const viewUser = [view_users[0]]
        setViewUsers(viewUser)
        setAcceptUsers([])
    }

    const onEventChange = async (event) => {
        startLoading()

        setCanUserSubmitEvent(false)
        const eventId = event.target.value
        await onEventIdChange(eventId)
        removeLoading()
    }

    const userOptions = useMemo(() => {
        if (!!selectedPDC && selectedPDC !== '0' && selectedPDC != projectDefaultPDCName && !isNonPDCEvent) {
            return selectOptions.filter((option) => option.role != process.env.ROLE_PUBLIC_USER)
        } else {
            return selectOptions
        }
    }, [selectedPDC, selectOptions, isNonPDCEvent])
    const saveAsPDF = async () => {
        try {
            const formData = new FormData()
            formData.append('file', event_file)
            let all_images = [`server/upload/${selectedPage}`]

            formData.append('user_id', currentUser.id)
            formData.append('pdf_images', all_images)
            formData.append('event_submission_id', eventSubmissionId)

            await savePdf(formData)
        } catch (err) {
            console.log(err)
        }
    }

    const changeEditImage = async (imgDetails, state) => {
        const imageUrl = imgDetails.imageBase64
        const base64URL = imageUrl.split(',')[1]
        const imageBlob = b64toBlob(base64URL, imgDetails?.fullName, imgDetails?.mimeType)
        setBlob(imageBlob)
        setEventFile(imageBlob)
        const response = await saveEditedFile({
            imageUrl,
            name: selectedPage,
        })
        if (response.success) {
            setInputImg(imageUrl)
            setSelectedPage(response.images[0])
            saveAsPDF()
        } else {
            notify(string.eventAddingErr)
        }
    }

    const handleChangeTime = (date, time) => {
        if (time) {
            const [hh, mm, ss] = time.split(':')
            const eventTime = date instanceof Date && !isNaN(date) ? date : new Date()
            eventTime.setHours(Number(hh) || 0, Number(mm) || 0, Number(ss) || 0)
            setEventTime(eventTime)
        }
    }

    const filterOption = (option, inputValue) => {
        if (!inputValue.trim()) return userOptions
        const { label } = option
        const otherKey = userOptions.filter((opt) => opt.label === label && opt.label.toLowerCase().includes(inputValue.toLowerCase()))
        return label.includes(inputValue) || otherKey.length > 0
    }
    const IndicatorsContainer = () => {
        return null
    }
    const MenuList = (props) => {
        if (props?.selectProps?.inputValue) return <components.MenuList {...props}>{props.children}</components.MenuList>
        return null
    }

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
        if (data.device) {
            setSelectedDevice(data)
            setProjectAalyticsSelection({ ...projectAnalyticsSelections, device_id: data.device.id })
        }
        if (!data.device) {
            Object.assign(selectedDevice, { date: [data.date] })
            setSelectedDevice({ ...selectedDevice, data })
        }
        openPage && data.elementId && setSelectedElement(data.elementId)
    }

    //add selected item device  in  iot on and iot off option
    const addDevicesInIotOnOff = (form_data) => {
        if (!form_data || form_data.length === 0) {
            return form_data
        }
        return form_data?.map((ele) => {
            if (ele.element === 'IotOn' || ele.element === 'IotOff') {
                ele.devices = selectedItemDevices
                ele.selectedDevice = getSelectedIotDevice
                if (ele.element === 'IotOn') isIotEventOn = true
                if (ele.element === 'IotOff') isIotEventOff = true

                if (ele.element === 'IotOn' && ele.id === iotOnDevice.elementId) {
                    ele.activeDevice = iotOnDevice.device
                }

                if (ele.element === 'IotOff' && ele.id === iotOffDevice.elementId) {
                    ele.activeDevice = iotOffDevice.device
                }
            } else {
                ele.activeDevice = null
            }
            return ele
        })
    }

    // if form data Exits  and there is a iotReport on off option
    // mutate the form data add devices inside the form data
    useMemo(() => {
        if (formData) {
            if (formData?.data?.length !== 0) {
                addDevicesInIotOnOff(formData.data)
            }
        }
    }, [formData])

    const removeFromSubEvent = (event) => {
        const subEventsArray = [...subEvents]
        const index = subEventsArray.findIndex((ev) => ev.project_event_id == event.project_event_id)
        if (index > -1) {
            subEventsArray.splice(index, 1)
        }
        setSubEvents([...subEventsArray])
    }

    const getProjectPDC = () => {
        if (project && (selectedPDC == '0' || !selectedPDC)) {
            return project.pdc_name
        }
        return selectedPDC
    }

    const getSelectedDevice = (elementData) => {
        if (elementData.device) {
            setSelectedDevice(elementData)
            setProjectAalyticsSelection({ ...projectAnalyticsSelections, device_id: elementData.device.id })
        }
        if (!elementData.device) {
            Object.assign(selectedDevice, { date: [elementData.date] })
            setSelectedDevice({ ...selectedDevice, elementData })
        }
        openPage && elementData.elementId && setSelectedElement(elementData.elementId)
    }

    const setIotDevicesInFormData = async (formData) => {
        if (!formData) {
            return formData
        }
        formData?.data?.forEach((ele) => {
            ele.enableMap = true
            ele.enableAnalytics = true
            if (ele.label === 'IoTReport') {
                ele.devices = selectedItemData
                ele.activeDevice = selectedItemData[0]
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
                    filterData: filterData,
                }
                ele.selectedDevice = getSelectedDevice
                ele.date = selectedDevice.date
            }

            if (selectedDevice.device && selectedElement === ele.id) {
                ele.activeDevice = selectedDevice.device
            }

            if (!ele.showLoader) {
                ele.showLoader = true
            }

            // //set the chart data loading
            if (chartData.elementId === ele.id && chartData.isLoading) {
                ele.chartData = null
                ele.iotReport = null
            }

            if (chartData.elementId && chartData.data) {
                //set the chart data in form Data if we have  the form element id and chart
                if (ele.id === chartData.elementId) {
                    ele.chartData = chartData.data
                    ele.isLoading = false
                    ele.iotReport = chartData?.iotReport
                }
            }

            if (!selectedElement) {
                ele.chartData = chartData.data
                ele.isLoading = false
                ele.iotReport = chartData?.iotReport
            }
        })
    }
    if (formData) {
        setIotDevicesInFormData(formData)
    }
    return (
        <Modal isOpen={isOpen} toggle={toggle} className={`customModal document modal-lg ${!showForm && 'drawer-modal'}`} id='documentModal'>
            <ModalHeader toggle={toggle} cssModule={{ 'modal-title': 'modal-title text-dark font-weight-bold' }}>
                {string.submitEvent}
            </ModalHeader>
            <ModalBody>
                {!showForm && (
                    <div className='event-form-blk'>
                        <form className='form-container addEvent'>
                            <div className='row ml-0 mr-0 content-block position-relative' style={{ zIndex: 2 }}>
                                <div className='col-md-6'>
                                    <div className='form-group'>
                                        <select disabled={editDocument} value={selectedPDC || ''} className='form-control' onChange={onPdcChange}>
                                            <option value={0}>{string.event.plzSelectPDCTxt}</option>
                                            {projectPDCList.map((item) => (
                                                <option key={item.id} value={item.pdc_name}>
                                                    {item.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className='col-md-6'>
                                    <div className='form-group'>
                                        <select disabled={editDocument} value={event_type || 0} className='form-control' onChange={onEventChange}>
                                            <option value='0'>{string.event.plzSelectEventTxt}</option>
                                            {eventList.map((item, i) => (
                                                <option key={i} value={item.uniqId}>
                                                    {otherLanguage && item.mongolianName ? item.mongolianName : item.eventName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className='col-md-6'>
                                    <div className='form-group'>
                                        <label className='col-form-label font-weight-bold'>{string.event.addPicture}</label>
                                        <div className='custom-file' style={{ zIndex: '0' }}>
                                            <input style={{ cursor: 'pointer' }} type='file' className='custom-file-input' id='customFileLangHTML' onChange={_onImageChange} accept='image/png, image/jpeg, image/jpg' />
                                            <label className='custom-file-label' htmlFor='customFileLangHTML'>
                                                {event_file?.name || getPrevFile()}
                                            </label>
                                        </div>
                                        <p>
                                            <small>{string.event.supporredImageFormats}</small>
                                        </p>
                                        {blob && (
                                            <div className='image-preview-blk'>
                                                <img src={window.URL.createObjectURL(new Blob([blob]))} alt='cropped-image' />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className='col-md-6' style={{ marginTop: '27px' }}>
                                    <div className='form-group'>
                                        <div className='form-control modal-dare-picker-wrapper'>
                                            <DatePicker
                                                selected={event_time}
                                                open={openPicker}
                                                onInputClick={() => setOpenPicker(true)}
                                                showTimeInput
                                                shouldCloseOnSelect
                                                onClickOutside={(ref) => {
                                                    if (ref.target.localName != 'li' && !ref.srcElement.className.includes('rc-time-picker')) setOpenPicker(false)
                                                }}
                                                placeholder={string.event.setEventDueDate}
                                                // minDate={new Date()}
                                                timeInputLabel='Time:'
                                                dateFormat='yyyy-MM-dd HH:mm:ss'
                                                onChange={(date) => {
                                                    setEventTime(date)
                                                    setOpenPicker(false)
                                                }}
                                                customTimeInput={<CustomTimeInput onChangeCustom={handleChangeTime} />}
                                                customInput={<DateCustomInput />}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='row ml-0 mr-0 content-block'>
                                <div className='col-md-6'>
                                    <div className='form-group pointListing'>
                                        <h5 className='pointsheading'>{string.event.whoCanSeeEvnt}</h5>
                                        <AdvanceSelect
                                            isMulti
                                            className='basic-single'
                                            classNamePrefix='select'
                                            isClearable={false}
                                            isSearchable
                                            filterOption={filterOption}
                                            name={string.fileName}
                                            options={userOptions}
                                            components={{ IndicatorsContainer, MenuList }}
                                            formatOptionLabel={(data) => <FormatLabel user={data?.userName} org={data?.organizationName} />}
                                            placeholder={string.event.typeAndSearch}
                                            value={view_users}
                                            onChange={(select, action) => onChangeView(select, action, 'view_users')}
                                            styles={viewCustomStyles}
                                        />
                                    </div>
                                </div>
                                <div className='col-md-6'>
                                    <div className='form-group pointListing'>
                                        <h5 className='pointsheading'>{string.event.whoCanAccepEvnt}</h5>
                                        <AdvanceSelect
                                            isMulti
                                            // isDisabled={!!selectedPDC && selectedPDC != 0 && selectedPDC != projectDefaultPDCName}
                                            className='basic-single'
                                            classNamePrefix='select'
                                            isSearchable
                                            filterOption={filterOption}
                                            isClearable={false}
                                            components={{ IndicatorsContainer, MenuList }}
                                            name={string.acceptDocument}
                                            options={selectOptions.filter((option) => option.role != process.env.ROLE_PUBLIC_USER)}
                                            formatOptionLabel={(data) => <FormatLabel user={data?.userName} org={data?.organizationName} />}
                                            placeholder={string.event.typeAndSearch}
                                            value={accept_users}
                                            onChange={(select, action) => onChangeView(select, action, 'accept_users')}
                                            styles={acceptCustomStyles}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className='row ml-0 mr-0 content-block'>
                                <div className='col-md-6'>
                                    <div className='form-group pointListing'>
                                        <h5 className='pointsheading'>{string.event.location}</h5>
                                        <input
                                            type='text'
                                            name='documentdeadline'
                                            id='documentdeadline'
                                            className='form-control'
                                            placeholder={string.event.location}
                                            onChange={(e) => {
                                                setEventLocation(e.target.value)
                                            }}
                                            value={event_location}
                                        />
                                    </div>
                                </div>
                                <div className='col-md-6'>
                                    <div className='form-group pointListing'>
                                        <h5 className='pointsheading'>{string.emailmessages.acceptancedate}</h5>
                                        <input type='number' name='documentdeadline' id='documentdeadline' className='form-control' placeholder={string.emailmessages.acceptancedate} onChange={handleChange} value={deadlinedate} disabled={isdisabled} />
                                    </div>
                                </div>
                            </div>
                            <div className='row ml-0 mr-0 content-block'>
                                <div className='col-md-12'>
                                    <div className='form-group text-center'>
                                        <label className='col-form-label font-weight-bold'>{string.subInfo}</label>
                                        <div className='row title-wrapper'>
                                            <input
                                                value={event_title}
                                                maxLength='50'
                                                type='text'
                                                className='form-control col-md-8 title-field'
                                                onChange={(event) => {
                                                    setEventTitle(event.target.value)
                                                }}
                                            />
                                            <input type='text' value={50 - event_title.length > 0 ? `${50 - event_title.length} ${string.charLeft}` : string.titleMaxLimit} className='form-control col-md-4 count-section' readOnly />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='row ml-0 mr-0 content-block'>
                                <div className='col-md-12'>
                                    <div className='form-group'>
                                        <textarea
                                            value={event_description}
                                            placeholder={string.event.textareaPlaceholder}
                                            className='form-control resize-none'
                                            onChange={(event) => {
                                                setEventDescription(event.target.value)
                                            }}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                            <SubEventsDocumentsComponent
                                title={'EVENTS'}
                                user_id={currentUser.id}
                                itemEvent={filteredEvent}
                                eventType='event'
                                user_role_id={currentUser.role_id}
                                organization_id={currentUser.organization_id}
                                categoryEvents={categoryEvents}
                                subEvents={subEvents}
                                updateSubEvents={setSubEvents}
                                watchall={watch_all}
                            />
                            {subEvents.length > 0 && (
                                <div className='mt-5'>
                                    <AddedSubEventsList title={'EVENTS'} subEvents={subEvents} removeFromSubEvent={removeFromSubEvent} />
                                </div>
                            )}
                        </form>
                        <RightDrawer projectSelections={projectSelections} selections={selections} setSelection={setSelection} watchAll={watch_all} />
                    </div>
                )}
                {showForm && (
                    <div className='form-builder-blk loading-button'>
                        <ReactFormGenerator
                            loaderButton
                            isLoading={isFormLoading}
                            rootURL={getRootUrl()}
                            user_id={currentUser.id}
                            translate={string}
                            data={formData?.data}
                            assetsData={formData?.assetsData}
                            itemLength={itemLength}
                            show_btns={true}
                            _goback={_goback}
                            enableMap={true}
                            enableAnalytics={true}
                            onSubmit={async (e) => {
                                try {
                                    setIsFormLoading(true)
                                    await _submitEvent({
                                        event,
                                        due_date: event_time,
                                        accept_users: JSON.stringify(_.map(accept_users, 'value').filter((user) => !!user)),
                                        event_users: JSON.stringify(_.map(view_users, 'value').filter((user) => !!user)),
                                        file: event_file,
                                        type: 'event',
                                        document_deadline: deadlinedate,
                                        image_base: inputImg,
                                        json_data: JSON.stringify(e),
                                        formId: formId,
                                        title: event_title,
                                        description: event_description,
                                        location: event_location,
                                        projectId,
                                        pdc: getProjectPDC(),
                                        canUserSubmitEvent: canUserSubmitEvent,
                                        isPDCEvent: selectedPDC != 0,
                                        subEvents,
                                        items: selections.items,
                                        event_submission_id: eventSubmissionId,
                                        event,
                                        isPublicEvent,
                                        isIotEventOn,
                                        isIotEventOff,
                                        device_id: iotOnDevice?.device?.id,
                                    })
                                    setIsFormLoading(false)
                                } catch (error) {
                                    console.log(error)
                                    setIsFormLoading(false)
                                }
                            }}
                        />
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                {!showForm && (
                    <LoaderButton
                        cssClass='btn btn-primary large-btn'
                        isLoading={is_submitting}
                        onClick={() => {
                            if (event_title.length > 50) {
                                notify(string.titleMaxLimit)
                                return false
                            }
                            if (formexists && !editDocument) {
                                _getformdata()
                            } else if (editDocument && formexists) {
                                _submitEvent({
                                    event,
                                    due_date: event_time,
                                    accept_users: JSON.stringify(_.map(accept_users, 'value').filter((user) => !!user)),
                                    event_users: JSON.stringify(_.map(view_users, 'value').filter((user) => !!user)),
                                    file: event_file,
                                    type: 'event',
                                    document_deadline: deadlinedate,
                                    image_base: inputImg,
                                    json_data: JSON.stringify(selectedPreviewEvent),
                                    formId: selectedProjectEvent.form_id,
                                    title: event_title,
                                    description: event_description,
                                    location: event_location,
                                    projectId: projectId,
                                    pdc: getProjectPDC(),
                                    canUserSubmitEvent: canUserSubmitEvent,
                                    isPDCEvent: selectedPDC != 0,
                                    subEvents,
                                    items: selections.items,
                                    isPublicEvent,
                                    event_submission_id: eventSubmissionId,
                                    device_id: iotOnDevice?.device?.id,
                                })
                            } else {
                                _submitEvent({
                                    event,
                                    due_date: event_time,
                                    accept_users: JSON.stringify(_.map(accept_users, 'value').filter((user) => !!user)),
                                    event_users: JSON.stringify(_.map(view_users, 'value').filter((user) => !!user)),
                                    file: event_file,
                                    type: 'event',
                                    document_deadline: deadlinedate,
                                    image_base: inputImg,
                                    json_data: null,
                                    formId: null,
                                    title: event_title,
                                    description: event_description,
                                    location: event_location,
                                    projectId: projectId,
                                    pdc: getProjectPDC(),
                                    canUserSubmitEvent: canUserSubmitEvent,
                                    isPDCEvent: selectedPDC != 0,
                                    subEvents,
                                    items: selections.items,
                                    isPublicEvent,
                                    event_submission_id: eventSubmissionId,
                                })
                            }
                        }}
                        text={formexists ? (editDocument ? string.submitBtnTxt : string.project.next) : string.submitBtnTxt}
                    />
                )}
            </ModalFooter>
            <EventFileUploadEditor show={show} changeEditImage={changeEditImage} event_file={event_file} setShow={setShow} editImage={editImage} />

            {!!isLoading?.some((l) => l) && <Loader style={{ position: 'absolute' }} />}
        </Modal>
    )
}

export default EventModal
