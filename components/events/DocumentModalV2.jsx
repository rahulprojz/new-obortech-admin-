import React, { useState, useRef, useEffect, useContext, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { find, size, uniqBy } from 'lodash'
import { ReactFormGenerator } from 'chaincodedev-form-builder'
import { Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'reactstrap'
import { components } from 'react-select'
import string from '../../utils/LanguageTranslation.js'
import { otherLanguage } from '../../utils/selectedLanguage.js'
import Loader from '../common/Loader'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import AdvanceSelect from '../common/form-elements/select/AdvanceSelect'
import FormatLabel from '../UI/Label'
import DeleteModal from './DeleteModal'
import CropImageModal from './CropImageModal'
import EditImageModal from './EditImageModal'
import RightDrawer from './RightDrawer.jsx'
import arrayMove from 'array-move'
import notify from '../../lib/notifier'
import { fetchEvents } from '../../lib/api/event'
import { fetchPdcUsers } from '../../lib/api/user'
import { fetchAssets } from '../../lib/api/inventory-assets'
import { fetchFormData, getForm } from '../../lib/api/formBuilder'
import { fetchProjectPDC } from '../../lib/api/pdc-category'
import { assetElementNames } from '../../lib/constants'
import { fetchProjectSubEventsMongoose } from '../../lib/api/project-event'
import { fetchProjectEventDevice } from '../../lib/api/device'
import { fetchCategoryPDC, fetchEventByPDC, fetchPDCByEvent } from '../../lib/api/pdc-category'
import { splitPdf, savePdf, saveImages, saveEditedFile, deleteFile, convertDocument, onSortImages } from '../../lib/api/guest'
import { fetchItemProject } from '../../lib/api/item'
import { getRootUrl } from '../../lib/api/getRootUrl'
import EventContext from '../../store/event/eventContext'
import WatchAllEventContext from '../../store/watchAllEvent/watchAllEventContext'
import { checkFileSize, _generateUniqId, getLocalTime } from '../../utils/globalFunc'
import '../../pages/form-builder/form-builder.css'
import 'react-datetime/css/react-datetime.css'
import SubEventsDocumentsComponent from './SubEventsDocumentsComponent'
import AddedSubEventsList from './AddedSubEventsList'
import { getGroupedData } from '../../utils/eventHelper'
import { fetchItemDevice } from '../../lib/api/item'
import { fetchProjectSelections, fetchProjectDetails } from '../../lib/api/project'
import { fetchLocationLogs } from '../../lib/api/logs'
import { _fetchLocationLogs } from '../../components/iotreport/filterIotReportData'
import { fetchBorderInfo } from '../../lib/api/border-info'
import { _momentDateFormat } from '../../utils/globalFunc'
import { fetchTemperatureLogs, fetchHumidityLogs } from '../../lib/api/logs'
import moment from 'moment-timezone'

const FilerobotImageEditor = dynamic(() => import('filerobot-image-editor'), {
    ssr: false,
})

const config = {
    translations: {
        en: {
            'toolbar.save': 'Save',
            'toolbar.apply': 'Apply',
            'toolbar.download': 'Save',
        },
    },
    tools: ['adjust', 'rotate', 'crop', 'resize', 'watermark', 'text'],
    reduceBeforeEdit: {
        mode: 'auto',
    },
    theme: {
        colors: {
            primaryBg: '#ffffff',
            primaryBgHover: '#A5A5A5',
            secondaryBg: '#E0E0E0',
            secondaryBgHover: '#E0E0E0',
            secondaryBgOpacity: 'rgba(255,255,255, 0.75)',
            text: '#000000',
            textHover: '#1a2329',
            textMute: '#aaa',
            textWarn: '#f7931e',
            accent: '#D5D8DC',
            button: {
                primary: '#000000',
                secondary: '#737373',
                border: 'transparent',
                hover: '#000000',
                active: '#000000',
            },
            border: '#DFE7ED',
            borderLight: '#e1e1e1',
            disabledBg: 'rgba(255, 0, 0, 0.1)',
        },
        fonts: [
            { label: 'Arial', value: 'Arial' },
            { label: 'Tahoma', value: 'Tahoma' },
            { label: 'Times New Roman', value: 'Times New Roman' },
            { label: 'Courier', value: 'Courier' },
            { label: 'Courier New', value: 'Courier New' },
            { label: 'Verdana', value: 'Verdana' },
        ],
    },
}

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

const DocumentModal = ({ project, projectSelections, isOpen, pdcEvents, toggle, eventParticipantFilters, watch_all, documentEvents, _submitEvent, selectedProject, is_submitting, file_types, selectedPreviewEvent, selectedProjectEvent, currentUser, filteredEvent, categoryEvents }) => {
    const [eventSubmissionId, setEventSubmissionId] = useState(_generateUniqId())
    const [event_type, setEventType] = useState('')
    const [event, setEvent] = useState({})
    const [document, setDocument] = useState({})
    const [selectOptions, setSelectOptions] = useState([])
    const [view_users, setViewUsers] = useState([])
    const [subEvents, setSubEvents] = useState([])
    const [event_title, setEventTitle] = useState('')
    const [accept_users, setAcceptUsers] = useState([])
    const [event_description, setEventDescription] = useState('')
    const [event_location, setEventLocation] = useState('')
    const [event_file, setEventFile] = useState(null)
    const [crop, toggleCrop] = useState(false)
    const [edit, toggleEdit] = useState(false)
    const [blob, setBlob] = useState(null)
    const [blobCache, setBlobCache] = useState(null)
    const [loading, setLoading] = useState(false)
    const [pdf_images, setPdfImages] = useState([])
    const [selectedPage, setSelectedPage] = useState(null)
    const [selectedPageIndex, setSelectedPageIndex] = useState(0)
    const [deletePage, setDeletePage] = useState(false)
    const [pageToDelete, setPageToDelete] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [show, setShow] = useState(false)
    const [editImage, setEditImage] = useState('')
    const [formId, setformId] = useState('')
    const [editImageIndex, setEditImageIndex] = useState('')
    const [isdisabled, setDisabled] = useState(false)
    const [deadlinedate, setdeadlinedate] = useState(168)
    const [deadlinedateerror, setdeadlinedateerror] = useState(false)
    const [firstImage, setFirstImage] = useState('')
    const [formexists, setformexists] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [showLoader, setShowLoader] = useState(false)
    const [formData, setFormData] = useState([])
    const [prevAttachment, setPrevAttachment] = useState(null)
    const [prevImageUrl, setPrevImageUrl] = useState(null)
    const [documents, setDocuments] = useState([])
    const [leftScrollPos, setLeftScrollPos] = useState(0)
    const [projectId, setProjectId] = useState(null)
    const [selectedPDC, setSelectedPDC] = useState()
    const [projectPDCList, setProjectPDCList] = useState([])
    const [canUserSubmitEvent, setCanUserSubmitEvent] = useState(true)
    const [isLoadingData, setIsLoadingData] = useState([])
    const [isNonPDCEvent, setIsNonPDCEvent] = useState(true)
    const [nonPDCEvent, setNonPDCEvent] = useState([])
    const [isFormLoading, setIsFormLoading] = useState(false)
    const [selections, setSelection] = useState({
        items: [],
        containers: [],
    })

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

    const editDocument = !!size(selectedProjectEvent) && !!size(selectedPreviewEvent)
    const projectDefaultPDCName = project?.pdc_name

    const { selectedItem, selectedContainer } = useContext(EventContext)
    const { selectedItem: selectedItemWatchall, selectedContainer: selectedContainerWatchall } = useContext(WatchAllEventContext)
    const router = useRouter()
    const isPublicEvent = view_users?.some((user) => user?.role == process.env.ROLE_PUBLIC_USER)

    const itemLength = selections.items.filter((item) => item.isSelected).length || 1

    const _allUsers = () => {
        const acceptOptions = []
        const viewUsers = view_users
        if (eventParticipantFilters.length) {
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
        return uniqBy(acceptOptions, 'value')
    }

    const viewAcceptUsersArray = () => {
        const { viewUsers, acceptUsers } = selectedProjectEvent

        return {
            view_orgs: _.map(viewUsers, (view) => `${view.user_id}-${view.organization_id}`),
            accept_orgs: _.map(acceptUsers, (accept) => `${accept.user_id}-${accept.organization_id}`),
        }
    }

    const _fetchProjectViewAcceptOrg = async (eventId = '') => {
        try {
            const selectedEventId = event_type || eventId
            if (selectedEventId) {
                const projectEventId = documents.find(({ uniqId = '', ...rest }) => {
                    return selectedEventId === uniqId
                })
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
        } catch (error) {
            console.log({ error })
        }
    }

    useEffect(() => {
        if (projectId) {
            getProjectPDCList()
        }
    }, [projectId, isNonPDCEvent])

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
                if (newEvents.some((event) => event.event_id === item.uniqId)) {
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

            setDocuments(!!pdc && pdc !== '0' && pdc != projectDefaultPDCName ? relatedEvents || [] : pdcEvents)
            removeLoading()
        } catch (error) {
            console.log({ error })
            removeLoading()
        }
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

            let pdcDetails = {}
            const shouldResetPDC = (selectedPDC == '' || selectedPDC == 0 || !selectedPDC) && eventId != 0 && !!eventId
            if (shouldResetPDC) {
                const acceptOptions = _allUsers()
                setSelectOptions(acceptOptions)
                pdcDetails = await fetchPDCByEvent(eventId)
                if (!projectPDCList.find((item) => pdcDetails?.[0]?.pdc_name == item.pdc_name)) {
                    setCanUserSubmitEvent(true)
                    removeLoading()
                    return
                }
                setSelectedPDC(pdcDetails?.[0]?.pdc_name)
                setProjectPDCList(pdcDetails)
            }
            const pdcObj = !!eventId && (await fetchCategoryPDC(eventId, !shouldResetPDC ? selectedPDC || pdc : pdcDetails?.[0]?.pdc_name))
            if (!pdcObj || eventId == 0 || !eventId) {
                setViewUsers(viewUser)
                setAcceptUsers([])
                if (!pdcDetails?.[0]?.pdc_name && !pdc && selectedProjectEvent) {
                    const acceptOptions = _allUsers()
                    let acceptedUsers = []
                    selectedProjectEvent.event_accept_document_users?.map((user) => {
                        if (user?.user_id != currentUser.id) {
                            acceptedUsers.push(`${user?.user_id}-${user.organization_id}`)
                        }
                    })

                    const array = acceptedUsers.map((value) => {
                        return { ...acceptOptions.find((option) => option.value == value), isFixed: true }
                    })
                    _handleSelect(array, 'accept_users', !eventId || eventId == '0')
                }
                removeLoading()
                return false
            }

            let reFetchedEvents = []
            if (pdcDetails?.[0]?.pdc_name || !pdc || selectedPDC) {
                reFetchedEvents = await fetchEventByPDC(shouldResetPDC ? pdcDetails?.[0]?.pdc_name : selectedPDC || pdc)
                await setEventList(reFetchedEvents, shouldResetPDC ? pdcDetails?.[0]?.pdc_name : selectedPDC || pdc)
            }
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
                    if (user.id != currentUser.id) {
                        const option = {
                            label: `${user.username} ${user?.organization.name}`,
                            userName: user.username,
                            organizationName: user?.organization.name,
                            value: `${user.id}-${user.organization.id}`,
                            isFixed: false,
                        }
                        options.push(option)
                    }
                    // options.push(option)
                    // }
                })
            }
            const uniqueOptions = _.uniqBy(options, 'value')
            setSelectOptions(uniqueOptions)
            pdcObj?.pdc_organizations.map((org) => {
                if (org.accept_user_id && org.accept_user_id > 0 && org.event_id === eventId) {
                    const orgData = users.find(({ id }) => id === org.accept_user_id)
                    if (orgData && !acceptedUsers.includes(`${org?.accept_user_id}-${orgData.organization?.id}`) && org?.accept_user_id != currentUser.id) {
                        acceptedUsers.push(`${org?.accept_user_id}-${orgData.organization?.id}`)
                    }
                }

                if (pdcDetails?.[0]?.pdc_name && pdcDetails?.[0]?.pdc_name != 0) {
                    setCanUserSubmitEvent(false)
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
            const array1 = uniqueChars
                .map((value) => {
                    const uniqueOptionsRef = uniqueOptions.find((option) => option.value == value)
                    return uniqueOptionsRef ? { ...uniqueOptionsRef, isFixed: true } : null
                })
                .filter(Boolean)
            const array = acceptedUsers.map((value) => {
                return { ...uniqueOptions.find((option) => option.value == value), isFixed: true }
            })
            _handleSelect(array1, 'view_users', eventId)
            setAcceptUsers(array)
            _handleSelect(array, 'accept_users', eventId)
            removeLoading()
        } catch (error) {
            console.log(error)
            removeLoading()
        }
    }

    //fetch all the devices of a selected item
    useEffect(() => {
        const fetchItemDevices = () => {
            let devices = fetchProjectEventDevice({
                project_id: currentProjectId,
                item_id: selectedItemId,
                container_id: selectedContainer,
            }).then((devices) => {
                setSelectedItemDevices(devices)
            })
        }
        fetchItemDevices()
    }, [])

    useEffect(() => {
        if (editDocument) {
            startLoading()
            _fetchChildSubEvent(selectedProjectEvent.event_submission_id)
            setdeadlinedate(selectedProjectEvent.document_deadline || 168)
            setSelectedPDC(selectedProjectEvent.pdc_id ? selectedProjectEvent.pdc_id?.trim() : selectedProjectEvent.pdc_id || 0) // Fallback for live
            setEventLocation(selectedProjectEvent.location || '')
            setEventDescription(selectedProjectEvent.description || '')
            onChangeEventType(selectedProjectEvent.event_id)
            setPrevAttachment(selectedProjectEvent.attachment)
            setEventTitle(selectedProjectEvent.title)
            setEvent(selectedProjectEvent.event)
            // setPrevImageUrl(selectedProjectEvent.image_url)
            setPDCUserDetails(selectedProjectEvent.event_id, selectedProjectEvent.pdc_id)
            if (selectedProjectEvent.pdc_id && selectedProjectEvent.pdc_id != 0 && selectedProjectEvent.pdc_id != projectDefaultPDCName) {
                onEventIdChange(selectedProjectEvent.event_id, selectedProjectEvent.pdc_id)
                setIsNonPDCEvent(false)
                setPDCUserDetails(selectedProjectEvent.event_id, selectedProjectEvent.pdc_id)
            } else {
                setEventType(selectedProjectEvent.event_id)
                setCanUserSubmitEvent(true)
                _fetchProjectViewAcceptOrg(selectedProjectEvent.event_id)
            }
            removeLoading()
        } else {
            setIsNonPDCEvent(false)
        }
    }, [])

    const _fetchChildSubEvent = async (event_submission_id) => {
        try {
            const subEventsList = await fetchProjectSubEventsMongoose({ event_submission_id })
            const subEvents = getGroupedData(subEventsList.projectEvents, '', categoryEvents)
            setSubEvents(subEvents)
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        if (editDocument && !document.uniqId) {
            const selectedDoc = documentList.find((e) => e.uniqId == selectedProjectEvent.event_id)
            setDocument(selectedDoc ? selectedDoc : selectedProjectEvent.event)
        }
    }, [documentList])

    // @Todo create separate function
    const setPDCUserDetails = async (eventId, pdc) => {
        try {
            startLoading()
            const viewUser = [view_users[0]]

            const pdcObj = await fetchCategoryPDC(eventId, pdc)
            if ((!pdcObj || eventId == 0 || !eventId) && selectedProjectEvent?.pdc_id != projectDefaultPDCName) {
                setViewUsers([])
                setAcceptUsers([])
                if (pdc && selectedProjectEvent) {
                    const acceptOptions = _allUsers()
                    let acceptedUsers = []
                    selectedProjectEvent.event_accept_document_users?.map((user) => {
                        if (!acceptedUsers.includes(`${user?.user_id}-${user.organization_id}`) && user?.user_id != currentUser.id) {
                            acceptedUsers.push(`${user?.user_id}-${user.organization_id}`)
                        }
                    })

                    const array = acceptedUsers.map((value) => {
                        return { ...acceptOptions.find((option) => option.value == value), isFixed: true }
                    })
                    _handleSelect(array, 'accept_users', !eventId || eventId == '0')
                }
                removeLoading()
                return false
            }

            let acceptedUsers = []
            let options = []
            let users = []
            let participants = []
            let orgs = []

            pdcObj?.pdc_orgs.map(({ org_id }) => {
                orgs.push(org_id)
            })
            pdcObj?.pdc_participants.map(({ participant_id }) => {
                participants.push(participant_id)
            })

            if (!!pdcObj) {
                const newUsers = await fetchPdcUsers({ orgs: [...orgs, ...participants] })
                let eventUsers = []
                let filteredParticipants = []
                if (eventParticipantFilters.length) {
                    if (router.query?.project_id && watch_all) {
                        filteredParticipants = eventParticipantFilters.filter(({ project_id }) => {
                            return project_id == router.query?.project_id
                        })
                    }
                    filteredParticipants.map((participant) => {
                        const orgData = { ...participant }
                        delete orgData.users
                        participant.organization?.users?.map((user) => {
                            if (user?.role_id != 4) {
                                eventUsers.push({ ...user, organization: { ...user.organization, ...orgData.organization } })
                            }
                        })
                    })
                }
                users = _.uniqBy([...newUsers, ...eventUsers], 'id')
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
                // Update PDC Users with Existing allUsers (Project Participant Users)
                const uniqueOptions = _.uniqBy([...options, ...selectOptions], 'value')
                setSelectOptions(uniqueOptions)
            }
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
            })
            const array = acceptedUsers.map((value) => {
                return { ...uniqueOptions.find((option) => option.value == value), isFixed: true }
            })
            removeLoading()
        } catch (error) {
            console.log({ error })
            removeLoading()
        }
    }

    const onSortEnd = async ({ oldIndex, newIndex }) => {
        const newimage = arrayMove(pdf_images, oldIndex, newIndex)
        setPdfImages(newimage)
        if (newIndex == 0 || oldIndex == 0) {
            let orderOfArray = newimage.map((img, index) => {
                const ar2 = img.split('-')
                return {
                    index: index,
                    name: ar2[1],
                }
            })
            const response = await onSortImages({ orderOfArray })
            setFirstImage(response.base64)
        }
    }

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
            // if (itemProject) {
            setProjectId(project.id)
            if (project.id && !isNonPDCEvent) {
                await getProjectPDCList(project.id)
            }
            if (selectedPDC == '0') {
                setCanUserSubmitEvent(true)
            }
            // }
            removeLoading()
        } catch (error) {
            removeLoading()
        }
    }
    useEffect(() => {
        startLoading()
        getEventDetails()
        const acceptOptions = _allUsers()
        setSelectOptions(acceptOptions)
        _fetchProjectViewAcceptOrg()
        removeLoading()
    }, [selectedItem, selectedItemWatchall])

    const toggleCropModal = () => toggleCrop(!crop)
    const toggleEditModal = () => toggleEdit(!edit)

    const leftBar = useRef(null)

    const saveCrop = () => {
        setBlob(blobCache)
        setEventFile(blobCache)
        toggleCropModal()
    }

    const onEventIdChange = async (eventId, pdc = '') => {
        setEventType(eventId)
        const docEvent = categoryEvents?.find((ev) => ev.uniqId == eventId)
        setEvent(docEvent)
        checkIfFormExists(eventId)

        const document = documentList.find((ev) => ev.uniqId == eventId)
        setDocument(document)

        await getPDCDetails(eventId, pdc)

        _allUsers()
        if (eventId != '') {
            const targetValue = eventId
            const selected_event = documents.filter((event) => event.uniqId == targetValue)
            if (selected_event.length > 0 && selected_event[0]?.deadlineDays != null) {
                setDisabled(true)
                if (!Object.keys(selectedProjectEvent).length) setdeadlinedate(selected_event[0]?.deadline_hours)
            } else {
                const document = documentList.find((ev) => ev.uniqId == eventId)
                setDisabled(false)
                if (!Object.keys(selectedProjectEvent).length) setdeadlinedate(document?.deadline_hours || 168)
            }
        }
    }

    const cancelCrop = () => {
        setBlob(event_file)
        setEventFile(event_file)
        toggleCropModal()
    }

    const onChangeView = (value, action, type) => {
        switch (action.action) {
            case 'remove-value':
            case 'pop-value':
                if (action.removedValue?.isFixed && type === 'view_users') {
                    return
                }
                break
            case 'clear':
        }
        _handleSelect(value, type, false)
    }

    const _handleSelect = (selected, type, eventId = true) => {
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
        viewOptions = viewOptions.map((item) => {
            return { ...item, isFixed: acceptedUserIds.includes(item.value) || item.userName === currentUser.username }
        })
        setViewUsers(viewOptions)
    }

    const saveFileUpload = async () => {
        let formData = new FormData()
        formData.append('file', event_file)
        let all_images = []
        pdf_images.map((image) => {
            image = image.split('-')
            const ar2 = image.slice(1, image.length)
            const val = ar2.join('-')
            all_images.push('server/upload/' + val)
        })

        formData.append('user_id', currentUser.id)
        formData.append('pdf_images', all_images)
        formData.append('event_submission_id', eventSubmissionId)
        const response = await savePdf(formData)
        if (response.success) {
            toggleEditModal()
        } else {
            notify(string.eventAddingErr)
        }
    }

    const saveEdit = async () => {
        setIsLoading(true)
        await saveFileUpload()
        setIsLoading(false)
    }

    const cancelEdit = async () => {
        if (!Object.keys(selectedProjectEvent).length) {
            await saveFileUpload()
        } else {
            setFirstImage(null)
            setEventFile(null)
            toggleEditModal()
        }
    }

    const getBlob = (blob) => {
        setBlobCache(blob)
    }

    //On select image
    const _onImageChange = async (e) => {
        try {
            const files = e.target.files
            const file = e.target.files[0]
            if (checkFileSize(file)) {
                return
            }

            if (file) {
                if (!file_types.includes(file.type)) {
                    notify(string.invalidFileFormat)
                    return false
                }

                //Validate file size
                if (file.size > 3 * 1024 * 1024) {
                    notify(string.invalidFileSize)
                    return false
                }
                let fileArr = Array.from(files)
                if (file.type == 'application/pdf' && fileArr.length > 1) {
                    notify(string.onlySinglePdf)
                    return false
                }

                let response
                setLoading(true)
                setEventFile(file)

                //Upload DOCX
                if (file.type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    setShowLoader(true)
                    let formData = new FormData()
                    formData.append('file', file)
                    formData.append('user_id', currentUser.id)
                    response = await convertDocument(formData, 'docx')
                    setFirstImage(response.base64)
                    setShowLoader(false)
                }

                //Upload PPTX
                if (file.type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
                    setShowLoader(true)
                    let formData = new FormData()
                    formData.append('file', file)
                    formData.append('user_id', currentUser.id)
                    response = await convertDocument(formData, 'pptx')
                    setFirstImage(response.base64)
                    setShowLoader(false)
                }

                //Upload XLSX
                if (file.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                    setShowLoader(true)
                    let formData = new FormData()
                    formData.append('file', file)
                    formData.append('user_id', currentUser.id)
                    response = await convertDocument(formData, 'xlxs')
                    setFirstImage(response.base64)
                    setShowLoader(false)
                }

                //Upload PDF
                if (file.type == 'application/pdf') {
                    setLoading(true)
                    toggleEditModal()
                    setEventFile(file)
                    let formData = new FormData()
                    formData.append('file', file)
                    formData.append('user_id', currentUser.id)
                    response = await splitPdf(formData)
                    setFirstImage(response.base64)
                }

                //Upload Image
                if (file.type == 'image/png' || file.type == 'image/jpeg' || file.type == 'image/jpeg') {
                    const fileName = file?.name?.split('.')
                    const obj = new File([file], `${fileName[0]}.pdf`, {
                        type: 'application/pdf',
                    })
                    setEventFile(obj)
                    setLoading(true)
                    toggleEditModal()
                    const reader = new FileReader()
                    reader.readAsDataURL(file)
                    reader.onload = () => {
                        setFirstImage(reader.result)
                    }
                    let formData = new FormData()
                    for (let i = 0; i < fileArr.length; i++) {
                        formData.append('file[]', fileArr[i])
                    }
                    response = await saveImages(formData)
                }

                if (response.success) {
                    setpdfpagenames(response.images, file.type)
                } else {
                    notify(string.eventAddingErr)
                }
                setLoading(false)
            }
        } catch (err) {
            notify(err.message || err.toString())
        }
    }

    /*Set pdf number sequencing*/
    const setpdfpagenames = (pages, type, isChangeEdit) => {
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
            if (pdf_images.length) {
                const old_pdf_arr = pdf_images.filter((image) => {
                    const imageName = image.split('-')[1]
                    const isAvailable = pdf_arr.some((i) => {
                        const name = i.split('-')[1]
                        return name == imageName
                    })
                    return isAvailable
                })
                if (old_pdf_arr.length) {
                    pdf_arr = old_pdf_arr
                }
            }
            setPdfImages(pdf_arr)
            const firstPageName = pdf_arr[0]?.split('-')
            setSelectedPage(firstPageName[1])
        }
    }

    const _deletePage = async () => {
        setLoading(true)
        const deleteImage = pdf_images[pageToDelete]
        const splitImage = deleteImage.split('-')
        let orderOfArray = pdf_images.map((image, index) => {
            const splitimage = image.split('-')
            return {
                index: index,
                name: splitimage[1],
            }
        })
        const response = await deleteFile({
            file: splitImage[1],
            orderOfArray,
        })
        if (response.success) {
            setpdfpagenames(response.images, 'image/jpeg')
            setSelectedPage(response.images[0])
            if (pageToDelete == 0) {
                setFirstImage(response.base64)
            }
        } else {
            notify(string.eventAddingErr)
        }
        setLoading(false)
        _togglePageDelete(null)
    }

    const _togglePageDelete = (page) => {
        setPageToDelete(page)
        setDeletePage(!deletePage)
    }

    useEffect(() => {
        if (leftBar.current) {
            leftBar.current.scrollTop = leftScrollPos
        }
    }, [selectedPage, selectedPageIndex, editImage])

    const changeEditImage = async (url, file) => {
        setLoading(true)
        const imageUrl = url.canvas.toDataURL('image/jpg')
        let orderOfArray = pdf_images.map((image, index) => {
            const splitimage = image.split('-')
            return {
                index: index,
                name: splitimage[1],
            }
        })
        const response = await saveEditedFile({
            imageUrl,
            name: selectedPage,
            orderOfArray,
        })
        if (response.success) {
            setpdfpagenames(response.images, 'image/jpeg', 'edit')
            setSelectedPage(response.images[0])
            if (editImageIndex == 0) {
                setFirstImage(imageUrl)
            }
        } else {
            notify(string.eventAddingErr)
        }
        setLoading(false)
    }

    const handleChange = (deadline) => {
        if (isNaN(deadline.target.value) === false && parseInt(deadline.target.value) > parseInt(0)) {
            let number = deadline.target.value.replace(/^0+/, '')
            setdeadlinedate(number)
            setdeadlinedateerror(false)
        } else if (parseInt(deadline.target.value) <= parseInt(0)) {
            setdeadlinedate(deadline.target.value)
            setdeadlinedateerror(true)
            notify(`${string.emailmessages.acceptancedate} ${string.errors.required}`)
            return false
        } else {
            setdeadlinedate(deadline.target.value)
            setdeadlinedateerror(true)
            notify(`${string.acceptancedeadlinereq}`)
            return false
        }
    }
    const checkIfFormExists = async (value) => {
        setformexists(false)
        const data = documentList.find((item) => item.uniqId == value)
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

    const _getformdata = async (viewUsers, acceptUserCondition) => {
        if (!viewUsers?.length) {
            notify(string.pleaseSelectViewUsers)
            return false
        }
        if (acceptUserCondition || !accept_users || accept_users.length === 0) {
            notify(string.pleaseSelectAcceptUsers)
            return false
        }
        startLoading()
        const response = await fetchFormData(formId)
        const isIncludesAssets = response.some((field) => assetElementNames.includes(field.element))
        let orgAssetsData
        if (isIncludesAssets) {
            orgAssetsData = await fetchAssets({ isInventory: true })
            orgAssetsData = orgAssetsData.map((assetData) => ({ ...assetData, quantity: assetData.assets_quantity ? assetData.assets_quantity.available_quantity : 0 }))
            removeLoading()
            if (accept_users[0].organization_id === currentUser.organization_id && response.some((field) => field.element == 'TransferAsset')) {
                notify(string.pleaseSelectAcceptUsersNotOrg)
                return false
            }
        }
        setFormData({ data: response, assetsData: orgAssetsData })
        setShowForm(true)
        // loader bug fix for react-form-builder npm
        if ($('.form-builder-blk.loading-button button[type=submit]').children().length === 0) {
            $('.form-builder-blk.loading-button button[type=submit]').addClass('remove-after')
        } else {
            $('.form-builder-blk.loading-button button[type=submit]').removeClass('remove-after')
        }
        removeLoading()
    }

    const _goback = () => {
        setFormData([])
        setShowForm(false)
    }

    useEffect(() => {
        _fetchProjectViewAcceptOrg(event_type)
    }, [selectedPDC])

    const onChangeEventType = async (value) => {
        setEventType(value)
        checkIfFormExists(value)
        if (value != '') {
            let selected_doc = find(categoryEvents, (doc) => doc.id == value)
            if (selected_doc && selected_doc.document_deadline != undefined && selected_doc.document_deadline != ' ' && selected_doc.document_deadline != null) {
                setDisabled(true)
                if (!Object.keys(selectedProjectEvent).length) setdeadlinedate(selected_doc.document_deadline)
            } else {
                setDisabled(false)
                if (!Object.keys(selectedProjectEvent).length) setdeadlinedate(168)
            }
        }
    }

    const startLoading = () => {
        setIsLoadingData((prevState) => {
            prevState.push('true')
            return [...prevState]
        })
    }

    const removeLoading = () => {
        setIsLoadingData((prevState) => {
            prevState.pop()
            return [...prevState]
        })
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

    const onPdcChange = (event) => {
        setSelectedPDC(event.target.value)
        setEventType(0)
        const viewUser = [view_users[0]]

        setViewUsers([])
        setAcceptUsers([])
    }

    const onEventChange = async (event) => {
        startLoading()
        setCanUserSubmitEvent(false)
        const eventId = event.target.value
        await onEventIdChange(eventId)
        removeLoading()
    }

    const onEditPDFClick = (event) => {
        event.stopPropagation()
        setShow(true)
        setEditImage(`/server/upload/${selectedPage}`)
        setEditImageIndex(selectedPageIndex)
    }

    const getProjectPDC = () => {
        if (project && (selectedPDC == '0' || !selectedPDC)) {
            return project.pdc_name
        }
        return selectedPDC
    }

    const onSubmitClick = () => {
        const acceptUserCondition = view_users?.every((viewUser) => viewUser.role == process.env.ROLE_PUBLIC_USER) ? false : !accept_users?.length
        if (event_title.length > 50) {
            notify(string.titleMaxLimit)
            return false
        }
        if (formexists && !editDocument) {
            _getformdata(view_users, acceptUserCondition)
        } else if (formexists && editDocument) {
            if (!view_users?.length) {
                notify(string.pleaseSelectViewUsers)
                return false
            }
            if (acceptUserCondition) {
                notify(string.pleaseSelectAcceptUsers)
                return false
            }
            _submitEvent({
                event,
                due_date: null,
                accept_users: JSON.stringify(_.map(accept_users, 'value').filter((user) => !!user)),
                event_users: JSON.stringify(_.map(view_users, 'value').filter((user) => !!user)),
                file: event_file,
                type: 'document',
                document_deadline: deadlinedate,
                image_base: firstImage,
                json_data: JSON.stringify(selectedPreviewEvent),
                formId: selectedProjectEvent.form_id,
                attachment: selectedProjectEvent.attachment,
                title: event_title,
                description: event_description,
                location: event_location,
                projectId,
                pdc: getProjectPDC(),
                canUserSubmitEvent: canUserSubmitEvent,
                isPDCEvent: selectedPDC != 0,
                subEvents: subEvents,
                items: selections.items,
                event_submission_id: eventSubmissionId,
                document,
                isPublicEvent,
            })
        } else {
            if (deadlinedateerror === false) {
                if (!event_type) {
                    notify(string.pleaseSelectDocumentType)
                    return false
                }
                if (!event_file) {
                    notify(string.pleaseSelectDocument)
                    return false
                }
                if (!view_users?.length) {
                    notify(string.pleaseSelectViewUsers)
                    return false
                }
                if (acceptUserCondition) {
                    notify(string.pleaseSelectAcceptUsers)
                    return false
                }
                _submitEvent({
                    event,
                    due_date: null,
                    accept_users: JSON.stringify(_.map(accept_users, 'value').filter((user) => !!user)),
                    event_users: JSON.stringify(_.map(view_users, 'value').filter((user) => !!user)),
                    file: event_file,
                    type: 'document',
                    document_deadline: deadlinedate,
                    image_base: firstImage,
                    json_data: null,
                    formId: null,
                    title: event_title,
                    description: event_description,
                    location: event_location,
                    projectId,
                    pdc: getProjectPDC(),
                    canUserSubmitEvent: canUserSubmitEvent,
                    isPDCEvent: selectedPDC != 0,
                    subEvents: subEvents,
                    items: selections.items,
                    event_submission_id: eventSubmissionId,
                    document,
                    isPublicEvent,
                })
            } else {
                notify(string.acceptancedeadlinereq)
                return false
            }
        }
    }

    useEffect(() => {
        if (selectedProjectEvent.event_id) checkIfFormExists(selectedProjectEvent.event_id)
    }, [pdcEvents])

    const onFormSubmitClick = async (eventJson) => {
        try {
            setIsFormLoading(true)
            await _submitEvent({
                event,
                due_date: null,
                accept_users: JSON.stringify(_.map(accept_users, 'value').filter((user) => !!user)),
                event_users: JSON.stringify(_.map(view_users, 'value').filter((user) => !!user)),
                file: event_file,
                type: 'document',
                document_deadline: deadlinedate,
                image_base: firstImage,
                json_data: JSON.stringify(eventJson),
                formId: formId,
                title: event_title,
                description: event_description,
                location: event_location,
                projectId,
                pdc: getProjectPDC(),
                canUserSubmitEvent: canUserSubmitEvent,
                isPDCEvent: selectedPDC != 0,
                subEvents: subEvents,
                items: selections.items,
                event_submission_id: eventSubmissionId,
                document,
                isPublicEvent,
            })
            setIsFormLoading(false)
        } catch (error) {
            setIsFormLoading(false)
        }
    }

    const documentList = useMemo(() => {
        let newEvents = []
        let nonPDCEvents = []
        let allEvents = []

        projectPDCList.map((pdcEvent) => {
            pdcEvent.project_pdc_category_events.map(({ event_id }) => {
                if (pdcEvent.pdc_name === selectedPDC) {
                    newEvents.push({ projectEventId: pdcEvent.id, event_id })
                }

                if (!allEvents.includes(event_id)) {
                    allEvents.push(event_id)
                }
            })
        })

        let relatedEvents = []
        pdcEvents.map((item) => {
            if (newEvents.some((event) => event.event_id === item.uniqId)) {
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
        if (selectedProjectEvent.event_id) checkIfFormExists(selectedProjectEvent.event_id)
    }, [pdcEvents])

    const userOptions = useMemo(() => {
        if (!!selectedPDC && selectedPDC !== '0' && selectedPDC != projectDefaultPDCName && !isNonPDCEvent) {
            return selectOptions.filter((option) => option.role != process.env.ROLE_PUBLIC_USER)
        } else {
            return selectOptions
        }
    }, [selectedPDC, selectOptions, isNonPDCEvent])

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

    const removeFromSubEvent = (event) => {
        const subEventsArray = [...subEvents]
        const index = subEventsArray.findIndex((ev) => ev.project_event_id == event.project_event_id)
        if (index > -1) {
            subEventsArray.splice(index, 1)
        }
        setSubEvents([...subEventsArray])
    }

    //HANDLING ANALYTICS REPORT DATA
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
    const { itemsNames } = useContext(EventContext)
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

    //fetch all the devices of a selected item
    useEffect(() => {
        const fetchItemDevices = async () => {
            let itemId
            String(selectedItemId).includes('_') ? (itemId = selectedItemId.split('_')[0]) : (itemId = selectedItemId)
            const response = await fetchItemDevice({
                project_id: currentProjectId,
                item_id: itemId,
            })
            const devices = response?.deviceDetails?.map((ele) => ele.device)
            if (devices) {
                setSelectedItemData(devices)
                setSelectedDevice({
                    ...selectedDevice,
                    device: devices[0],
                })
            }
        }
        fetchItemDevices()
    }, [])

    //get all the chart data  chart options and as well as the chart options
    const _getChartData = (projectDetails, filterDatas, rgbColor, labels, label, values, type) => {
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
            iotReport = { headerData, groupNames, truckNames, containersName, itemsNames, polylines, stations, startMarker, endMarker, mapMarker, border, projectDetails }
            response.map((formData) => {
                formData.iotReport = iotReport
            })
        }
        return { response, iotReport }
        // loader bug fix for react-form-builder npm
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

    return (
        <>
            <Modal isOpen={isOpen} toggle={toggle} className={`customModal document modal-lg ${!showForm && 'drawer-modal'}`} id='documentModal'>
                <ModalHeader toggle={toggle} cssModule={{ 'modal-title': 'modal-title text-dark font-weight-bold' }}>
                    {string.event.submitDocument}
                </ModalHeader>
                <ModalBody>
                    {showLoader && (
                        <div className='loader-blk'>
                            <Spinner size={'sm'} />
                        </div>
                    )}
                    {!showForm && (
                        <div className='event-form-blk'>
                            <form className='form-container'>
                                <div className='row ml-0 mr-0 content-block'>
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
                                                <option value=''>{string.event.plzSelectDocTxt}</option>
                                                {documentList.map((item, i) => (
                                                    <option key={i} value={item.uniqId}>
                                                        {otherLanguage && item.mongolianName ? item.mongolianName : item.eventName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className='col-md-6'>
                                        <div className='form-group'>
                                            <div className='custom-file'>
                                                <input style={{ cursor: 'pointer' }} type='file' className='custom-file-input' id='customFileLangHTML' multiple onChange={_onImageChange} accept='.png, .jpg, .jpeg, .docx, .pptx, .xlsx, .pdf' />
                                                <label style={{ cursor: 'pointer' }} className='custom-file-label' htmlFor='choosefile'>
                                                    {event_file?.name || getPrevFile()}
                                                </label>
                                            </div>
                                            <p>
                                                <small>{string.event.supportedDocumentFormats}</small>
                                            </p>
                                        </div>
                                        <div className='col-md-12'>{crop && <CropImageModal isOpen={crop} toggle={toggleCropModal} onToggle={toggleCropModal} getBlob={getBlob} image={inputImg} fileName={event_file?.name} onCancelClick={cancelCrop} onSaveClick={saveCrop} />}</div>
                                        <div className='col-md-12'>
                                            {edit && (
                                                <EditImageModal
                                                    isOpen={edit}
                                                    loading={loading}
                                                    leftBarRef={leftBar}
                                                    pdfImages={pdf_images}
                                                    isLoading={isLoading}
                                                    selectedPage={selectedPage}
                                                    onSortEnd={onSortEnd}
                                                    onSaveClick={saveEdit}
                                                    // toggleEditModal={toggleEditModal}
                                                    toggleEditModal={cancelEdit}
                                                    onCancelClick={cancelEdit}
                                                    onEditPDFClick={onEditPDFClick}
                                                    setLeftScrollPos={setLeftScrollPos}
                                                    setSelectedPage={setSelectedPage}
                                                    setSelectedPageIndex={setSelectedPageIndex}
                                                    _togglePageDelete={_togglePageDelete}
                                                    selectedPageIndex={selectedPageIndex}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <DeleteModal toggle={() => _togglePageDelete(null)} isOpen={deletePage} onDeleteEntry={_deletePage} />
                                </div>

                                <div className='row ml-0 mr-0 content-block addEvent'>
                                    <div className='col-md-6'>
                                        <div className='form-group pointListing'>
                                            <h5 className='pointsheading'>{string.event.whoCanViewDoc}</h5>
                                            <AdvanceSelect
                                                isMulti
                                                className='basic-single'
                                                classNamePrefix='select'
                                                isClearable={false}
                                                isSearchable
                                                filterOption={filterOption}
                                                components={{ IndicatorsContainer, MenuList }}
                                                name={string.fileName}
                                                options={userOptions}
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
                                            <h5 className='pointsheading'>{string.event.whoCanAcceptDoc}</h5>
                                            <AdvanceSelect
                                                isMulti
                                                // isDisabled={!!selectedPDC && selectedPDC != 0 && selectedPDC != projectDefaultPDCName}
                                                className='basic-single'
                                                classNamePrefix='select'
                                                isSearchable
                                                filterOption={filterOption}
                                                components={{ IndicatorsContainer, MenuList }}
                                                isClearable={false}
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
                                <div style={{ display: 'flex', direction: 'Row' }}>
                                    <div className='col-md-6'>
                                        <div className='form-group pointListing'>
                                            <h5 className='pointsheading'>{string.event.location}</h5>
                                            <input type='text' name='documentdeadline' id='documentdeadline' className='form-control' placeholder={string.event.location} onChange={(e) => setEventLocation(e.target.value)} value={event_location} />
                                        </div>
                                    </div>
                                    <div className='col-md-12'>
                                        <div className='row ml-0 mr-0 content-block'>
                                            <div className='col-md-6'>
                                                <div className='form-group pointListing'>
                                                    <h5 className='pointsheading'>{string.emailmessages.acceptancedate}</h5>
                                                    <input type='number' name='documentdeadline' id='documentdeadline' className='form-control' placeholder={string.emailmessages.acceptancedate} onChange={handleChange} value={deadlinedate} disabled={isdisabled} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* row */}
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
                                            <textarea placeholder={string.event.textareaPlaceholder} className='form-control resize-none' value={event_description} onChange={(event) => setEventDescription(event.target.value)}></textarea>
                                        </div>
                                    </div>
                                </div>
                                <SubEventsDocumentsComponent
                                    title={'DOCUMENTS'}
                                    user_id={currentUser.id}
                                    itemEvent={filteredEvent}
                                    eventType='document'
                                    user_role_id={currentUser.role_id}
                                    organization_id={currentUser.organization_id}
                                    categoryEvents={categoryEvents}
                                    subEvents={subEvents}
                                    watchall={watch_all}
                                    updateSubEvents={setSubEvents}
                                />
                                {subEvents.length > 0 && (
                                    <div className='mt-5'>
                                        <AddedSubEventsList title={'DOCUMENTS'} subEvents={subEvents} removeFromSubEvent={removeFromSubEvent} />
                                    </div>
                                )}
                            </form>
                            <RightDrawer projectSelections={projectSelections} selections={selections} setSelection={setSelection} watchAll={watch_all} />
                        </div>
                    )}
                    {showForm && (
                        <div className='form-builder-blk loading-button'>
                            <ReactFormGenerator rootURL={getRootUrl()} user_id={currentUser.id} translate={string} loaderButton isLoading={isFormLoading} show_btns={true} data={formData?.data} assetsData={formData?.assetsData} itemLength={itemLength} _goback={_goback} onSubmit={onFormSubmitClick} />
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>{!showForm ? <LoaderButton cssClass='btn btn-primary large-btn' isLoading={is_submitting} onClick={onSubmitClick} text={formexists ? (editDocument ? string.submitBtnTxt : string.project.next) : string.submitBtnTxt} /> : ''}</ModalFooter>
                <FilerobotImageEditor
                    config={config}
                    show={show}
                    src={editImage}
                    // src={firstImage}
                    onClose={() => setShow(false)}
                    onComplete={(url, file) => changeEditImage(url, file)}
                    onBeforeComplete={(e) => false}
                />
                {!!isLoadingData?.some((l) => l) && <Loader style={{ position: 'absolute' }} />}
            </Modal>

            <style jsx>{`
                .pdf-page-view img {
                    object-fit: contain;
                    height: 70vh !important;
                }
            `}</style>
        </>
    )
}

export default DocumentModal
