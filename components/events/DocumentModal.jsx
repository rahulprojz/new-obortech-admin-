import React, { useState, useRef, useEffect, useContext } from 'react'
import { Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'reactstrap'
import { find, uniqueId, get, size, map, uniq, uniqBy, findIndex } from 'lodash'
import dynamic from 'next/dynamic'
import ImageCrop from '../imageCrop'
import DeleteModal from './DeleteModal'
import notify from '../../lib/notifier'
import { otherLanguage } from '../../utils/selectedLanguage.js'
import string from '../../utils/LanguageTranslation.js'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import AdvanceSelect from '../common/form-elements/select/AdvanceSelect'
import { splitPdf, savePdf, saveImages, saveEditedFile, deleteFile, convertDocument } from '../../lib/api/project-event'
import { sortableContainer, sortableElement } from 'react-sortable-hoc'
import { fetchFormData } from '../../lib/api/formBuilder'
import { ReactFormGenerator } from 'chaincodedev-form-builder'
import { fetchItemProject } from '../../lib/api/item'
import { fetchProjectViewAcceptOrg } from '../../lib/api/project-event'
import WatchAllEventContext from '../../store/watchAllEvent/watchAllEventContext'
import EventContext from '../../store/event/eventContext'
import 'react-datetime/css/react-datetime.css'
import { fetchCategoryPDC, fetchEventByPDC, fetchPDCByEvent, fetchPdcCategory } from '../../lib/api/pdc-category'
import { fetchPdcUsers } from '../../lib/api/user'
import { fetchProjectPDC } from '../../lib/api/pdc-category'
import { fetchEvents } from '../../lib/api/event'
import arrayMove from 'array-move'
import { getRootUrl } from '../../lib/api/getRootUrl'

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

const viewCustomStyles = {
    multiValueRemove: (base, state) => {
        return state.data.isFixed ? { ...base, display: 'none' } : base
    },
}

const DocumentModal = ({ isOpen, pdcEvents, toggle, eventParticipantFilters, documentEvents, _submitEvent, is_submitting, file_types, documentFilters, selectedPreviewEvent, selectedProjectEvent, currentUser }) => {
    const [event_type, setEventType] = useState('')
    const [selectOptions, setSelectOptions] = useState([])
    const [view_users, setViewUsers] = useState([])
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
    const [scrollerHeight, setScrollerHeight] = useState(0)
    const [deletePage, setDeletePage] = useState(false)
    const [pageToDelete, setPageToDelete] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [show, setShow] = useState(false)
    const [editImage, setEditImage] = useState('')
    const [formId, setformId] = useState('')
    const [editImageIndex, setEditImageIndex] = useState('')
    const [isdisabled, setDisabled] = useState(false)
    const [deadlinedate, setdeadlinedate] = useState(1)
    const [deadlinedateerror, setdeadlinedateerror] = useState(false)
    const [firstImage, setFirstImage] = useState('')
    const [formexists, setformexists] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [showLoader, setShowLoader] = useState(false)
    const [formData, setFormData] = useState([])
    const [prevAttachment, setPrevAttachment] = useState(null)
    const [prevImageUrl, setPrevImageUrl] = useState(null)
    const [documents, setDocuments] = useState([])
    const [allEvents, setAllEvents] = useState([])
    const [leftScrollPos, setLeftScrollPos] = useState(0)
    const [projectId, setProjectId] = useState(null)
    const [pdc, setPDC] = useState()
    const [selectedPDC, setSelectedPDC] = useState()
    const [projectPDCList, setProjectPDCList] = useState([])
    const [pdcEventList, setPDCEventList] = useState([])
    const [canUserSubmitEvent, setCanUserSubmitEvent] = useState(false)
    const [resubmitId, setResubmitId] = useState(0)

    let scrollPos = 0
    const editDocument = !!size(selectedProjectEvent) && !!size(selectedPreviewEvent)

    const { selectedItem } = useContext(EventContext)
    const { selectedItem: selectedItemWatchall } = useContext(WatchAllEventContext)
    const _allUsers = () => {
        const acceptOptions = []

        if (eventParticipantFilters.length) {
            eventParticipantFilters.map((participant) => {
                participant.organization?.users?.map((user) => {
                    if (user.id != currentUser) {
                        const option = {
                            label: `${user.username} ${participant.organization.name}`,
                            userName: user.username,
                            organizationName: participant.organization.name,
                            value: `${user.id}-${participant.organization.id}`,
                            isFixed: false,
                            role: user.role_id,
                        }
                        acceptOptions.push(option)
                    }
                })
            })
        }

        return uniqBy(acceptOptions, 'value')
    }

    const _fetchProjectViewAcceptOrg = async () => {
        if (event_type) {
            const projectEventId = documents.find(({ uniqId = '', ...rest }) => {
                return event_type === uniqId
            })
            if (!projectEventId?.projectEventId || !selectedProjectEvent?.id) {
                return
            }
            const viewAccept = await fetchProjectViewAcceptOrg({ project_event_id: projectEventId })

            const acceptOptions = _allUsers()
            setSelectOptions(acceptOptions)

            const viewUserOptions = [],
                acceptUserOptions = []
            acceptOptions.map((option) => {
                let isAccepted = false
                if (viewAccept?.accept_orgs?.some((accept) => option.value == accept)) {
                    isAccepted = true
                    acceptUserOptions.push(option)
                }
                if (viewAccept?.view_orgs?.some((view) => option.value == view)) {
                    if (isAccepted) {
                        option.isFixed = true
                    }
                    viewUserOptions.push(option)
                }
            })
            setViewUsers(viewUserOptions)
            setAcceptUsers(acceptUserOptions)
        }
    }

    useEffect(() => {
        if (projectId) {
            getProjectPDCList()
        }
    }, [projectId])

    const getProjectPDCList = async () => {
        const pdcList = await fetchProjectPDC(projectId)
        if (pdcList.length) {
            setProjectPDCList(pdcList)
            const selectedPDC = pdcList.find(({ is_default }) => is_default)
            setSelectedPDC(selectedPDC.pdc_name)
        }
    }

    const setEventList = async (projectPDCList, pdc) => {
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

        setDocuments(!!pdc && pdc !== '0' ? relatedEvents || [] : pdcEvents)
    }

    const getPDCDetails = async (eventId, pdc) => {
        if (eventId == 0 || !eventId) {
            setViewUsers([])
            setAcceptUsers([])
            await getProjectPDCList()
        }

        let pdcDetails = {}
        const shouldResetPDC = (selectedPDC == '' || selectedPDC == 0 || !selectedPDC) && eventId != 0 && !!eventId && !resubmitId

        if (shouldResetPDC) {
            pdcDetails = await fetchPDCByEvent(eventId)
            setSelectedPDC(pdcDetails?.[0]?.pdc_name)
            setProjectPDCList(pdcDetails)
        }
        const pdcObj = !!eventId && (await fetchCategoryPDC(eventId, !shouldResetPDC ? selectedPDC || pdc : pdcDetails?.[0]?.pdc_name))
        if (!pdcObj || eventId == 0 || !eventId) {
            setViewUsers([])
            setAcceptUsers([])
            if (!pdcDetails?.[0]?.pdc_name && !pdc && selectedProjectEvent) {
                const acceptOptions = _allUsers()
                let acceptedUsers = []
                selectedProjectEvent.event_accept_document_users?.map((user) => {
                    acceptedUsers.push(`${user?.user_id}-${user.organization_id}`)
                })

                const array = acceptedUsers.map((value) => {
                    return { ...acceptOptions.find((option) => option.value == value), isFixed: true }
                })

                _handleSelect(array, 'accept_users', !eventId || eventId == '0')
            }

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

        pdcObj?.pdc_orgs.map(({ org_id }) => {
            orgs.push(org_id)
        })
        pdcObj?.pdc_participants.map(({ participant_id }) => {
            participants.push(participant_id)
        })

        if (!!pdcObj) {
            const newUsers = await fetchPdcUsers({ orgs: [...orgs, ...participants] })
            let eventUsers = []

            if (eventParticipantFilters.length) {
                eventParticipantFilters.map((participant) => {
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
                if (user.id != currentUser) {
                    const option = {
                        label: `${user.username} ${user?.organization.name}`,
                        userName: user.username,
                        organizationName: user?.organization.name,
                        value: `${user.id}-${user.organization.id}`,
                        isFixed: false,
                        role: user.role_id,
                    }
                    options.push(option)
                }
            })
        }
        const uniqueOptions = _.uniqBy([...options, ...selectOptions], 'value')
        setSelectOptions(uniqueOptions)
        pdcObj?.pdc_organizations.map((org) => {
            if (org.accept_user_id && org.accept_user_id > 0 && org.event_id === eventId) {
                const orgData = users.find(({ id }) => id === org.accept_user_id)
                if (orgData && !acceptedUsers.includes(`${org?.accept_user_id}-${orgData.organization?.id}`)) {
                    acceptedUsers.push(`${org?.accept_user_id}-${orgData.organization?.id}`)
                }
            }

            if (pdcDetails?.[0]?.pdc_name && pdcDetails?.[0]?.pdc_name != 0) {
                setCanUserSubmitEvent(false)
            }

            if (org.submit_user_id == currentUser && org.event_id === eventId) {
                setCanUserSubmitEvent(true)
            }
        })
        const array = acceptedUsers.map((value) => {
            return { ...uniqueOptions.find((option) => option.value == value), isFixed: true }
        })

        setAcceptUsers(array)
        _handleSelect(array, 'accept_users', eventId)
    }

    useEffect(() => {
        if (editDocument) {
            setdeadlinedate(selectedProjectEvent.document_deadline || 168)
            setSelectedPDC(selectedProjectEvent.pdc_id ? selectedProjectEvent.pdc_id?.trim() : selectedProjectEvent.pdc_id || 0) // Fallback for live
            setEventLocation(selectedProjectEvent.location || '')
            setEventDescription(selectedProjectEvent.description || '')
            onChangeEventType(selectedProjectEvent.event_id)
            setPrevAttachment(selectedProjectEvent.attachment)
            setPrevImageUrl(selectedProjectEvent.image_url)
            setPDCUserDetails(selectedProjectEvent.event_id, selectedProjectEvent.pdc_id)
        }
    }, [documents])

    // @Todo create separate function
    const setPDCUserDetails = async (eventId, pdc) => {
        const pdcObj = await fetchCategoryPDC(eventId, pdc)
        if (!pdcObj || eventId == 0 || !eventId) {
            setViewUsers([])
            setAcceptUsers([])

            if (pdc && selectedProjectEvent) {
                const acceptOptions = _allUsers()
                let acceptedUsers = []
                selectedProjectEvent.event_accept_document_users?.map((user) => {
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

            if (eventParticipantFilters.length) {
                eventParticipantFilters.map((participant) => {
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
                if (user.id != currentUser) {
                    const option = {
                        label: `${user.username} ${user.organization?.name}`,
                        userName: user.username,
                        organizationName: user.organization?.name,
                        value: `${user.id}-${user.organization?.id}`,
                        isFixed: false,
                        role: user.role_id,
                    }
                    options.push(option)
                }
            })
        }
        // Update PDC Users with Existing allUsers (Project Participant Users)
        const uniqueOptions = _.uniqBy([...options, ...selectOptions], 'value')
        setSelectOptions(uniqueOptions)
        pdcObj?.pdc_organizations.map((org) => {
            if (org.accept_user_id && org.accept_user_id > 0 && org.event_id === eventId) {
                // Check whether the org -> accept_user_id contains the PDC Users
                const orgData = users.find(({ id }) => id === org.accept_user_id)
                // If org -> accept_user_id had the PDC Users & the user not in the accept users, manually push into it
                if (orgData && !acceptedUsers.includes(`${org?.accept_user_id}-${orgData.organization?.id}`)) {
                    acceptedUsers.push(`${org?.accept_user_id}-${orgData.organization?.id}`)
                }
            }

            if (org.submit_user_id == currentUser && org.event_id === eventId) {
                setCanUserSubmitEvent(true)
            }
        })
        const array = acceptedUsers.map((value) => {
            return { ...uniqueOptions.find((option) => option.value == value), isFixed: true }
        })
        // setAcceptUsers(array)
        _handleSelect(array, 'accept_users', eventId)
    }

    useEffect(() => {
        const resubmitProjectId = localStorage.getItem('resubmitId')
        setResubmitId(resubmitProjectId)
        if (selectedItem || selectedItemWatchall) {
            fetchItemProject({ item_id: selectedItem || selectedItemWatchall }).then(async (itemProject) => {
                const _alertEvents = []

                const projectAlertEvents = await fetchEvents()
                projectAlertEvents.length &&
                    projectAlertEvents.map((event) => {
                        _alertEvents.push(event)
                    })
                if (itemProject) {
                    setProjectId(itemProject.projectObj.id)
                    let newEvents = []
                    projectPDCList.map((pdcEvent) => {
                        pdcEvent.project_pdc_category_events.map(({ event_id }) => {
                            if (pdcEvent.pdc_name === selectedPDC) {
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

                    setDocuments(!!selectedPDC && selectedPDC !== '0' && relatedEvents && relatedEvents.length ? relatedEvents : pdcEvents)

                    if (selectedPDC == '0') {
                        setCanUserSubmitEvent(true)
                    }
                }
            })
        }

        const acceptOptions = _allUsers()
        _fetchProjectViewAcceptOrg()

        setSelectOptions(acceptOptions)
    }, [selectedItem, selectedItemWatchall, projectPDCList, selectedPDC])

    const toggleCropModal = () => toggleCrop(!crop)
    const toggleEditModal = () => toggleEdit(!edit)

    const divEl = useRef(null)
    const leftBar = useRef(null)

    const saveCrop = () => {
        setBlob(blobCache)
        setEventFile(blobCache)
        toggleCropModal()
    }

    const onEventIdChange = async (eventId, pdc = '') => {
        setEventType(eventId)
        _checkformIdIfexixts(eventId)
        await getPDCDetails(eventId, pdc)
        _allUsers()
        if (eventId != '') {
            const targetValue = eventId
            const selected_event = documents.filter((event) => event.uniqId == targetValue)
            if (selected_event.length > 0 && selected_event[0].deadlineDays != null) {
                setDisabled(true)
                setdeadlinedate(selected_event[0].deadlineDays)
            } else {
                setDisabled(false)
                setdeadlinedate(1)
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

        let viewSelected = eventId ? [] : view_users || []
        if (viewSelected == null) {
            viewSelected = []
        }
        const acceptedUserIds = _.map(selected, 'value')
        let viewOptions = _.uniqBy(viewSelected.concat(selected), 'value')
        viewOptions = viewOptions.map((item) => {
            return { ...item, isFixed: acceptedUserIds.includes(item.value) }
        })

        setViewUsers(viewOptions)
    }

    const saveEdit = async () => {
        setIsLoading(true)
        let formData = new FormData()
        formData.append('file', event_file)
        let all_images = []
        pdf_images.map((image) => {
            image = image.split('-')
            const ar2 = image.slice(1, image.length)
            const val = ar2.join('-')
            all_images.push('server/upload/' + val)
        })

        formData.append('pdf_images', all_images)
        const response = await savePdf(formData)
        if (response.success) {
            toggleEditModal()
        } else {
            notify(string.eventAddingErr)
        }
        setIsLoading(false)
    }

    const cancelEdit = () => {
        toggleEditModal()
    }

    const getBlob = (blob) => {
        setBlobCache(blob)
    }

    //On select image
    const _onImageChange = async (e) => {
        try {
            const files = e.target.files
            const file = e.target.files[0]

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
                    response = await convertDocument(formData, 'docx')
                    setFirstImage(response.base64)
                    setShowLoader(false)
                }

                //Upload PPTX
                if (file.type == 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
                    setShowLoader(true)
                    let formData = new FormData()
                    formData.append('file', file)
                    response = await convertDocument(formData, 'pptx')
                    setFirstImage(response.base64)
                    setShowLoader(false)
                }

                //Upload XLSX
                if (file.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                    setShowLoader(true)
                    let formData = new FormData()
                    formData.append('file', file)
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
                    response = await splitPdf(formData)
                    setFirstImage(response.base64)
                }

                //Upload Image
                if (file.type == 'image/png' || file.type == 'image/jpeg' || file.type == 'image/jpeg') {
                    const fileName = file.name.split('.')
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

    const setScrollHeight = () => {
        const height = document.getElementById('pdf-viewer-blk').clientHeight
        setScrollerHeight(height)
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
            setPdfImages(pdf_arr)
            const firstPageName = pdf_arr[0].split('-')
            setSelectedPage(firstPageName[1])
        }
    }

    const _deletePage = async () => {
        setLoading(true)
        const deleteImage = pdf_images[pageToDelete]
        const splitImage = deleteImage.split('-')
        const response = await deleteFile({
            file: splitImage[1],
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

    /*PDF image sorting case*/
    const SortableItem = sortableElement(({ value, imageIndex }) => (
        <>
            <img
                onClick={() => {
                    setLeftScrollPos(scrollPos)
                    setSelectedPage(value)
                    setSelectedPageIndex(imageIndex)
                }}
                src={`/server/upload/${value}`}
                style={{ zIndex: 99999999 }}
            />
        </>
    ))

    const onScroll = () => {
        scrollPos = leftBar.current.scrollTop
    }

    const SortableList = sortableContainer(({ items }) => {
        return (
            <div id='pdf-page-scroll' onScroll={onScroll} style={{ height: scrollerHeight }} ref={leftBar} className='pdf-page-scroll'>
                {items.map((image, i) => {
                    let img_number = image.split('-')
                    const ar2 = img_number.slice(1, img_number.length)
                    const val = ar2.join('-')
                    return (
                        <React.Fragment key={i}>
                            <div className={selectedPage == val ? 'pdf-image active' : 'pdf-image'}>
                                <SortableItem key={i} index={i} value={val} imageIndex={i} />
                                <span className='textnumber'>{img_number[0]}</span>
                            </div>
                        </React.Fragment>
                    )
                })}
            </div>
        )
    })

    const onSortEnd = ({ oldIndex, newIndex }) => {
        setPdfImages(arrayMove(pdf_images, oldIndex, newIndex))
    }

    const changeEditImage = async (url, file) => {
        setLoading(true)
        const imageUrl = url.canvas.toDataURL('image/jpg')
        const response = await saveEditedFile({
            imageUrl,
            name: selectedPage,
        })
        if (response.success) {
            setpdfpagenames(response.images, 'image/jpeg')
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

    const _checkformIdIfexixts = (value) => {
        setformexists(false)
        const data = documents.find((item) => item.uniqId == value)
        if (data && Object.keys(data).length > 0) {
            if (data.formId && parseInt(data.formId) >= 0) {
                setformexists(true)
                setformId(data.formId)
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
        if (acceptUserCondition) {
            notify(string.pleaseSelectAcceptUsers)
            return false
        }
        const response = await fetchFormData(formId)
        setFormData(response)
        setShowForm(true)
    }

    const _goback = () => {
        setFormData([])
        setShowForm(false)
    }

    const onChangeEventType = async (value) => {
        setEventType(value)
        _checkformIdIfexixts(value)
        if (value != '') {
            let selected_doc = find(documentEvents, (doc) => doc.id == value)
            if (selected_doc && selected_doc.document_deadline != undefined && selected_doc.document_deadline != ' ' && selected_doc.document_deadline != null) {
                setDisabled(true)
                setdeadlinedate(selected_doc.document_deadline)
            } else {
                setDisabled(false)
                setdeadlinedate(1)
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
    return (
        <>
            <Modal isOpen={isOpen} toggle={toggle} className='customModal document modal-lg' id='documentModal'>
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
                                            <select
                                                value={selectedPDC || ''}
                                                className='form-control'
                                                onChange={async (event) => {
                                                    setSelectedPDC(event.target.value)
                                                    setEventType(0)
                                                    setViewUsers([])
                                                    setAcceptUsers([])
                                                    setResubmitId(0)
                                                    localStorage.removeItem('resubmitId')
                                                }}
                                            >
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
                                            <select
                                                disabled={editDocument}
                                                value={event_type || 0}
                                                className='form-control'
                                                onChange={(event) => {
                                                    setCanUserSubmitEvent(false)
                                                    const eventId = event.target.value
                                                    onChangeEventType(event.target.value)
                                                    onEventIdChange(eventId)
                                                }}
                                            >
                                                <option value=''>{string.event.plzSelectDocTxt}</option>
                                                {documents.map((item, i) => (
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
                                        <div className='col-md-12'>
                                            {crop && (
                                                <Modal isOpen={crop} toggle={toggleCropModal} className='customModal document modal-lg' id='documentModal'>
                                                    <ModalHeader toggle={toggleCropModal}>
                                                        <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                                                            CROP IMAGE
                                                        </h5>
                                                    </ModalHeader>
                                                    <ModalBody>
                                                        <ImageCrop getBlob={getBlob} inputImg={inputImg} fileName={event_file?.name} />
                                                    </ModalBody>
                                                    <ModalFooter>
                                                        <button className='btn btn-secondary' onClick={cancelCrop}>
                                                            Cancel
                                                        </button>
                                                        <button className='btn btn-primary' onClick={saveCrop}>
                                                            Save
                                                        </button>
                                                    </ModalFooter>
                                                </Modal>
                                            )}
                                        </div>
                                        <div className='col-md-12'>
                                            {edit && (
                                                <Modal isOpen={edit} toggle={toggleEditModal} className='customModal document modal-lg' id='editDocumentEventPdfModal'>
                                                    <ModalBody>
                                                        {loading ? (
                                                            <div className='split-pdf-loader'>
                                                                <Spinner size={'sm'} />
                                                            </div>
                                                        ) : (
                                                            <div id='pdf-viewer-blk' className='pdf-viewer' data-height={scrollerHeight}>
                                                                <SortableList
                                                                    axis='xy'
                                                                    distance={2}
                                                                    items={pdf_images}
                                                                    onSortEnd={onSortEnd}
                                                                    style={{
                                                                        zIndex: 99999999,
                                                                    }}
                                                                />
                                                                <div className='modal-header-blk'>
                                                                    <h5 className='document-edit-title'>{string.editPdfTxt}</h5>
                                                                    <div className='document-action-btns'>
                                                                        <i
                                                                            onClick={(event) => {
                                                                                event.stopPropagation()
                                                                                setShow(true)
                                                                                setEditImage(`/server/upload/${selectedPage}`)
                                                                                setEditImageIndex(selectedPageIndex)
                                                                            }}
                                                                            style={{
                                                                                marginRight: '6px',
                                                                                cursor: 'pointer',
                                                                            }}
                                                                            title='Edit page'
                                                                            className='fa fa-edit'
                                                                        ></i>
                                                                        {pdf_images.length > 1 && <i onClick={() => _togglePageDelete(selectedPageIndex)} style={{ cursor: 'pointer' }} title='Delete page' className='fa fa-trash-alt'></i>}
                                                                    </div>
                                                                    <div className='edit-doc-close-btn'>
                                                                        <button onClick={toggleEditModal} type='button' className='close' aria-label='Close'>
                                                                            <span aria-hidden='true'>×</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div ref={divEl} className='pdf-page-view'>
                                                                    {selectedPage && <img onLoad={setScrollHeight} src={`/server/upload/${selectedPage}`} />}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </ModalBody>
                                                    <ModalFooter>
                                                        <button className='btn btn-secondary' onClick={cancelEdit}>
                                                            {string.cancel}
                                                        </button>
                                                        <LoaderButton cssClass='btn btn-primary btn-fix-width' onClick={saveEdit} isLoading={isLoading} text={string.save} />
                                                    </ModalFooter>
                                                </Modal>
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
                                                name={string.fileName}
                                                options={selectOptions}
                                                formatOptionLabel={function (data) {
                                                    return (
                                                        <>
                                                            <span style={{ color: '#ED8931' }}>{data.userName}</span> <span style={{ color: '#a56233' }}>{data.organizationName}</span>
                                                        </>
                                                    )
                                                }}
                                                placeholder={string.event.selectHere}
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
                                                isDisabled={!!selectedPDC && selectedPDC != 0}
                                                className='basic-single'
                                                classNamePrefix='select'
                                                isSearchable
                                                isClearable={false}
                                                name={string.acceptDocument}
                                                options={selectOptions.filter((option) => option.role != process.env.ROLE_PUBLIC_USER)}
                                                formatOptionLabel={function (data) {
                                                    return (
                                                        <>
                                                            <span style={{ color: '#ED8931' }}>{data.userName}</span> <span style={{ color: '#a56233' }}>{data.organizationName}</span>
                                                        </>
                                                    )
                                                }}
                                                placeholder={string.event.selectHere}
                                                value={accept_users}
                                                onChange={(select, action) => onChangeView(select, action, 'accept_users')}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', direction: 'Row' }}>
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
                                        <div className='form-group'>
                                            <textarea
                                                placeholder={string.event.textareaPlaceholder}
                                                className='form-control resize-none'
                                                value={event_description}
                                                onChange={(event) => {
                                                    setEventDescription(event.target.value)
                                                }}
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                    {showForm && (
                        <div className='form-builder-blk'>
                            <ReactFormGenerator
                                show_btns={true}
                                loaderButton
                                data={formData}
                                translate={string}
                                rootURL={getRootUrl()}
                                user_id={currentUser}
                                _goback={_goback}
                                onSubmit={(event) => {
                                    _submitEvent(
                                        event_type,
                                        null,
                                        JSON.stringify(_.map(accept_users, 'value')),
                                        JSON.stringify(_.map(view_users, 'value')),
                                        event_file,
                                        'document',
                                        deadlinedate,
                                        firstImage,
                                        JSON.stringify(event),
                                        formId,
                                        event_description,
                                        event_location,
                                        projectId,
                                        selectedPDC,
                                        canUserSubmitEvent,
                                        selectedPDC != 0,
                                    )
                                }}
                            />
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    {!showForm ? (
                        <LoaderButton
                            cssClass='btn btn-primary large-btn'
                            isLoading={is_submitting}
                            onClick={() => {
                                const acceptUserCondition = view_users.every((viewUser) => viewUser.role == process.env.ROLE_PUBLIC_USER) ? false : !accept_users?.length
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
                                    _submitEvent(
                                        event_type,
                                        null,
                                        JSON.stringify(_.map(accept_users, 'value')),
                                        JSON.stringify(_.map(view_users, 'value')),
                                        event_file,
                                        'document',
                                        deadlinedate,
                                        firstImage,
                                        JSON.stringify(selectedPreviewEvent),
                                        selectedProjectEvent.event.formId,
                                        event_description,
                                        event_location,
                                        projectId,
                                        selectedPDC,
                                        canUserSubmitEvent,
                                        selectedPDC != 0,
                                    )
                                } else {
                                    if (deadlinedateerror === false) {
                                        if (!event_type) {
                                            notify(string.pleaseSelectEventType)
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
                                        _submitEvent(
                                            event_type,
                                            null,
                                            JSON.stringify(_.map(accept_users, 'value')),
                                            JSON.stringify(_.map(view_users, 'value')),
                                            event_file,
                                            'document',
                                            deadlinedate,
                                            firstImage,
                                            null,
                                            null,
                                            event_description,
                                            event_location,
                                            projectId,
                                            selectedPDC,
                                            canUserSubmitEvent,
                                            selectedPDC != 0,
                                        )
                                    } else {
                                        notify(string.acceptancedeadlinereq)
                                        return false
                                    }
                                }
                            }}
                            text={formexists ? (editDocument ? string.submitBtnTxt : string.project.next) : string.submitBtnTxt}
                        />
                    ) : (
                        ''
                    )}
                </ModalFooter>
                <FilerobotImageEditor
                    config={config}
                    show={show}
                    src={editImage}
                    onClose={() => setShow(false)}
                    onComplete={(url, file) => changeEditImage(url, file)}
                    onBeforeComplete={() => {
                        return false
                    }}
                />
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
