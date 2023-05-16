import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import React, { useContext, useState, useEffect } from 'react'
import _ from 'lodash'
import ImageCrop from '../imageCrop'
import notify from '../../lib/notifier'
import string from '../../utils/LanguageTranslation.js'
import { otherLanguage } from '../../utils/selectedLanguage.js'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import AdvanceSelect from '../common/form-elements/select/AdvanceSelect'
import moment from 'moment-timezone'
import DatePicker from 'react-datepicker'
import '../../node_modules/react-datepicker/dist/react-datepicker.css'
import { fetchFormData, getForm } from '../../lib/api/formBuilder'
import { ReactFormGenerator } from 'chaincodedev-form-builder'
import { fetchItemProject } from '../../lib/api/item'
import { fetchProjectViewAcceptOrg } from '../../lib/api/project-event'
import { fetchPdcCategory, fetchCategoryPDC, fetchPDCByEvent, fetchEventByPDC } from '../../lib/api/pdc-category'
import WatchAllEventContext from '../../store/watchAllEvent/watchAllEventContext'
import EventContext from '../../store/event/eventContext'
import { fetchPdcUsers } from '../../lib/api/user'
import { fetchProjectPDC } from '../../lib/api/pdc-category'
import { fetchEvents } from '../../lib/api/event'
import Loader from '../../components/common/Loader'
import { getRootUrl } from '../../lib/api/getRootUrl'

const viewCustomStyles = {
    multiValueRemove: (base, state) => {
        return state.data.isFixed ? { ...base, display: 'none' } : base
    },
}

const EventModal = ({ pdcEvents, isOpen, toggle, eventParticipantFilters, transportEvents, _submitEvent, is_submitting, watch_all, eventFilters, selectedProjectEvent, selectedPreviewEvent, currentUser }) => {
    if (typeof window === 'undefined') {
        return null
    }

    const [event_type, setEventType] = useState(0)
    const [event_time, setEventTime] = useState(moment().format('YYYY-MM-DDTHH:mm:ss'))
    const [selectOptions, setSelectOptions] = useState([])
    const [view_users, setViewUsers] = useState([])
    const [accept_users, setAcceptUsers] = useState([])
    const [event_description, setEventDescription] = useState('')
    const [event_location, setEventLocation] = useState('')
    const [event_file, setEventFile] = useState(null)
    const [inputImg, setInputImg] = useState(null)
    const [crop, toggleCrop] = useState(false)
    const [formexists, setformexists] = useState(false)
    const [formId, setformId] = useState('')
    const [isdisabled, setDisabled] = useState(false)
    const [deadlinedate, setdeadlinedate] = useState(168)
    const [deadlinedateerror, setdeadlinedateerror] = useState(false)
    const [blob, setBlob] = useState(null)
    const [formData, setFormData] = useState([])
    const [events, setEvents] = useState([])
    const [projectId, setProjectId] = useState(null)
    const [pdc, setPDC] = useState()
    const [showForm, setShowForm] = useState(false)
    const [blobCache, setBlobCache] = useState(null)
    const [prevAttachment, setPrevAttachment] = useState(null)
    const [prevImageUrl, setPrevImageUrl] = useState(null)
    const [selectedPDC, setSelectedPDC] = useState()
    const [projectPDCList, setProjectPDCList] = useState([])
    const [pdcEventList, setPDCEventList] = useState([])
    const [canUserSubmitEvent, setCanUserSubmitEvent] = useState(false)
    const [resubmitId, setResubmitId] = useState(0)
    const [isLoading, setIsLoading] = useState([])
    const editDocument = !!_.size(selectedProjectEvent) && !!_.size(selectedPreviewEvent)

    const { selectedItem } = useContext(EventContext)
    const { selectedItem: selectedItemWatchall } = useContext(WatchAllEventContext)

    const toggleCropModal = () => toggleCrop(!crop)

    const _allUsers = () => {
        const acceptOptions = []

        if (eventParticipantFilters.length) {
            let filteredParticipants = eventParticipantFilters
            if (watch_all && selectedProjectEvent?.project_id) {
                filteredParticipants = eventParticipantFilters.filter(({ project_id }) => {
                    return project_id === selectedProjectEvent?.project_id
                })
            }
            filteredParticipants.map((participant) => {
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
        return _.uniqBy(acceptOptions, 'value')
    }

    const _fetchProjectViewAcceptOrg = async () => {
        if (event_type) {
            const projectEventId = events.find(({ uniqId = '', ...rest }) => {
                return event_type === uniqId
            })
            if (!projectEventId?.projectEventId && !selectedProjectEvent?.id) {
                return
            }
            const viewAccept = await fetchProjectViewAcceptOrg({ project_event_id: projectEventId?.projectEventId || selectedProjectEvent?.id })

            const acceptOptions = _allUsers()
            setSelectOptions(acceptOptions)

            const viewUserOptions = [],
                acceptUserOptions = []

            acceptOptions.map((option) => {
                let isAccepted = false
                if (viewAccept?.accept_orgs?.some((accept) => option.value == accept)) {
                    isAccepted = true
                    acceptUserOptions.push({ ...option })
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
        if (editDocument) {
            setdeadlinedate(_.get(selectedProjectEvent, 'event.deadlineDays', 1))
            setSelectedPDC(selectedProjectEvent.pdc_id ? selectedProjectEvent.pdc_id?.trim() : selectedProjectEvent.pdc_id || 0) // Fallback for live
            setEventLocation(selectedProjectEvent.location || '')
            setEventDescription(selectedProjectEvent.description || '')
            onChangeEventType(selectedProjectEvent.event_id)
            setPrevAttachment(selectedProjectEvent.attachment)
            setPrevImageUrl(selectedProjectEvent.image_url)
            _fetchProjectViewAcceptOrg()
            setPDCUserDetails(selectedProjectEvent.event_id, selectedProjectEvent.pdc_id)
        }
    }, [events])

    useEffect(() => {
        if (projectId) {
            getProjectPDCList()
        }
    }, [projectId])

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
                    // Add automatic events
                    setEvents(!!selectedPDC && selectedPDC !== '0' ? relatedEvents || [] : pdcEvents)
                    if (selectedPDC == '0') {
                        setCanUserSubmitEvent(true)
                    }
                }
            })
        }
        const acceptOptions = _allUsers()
        setSelectOptions(acceptOptions)
        _fetchProjectViewAcceptOrg()
    }, [selectedItem, selectedItemWatchall, projectPDCList, selectedPDC])

    const getProjectPDCList = async () => {
        const pdcList = await fetchProjectPDC(projectId)
        if (pdcList.length) {
            setProjectPDCList(pdcList)
            const selectedPDC = pdcList.find(({ is_default }) => is_default)
            setSelectedPDC(selectedPDC.pdc_name)
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

        let viewSelected = eventId ? [] : view_users || []
        if (viewSelected == null) {
            viewSelected = []
        }
        const acceptedUserIds = _.map(selected, 'value')
        let viewOptions = _.uniqBy(viewSelected.concat(selected), 'value')
        // All accept users should add into viewusers without remove (Fixed Option)
        viewOptions = viewOptions.map((item) => {
            return { ...item, isFixed: acceptedUserIds.includes(item?.value) }
        })

        setViewUsers(viewOptions)
    }

    const saveCrop = () => {
        setBlob(blobCache)
        setEventFile(blobCache)
        toggleCropModal()
    }

    const cancelCrop = () => {
        setBlob(event_file)
        setEventFile(event_file)
        toggleCropModal()
    }

    const getBlob = (blob) => {
        setBlobCache(blob)
    }

    const _onImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const file_types = ['image/png', 'image/jpeg', 'image/jpg']
            if (!file_types.includes(file.type)) {
                notify(string.invalidFileFormat)
                return false
            }
            const reader = new FileReader()
            setEventFile(file)
            toggleCropModal()
            reader.addEventListener(
                'load',
                () => {
                    setInputImg(reader.result)
                },
                false,
            )
            reader.readAsDataURL(file)
        }
    }

    const DateCustomInput = React.forwardRef(({ value, onClick }, ref) => {
        return (
            <input
                className='text-left'
                style={{ width: '100%', borderWidth: 0, backgroundColor: 'white' }}
                onClick={(e) => {
                    e.preventDefault()
                    onClick()
                }}
                ref={ref}
                value={value}
                onChange={(e) => setEventTime(e.target.value)}
            ></input>
        )
    })

    const checkIfFormExists = async (value) => {
        const data = events.find((item) => item.uniqId == value)
        if (data && Object.keys(data).length > 0) {
            if (data.formId && parseInt(data.formId) >= 0) {
                const formdata = await getForm(data.formId)
                if (formdata) {
                    setformexists(true)
                    setformId(data.formId)
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

    // @Todo create separate function
    const setPDCUserDetails = async (eventId, pdc) => {
        startLoading()
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
        _handleSelect(array, 'accept_users', eventId)
        removeLoading()
    }

    const _getformdata = async () => {
        const response = await fetchFormData(formId)
        setFormData(response)
        setShowForm(true)
    }

    const _goback = () => {
        setFormData([])
        setShowForm(false)
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

        setEvents(!!pdc && pdc !== '0' ? relatedEvents || [] : pdcEvents)
    }

    const startLoading = () => {
        setIsLoading([...isLoading, 'true'])
    }

    const removeLoading = () => {
        setIsLoading((prevState) => {
            prevState.pop()
            return [...prevState]
        })
    }

    const onChangeEventType = (value) => {
        setEventType(value)
        checkIfFormExists(value)
        if (value != '') {
            let eventjob = watch_all ? events : transportEvents
            let s = value
            let selected_event = eventjob?.filter((event) => event.id == s) || []
            if (selected_event.length > 0 && selected_event[0].document_deadline != null) {
                setDisabled(true)
                setdeadlinedate(selected_event[0].document_deadline)
            } else {
                setDisabled(false)
                setdeadlinedate(168)
            }
        }
    }

    const onEventIdChange = async (eventId, pdc = '') => {
        setEventType(eventId)
        checkIfFormExists(eventId)
        await getPDCDetails(eventId, pdc)
        _allUsers()

        if (eventId != '') {
            const targetValue = eventId
            const selected_event = events.filter((event) => event.uniqId == targetValue)
            if (selected_event.length > 0 && selected_event[0].deadlineDays != null) {
                setDisabled(true)
                setdeadlinedate(selected_event[0].deadlineDays)
            } else {
                setDisabled(false)
                setdeadlinedate(168)
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
        startLoading()
        if (eventId == 0 || !eventId) {
            setViewUsers([])
            setAcceptUsers([])
            await getProjectPDCList()
        }
        const shouldResetPDC = (selectedPDC == '' || selectedPDC == 0 || !selectedPDC) && eventId != 0 && !resubmitId
        let newPDCName = ''
        if (shouldResetPDC) {
            const pdcDetails = await fetchPDCByEvent(eventId)
            newPDCName = pdcDetails?.[0]?.pdc_name
            setSelectedPDC(pdcDetails?.[0]?.pdc_name)
            setProjectPDCList(pdcDetails)
        }

        const pdcObj = await fetchCategoryPDC(eventId, shouldResetPDC ? newPDCName : selectedPDC || pdc)
        if (!pdcObj || eventId == 0 || !eventId) {
            setViewUsers([])
            setAcceptUsers([])

            if (!newPDCName && !pdc && selectedProjectEvent) {
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

        let reFetchedEvents = []
        if (newPDCName || !pdc || selectedPDC) {
            reFetchedEvents = await fetchEventByPDC(shouldResetPDC ? newPDCName : selectedPDC || pdc)
            await setEventList(reFetchedEvents, shouldResetPDC ? newPDCName : selectedPDC || pdc)
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

            if (newPDCName && newPDCName != 0) {
                setCanUserSubmitEvent(false)
            }

            if (org.submit_user_id == currentUser && org.event_id === eventId) {
                setCanUserSubmitEvent(true)
            }
        })
        const array = acceptedUsers.map((value) => {
            return { ...uniqueOptions.find((option) => option.value == value), isFixed: true }
        })
        _handleSelect(array, 'accept_users', eventId)
        removeLoading()
    }
    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal document modal-lg' id='documentModal'>
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
                                        <select
                                            value={selectedPDC || ''}
                                            className='form-control'
                                            onChange={async (event) => {
                                                startLoading()
                                                setSelectedPDC(event.target.value)
                                                setEventType(0)
                                                setViewUsers([])
                                                setAcceptUsers([])
                                                setResubmitId(0)
                                                localStorage.removeItem('resubmitId')
                                                removeLoading()
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
                                            onChange={async (event) => {
                                                startLoading()
                                                setCanUserSubmitEvent(false)
                                                const eventId = event.target.value
                                                await onEventIdChange(eventId)
                                                removeLoading()
                                            }}
                                        >
                                            <option value='0'>{string.event.plzSelectEventTxt}</option>
                                            {events.map((item, i) => (
                                                <option key={i} value={item.uniqId}>
                                                    {otherLanguage && item.mongolianName ? item.mongolianName : item.eventName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className='col-md-6'>
                                    <div className='form-group'>
                                        <div className='form-control modal-dare-picker-wrapper'>
                                            <DatePicker selected={new Date(event_time)} showTimeSelect dateFormat='yyyy-MM-dd HH:mm:ss' onChange={(date) => setEventTime(date)} customInput={<DateCustomInput />} minDate={new Date()} timeIntervals={1} />
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
                                        {/* : (
                                            selectedProjectEvent &&
                                            selectedProjectEvent.attachment && (
                                                <div className='image-preview-blk'>
                                                    <img src={selectedProjectEvent.attachment} alt='cropped-image' />
                                                </div>
                                            )
                                        )} */}
                                        {event_file && (
                                            <div className='image-edit-btn'>
                                                <span className='float-center'>
                                                    <button type='button' className='btn btn-sm btn-primary crop-btn' onClick={toggleCropModal}>
                                                        Edit Image
                                                    </button>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className='col-md-6'>
                                    <div className='form-group pointListing'>
                                        <h5 className='pointsheading'>{string.event.whoCanAccepEvnt}</h5>
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
                                            styles={viewCustomStyles}
                                        />
                                    </div>
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
                                    <div className='form-group pointListing'>
                                        <h5 className='pointsheading'>{string.emailmessages.acceptancedate}</h5>
                                        <input type='number' name='documentdeadline' id='documentdeadline' className='form-control' placeholder={string.emailmessages.acceptancedate} onChange={handleChange} value={deadlinedate} disabled={isdisabled} />
                                    </div>
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
                        </form>
                    </div>
                )}
                {showForm && (
                    <div className='form-builder-blk'>
                        <ReactFormGenerator
                            data={formData}
                            rootURL={getRootUrl()}
                            user_id={currentUser}
                            translate={string}
                            show_btns={true}
                            _goback={_goback}
                            onSubmit={(event) => {
                                _submitEvent(
                                    event_type,
                                    event_time,
                                    JSON.stringify(_.map(accept_users, 'value')),
                                    JSON.stringify(_.map(view_users, 'value')),
                                    event_file,
                                    'event',
                                    deadlinedate,
                                    inputImg,
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
                {!showForm && (
                    <LoaderButton
                        cssClass='btn btn-primary large-btn'
                        isLoading={is_submitting}
                        onClick={() => {
                            if (formexists && !editDocument) {
                                _getformdata()
                            } else if (editDocument && formexists) {
                                _submitEvent(
                                    event_type,
                                    event_time,
                                    JSON.stringify(_.map(accept_users, 'value')),
                                    JSON.stringify(_.map(view_users, 'value')),
                                    event_file,
                                    'event',
                                    deadlinedate,
                                    inputImg,
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
                                _submitEvent(
                                    event_type,
                                    event_time,
                                    JSON.stringify(_.map(accept_users, 'value')),
                                    JSON.stringify(_.map(view_users, 'value')),
                                    event_file,
                                    'event',
                                    deadlinedate,
                                    inputImg,
                                    null,
                                    null,
                                    event_description,
                                    event_location,
                                    projectId,
                                    selectedPDC,
                                    canUserSubmitEvent,
                                    selectedPDC != 0,
                                )
                            }
                        }}
                        text={formexists ? (editDocument ? string.submitBtnTxt : string.project.next) : string.submitBtnTxt}
                    />
                )}
            </ModalFooter>
            {!!isLoading?.some((l) => l) && <Loader style={{ position: 'absolute' }} />}
        </Modal>
    )
}

export default EventModal
