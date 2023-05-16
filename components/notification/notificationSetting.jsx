import React, { useEffect, useState } from 'react'
import NProgress from 'nprogress'
import { Spinner, Modal, ModalHeader } from 'reactstrap'
import { isEmpty } from 'lodash'
import { useRouter } from 'next/router'
import notify from '../../lib/notifier'

import Button from '../common/form-elements/button/Button'
import AdvanceSelect from '../common/form-elements/select/AdvanceSelect'
import Checkbox from '../common/form-elements/checkbox/index'
import { defaultOptions, saveSettings, fetchSettings } from '../../lib/api/notification-setting'
import string from '../../utils/LanguageTranslation.js'
import './setting.css'
import '../../static/css/modal.css'
import { fetchOrgs } from '../../lib/api/organization'
import { fetchCategoryEvents } from '../../lib/api/event'
import { fetchAlertEvents } from '../../lib/api/event'
import { otherLanguage } from '../../utils/selectedLanguage.js'

function NotificationSetting(props) {
    if (typeof window === 'undefined') {
        return null
    }

    const { user } = props
    const router = useRouter()
    const localStoreProjectID = window.localStorage.getItem(`${user.id}-project_id`)
    let { project_id } = router.query

    const [modal, setModal] = useState(false)
    const [options, setOptions] = useState([])
    const [organizations, setOrganizations] = useState([])
    const [projects, setProjects] = useState([])
    const [project, setProject] = useState(null)
    const [selectedproject, setselectedProject] = useState([])
    const [selectedDocEvents, setSelectedDocEvents] = useState([])
    const [selectedAlertEvents, setSelectedAlertEvents] = useState([])
    const [selectedOrganizations, setSelectedOrganizations] = useState([])
    const [documentEvents, setDocumentEvents] = useState([])
    const [alertEvents, setAlertEvents] = useState([])
    const [docAccept, setDocAccept] = useState(0)
    const [docComment, setDocComment] = useState(0)
    const [docSubmit, setDocSubmit] = useState(0)
    const [docRejection, setDocRejection] = useState(0)
    const [eventComment, setEventComment] = useState(0)
    const [eventSubmit, setEventSubmit] = useState(0)
    const [eventacceptance, setEventAcceptance] = useState(0)
    const [eventrejection, setEventRejection] = useState(0)
    const [emailNotify, setEmailNotify] = useState(0)
    const [stopNotify, setStopNotify] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [pdcEvents, setPdcEvents] = useState({
        documents: [],
        events: [],
    })
    const toggle = () => setModal(!modal)

    useEffect(() => {
        if (modal) {
            if (!project_id) {
                if (localStoreProjectID) {
                    project_id = localStoreProjectID
                }
            } else if (!!project_id && project_id != localStoreProjectID) {
                window.localStorage.setItem(`${user.id}-project_id`, project_id)
            }

            _defaultOptions(project_id)
        } else {
            setDocComment(0)
            setDocAccept(0)
            setDocSubmit(0)
            setEventComment(0)
            setEventSubmit(0)
            setEmailNotify(0)
            setStopNotify(1)
            setEventRejection(0)
            setEventAcceptance(0)
            setDocRejection(0)
            setSelectedAlertEvents([])
            setSelectedDocEvents([])
            setSelectedOrganizations([])
            setDocumentEvents([])
            setAlertEvents([])
            setOrganizations([])
        }

        return () => setselectedProject([])
    }, [modal])

    const _defaultOptions = async (project_id) => {
        NProgress.start()
        setIsLoading(true)
        try {
            const options = await defaultOptions()
            setOptions(options)
            const _projects = []
            options.map((option, i) => {
                _projects.push({ label: option.project.name, value: option.project.id, i })
            })
            if (project_id != '') {
                const selectedProjects = _projects.filter((option) => option.value === parseInt(project_id))
                if (selectedProjects.length > 0) {
                    setselectedProject(selectedProjects[0])
                    setEmailNotify(1)
                    setStopNotify(1)
                    setProject(selectedProjects[0].value)
                    const option = options[selectedProjects[0].i]
                    await _setSettings(option)
                    await _fetchSettings(project_id)
                }
            }
            setProjects(_projects)
        } catch (err) {
            console.error('Error while fething projects => ', err)
        }
        NProgress.done()
        setIsLoading(false)
    }

    const fetchEventList = async (project) => {
        try {
            let eventCategoryIds = []
            let documentCategoryIds = []
            project.project_category?.project_event_categories.map(({ event_category_id }) => {
                eventCategoryIds.push(event_category_id)
            })
            project.project_category?.project_document_categories.map(({ document_category_id }) => {
                documentCategoryIds.push(document_category_id)
            })

            const orgList = await fetchOrgs()
            const selectedOrg = orgList?.find(({ id }) => id === props.user?.organization_id)
            if (Object.values(selectedOrg).length === 0) {
                return
            }
            const { documentCategory, eventCategory } = await fetchCategoryEvents({ eventCategoryIds, documentCategoryIds })
            const events = [].concat.apply(
                [],
                eventCategory.map((event) => event.events),
            )
            const documents = [].concat.apply(
                [],
                documentCategory.map((event) => event.events),
            )

            setPdcEvents({ events, documents })
            return { events, documents }
        } catch (err) {
            console.log({ err })
        }
    }

    const _setSettings = async (option) => {
        const _alertEvents = []
        const _organizations = []

        const projectAlertEvents = await fetchAlertEvents()
        projectAlertEvents.length &&
            projectAlertEvents.map((event) => {
                _alertEvents.push(event)
            })

        const categoryEvents = await fetchEventList(option.project)

        const tempAlertEventArr = []
        _alertEvents.map((ev) => {
            tempAlertEventArr.push(ev.uniqId)
        })
        categoryEvents.events.map((ev) => {
            tempAlertEventArr.push(ev.uniqId)
        })

        let tempEventArr = []
        categoryEvents.documents.map((ev) => {
            tempEventArr.push(ev.uniqId)
        })

        setSelectedAlertEvents([...tempAlertEventArr])
        setDocumentEvents([...categoryEvents.documents])
        setAlertEvents([..._alertEvents, ...categoryEvents.events])
        setSelectedDocEvents([...tempEventArr])

        option.project.project_participants.map((participant) => {
            if (
                _organizations.filter(function (e) {
                    return parseInt(e.id) == parseInt(participant.participant_id)
                }).length == 0
            ) {
                _organizations.push(participant.organization)
            }
        })
        const tempOrgArr = []
        _organizations.map((ev) => {
            tempOrgArr.push(ev.id)
        })
        setSelectedOrganizations(tempOrgArr)
        setOrganizations(_organizations)
    }

    const _fetchSettings = async (project_id) => {
        const response = await fetchSettings({ project_id, user_id: user.id })
        if (!isEmpty(response)) {
            setDocComment(response.settings.document_comment)
            setDocAccept(response.settings.document_acceptance)
            setDocSubmit(response.settings.document_submit)
            setEventComment(response.settings.event_comment)
            setEventSubmit(response.settings.event_submit)
            setEmailNotify(response.settings.notify_email)
            setStopNotify(response.settings.status)
            setEventRejection(response.settings.event_rejection)
            setEventAcceptance(response.settings.event_acceptance)
            setDocRejection(response.settings.document_rejection)

            if (response.orgs.length > 0) {
                const tempArr = []
                response.orgs.map((ev) => {
                    tempArr.push(ev.organization_id)
                })
                setSelectedOrganizations(tempArr)
            }
            if (response.notification_events.length > 0) {
                const tempArr = []
                response.notification_events.map((ev) => {
                    tempArr.push(ev.alert_event_id)
                })
                setSelectedAlertEvents([...tempArr])
            }
            if (response.notification_documents.length > 0) {
                const tempArr = []
                response.notification_documents.map((ev) => {
                    tempArr.push(ev.document_event_id)
                })
                setSelectedDocEvents([...tempArr])
            }
        } else {
            setDocComment(1)
            setDocAccept(1)
            setDocSubmit(1)
            setEventComment(1)
            setEventSubmit(1)
            setEmailNotify(1)
            setStopNotify(1)
            setEventRejection(1)
            setEventAcceptance(1)
            setDocRejection(1)
        }
    }

    const _saveSettings = async () => {
        if (!project) {
            notify(string.submissionRequest.pleaseSelectProject)
            return false
        }
        NProgress.start()
        try {
            await saveSettings({
                project_id: project,
                document_events: selectedDocEvents,
                alert_events: selectedAlertEvents,
                document_comment: docComment,
                document_acceptance: docAccept,
                document_submit: docSubmit,
                event_comment: eventComment,
                event_submit: eventSubmit,
                organizations: selectedOrganizations,
                event_acceptance: eventacceptance,
                event_rejection: eventrejection,
                document_rejection: docRejection,
                notify_email: emailNotify,
                status: stopNotify,
            })
            notify(string.settingsSaved)
            toggle()
        } catch (err) {
            console.error('Error while saving settings => ', err)
        }
        NProgress.done()
    }

    const _setToDefault = async () => {
        if (!project) {
            notify(string.event.plzSelectProjectTxt)
            return false
        }
        try {
            setDocComment(1)
            setDocAccept(1)
            setDocSubmit(1)
            setEventComment(1)
            setEventSubmit(1)
            setEventRejection(1)
            setEventAcceptance(1)
            setDocRejection(1)
            organizations.map((org) => {
                if (!selectedOrganizations.includes(org.uniqId)) {
                    selectedOrganizations.push(org.uniqId)
                    setSelectedOrganizations([...selectedOrganizations])
                }
            })
            const tempEventArray = [...selectedDocEvents]
            documentEvents.map((ev) => {
                if (!selectedDocEvents.includes(ev.uniqId)) {
                    tempEventArray.push(ev.uniqId)
                    setSelectedDocEvents([...tempEventArray])
                }
            })
            const tempAlertEventArray = [...selectedAlertEvents]
            alertEvents.map((ev) => {
                if (!selectedAlertEvents.includes(ev.uniqId)) {
                    tempAlertEventArray.push(ev.uniqId)
                    setSelectedAlertEvents([...tempAlertEventArray])
                }
            })
            setEmailNotify(1)
            setStopNotify(1)
        } catch (err) {
            console.error('Error while setting to default => ', err)
            NProgress.done()
        }
    }

    return (
        <div className='notification-model'>
            <Button className='notification-btn' onClick={toggle}>
                {string.notificationSettings.notificationSettings}
            </Button>
            <Modal isOpen={modal} toggle={toggle} className='notification-model common-model modal-lg customModal largeModal'>
                <div style={{ position: 'relative' }} className={isLoading ? 'setting-wrap disabled-block' : 'setting-wrap'}>
                    {isLoading && (
                        <div className='loader-profiledata'>
                            <Spinner size='sm' />
                        </div>
                    )}
                    <ModalHeader className='setting-header' toggle={toggle}>
                        {string.notificationSettings.projectFieldTitle}
                        {/*  */}
                        <div className='modalHeadernput' style={{ border: '0px', fontWeight: '400', fontSize: 'initial' }}>
                            <AdvanceSelect
                                placeholder={string.submissionRequest.projectTitleSmall}
                                options={projects}
                                value={selectedproject || ''}
                                name='project_id'
                                onChange={async (event) => {
                                    setselectedProject(event)
                                    await _defaultOptions(event.value)
                                }}
                            />
                        </div>
                    </ModalHeader>
                    <div className='setting-body'>
                        {/* content row started */}
                        <div className='row'>
                            {/* ORGANIZATIONS START */}
                            <div className='col-md-4 pl-0'>
                                <div className='block-title'>{string.notificationSettings.organizationFieldTitle}</div>
                                {organizations.length > 0 && (
                                    <div className='setting-card setting-content-wrap'>
                                        {organizations
                                            .filter((org) => org.id != user.organization_id)
                                            .map((org, i) => {
                                                return (
                                                    <label key={i}>
                                                        {' '}
                                                        <input
                                                            onClick={(e) => {
                                                                if (
                                                                    selectedOrganizations.filter(function (event) {
                                                                        return parseInt(event) === parseInt(e.target.value)
                                                                    }).length == 0
                                                                ) {
                                                                    // add into array
                                                                    selectedOrganizations.push(parseInt(e.target.value))
                                                                    setSelectedOrganizations([...selectedOrganizations])
                                                                } else {
                                                                    // remove from the array
                                                                    const index = selectedOrganizations.indexOf(parseInt(e.target.value))
                                                                    selectedOrganizations.splice(index, 1)
                                                                    setSelectedOrganizations([...selectedOrganizations])
                                                                }
                                                            }}
                                                            checked={selectedOrganizations.includes(org.id)}
                                                            type='checkbox'
                                                            value={org.id}
                                                            className='default-css'
                                                        />
                                                        {org.name}
                                                    </label>
                                                )
                                            })}
                                    </div>
                                )}
                            </div>
                            {/* ORGANIZATIONS END */}

                            {/* DOCUMENTS START */}
                            <div className='col-md-4'>
                                <div className='block-title'>{string.doc}</div>
                                <div className='withNoBox'>
                                    <label>
                                        {' '}
                                        <input onClick={() => setDocSubmit(!docSubmit)} type='checkbox' checked={docSubmit != 0} className='default-css' />
                                        {string.notificationSettings.docSubmit}
                                    </label>
                                    <label>
                                        {' '}
                                        <input onClick={() => setDocComment(!docComment)} type='checkbox' checked={docComment != 0} className='default-css' />
                                        {string.notificationSettings.docComment}
                                    </label>
                                    <label>
                                        {' '}
                                        <input onClick={() => setDocAccept(!docAccept)} type='checkbox' checked={docAccept != 0} className='default-css' />
                                        {string.notificationSettings.docAccept}
                                    </label>
                                    <label>
                                        {' '}
                                        <input onClick={() => setDocRejection(!docRejection)} type='checkbox' checked={docRejection != 0} className='default-css' />
                                        {string.notificationSettings.docRejection}
                                    </label>
                                </div>
                                {documentEvents.length > 0 && (
                                    <div className='setting-card setting-content-wrap withSmallHeight'>
                                        {documentEvents.map((event, i) => {
                                            return (
                                                <label key={i}>
                                                    {' '}
                                                    <input
                                                        onClick={(e) => {
                                                            if (!selectedDocEvents.includes(e.target.value)) {
                                                                selectedDocEvents.push(e.target.value)
                                                                setSelectedDocEvents([...selectedDocEvents])
                                                            } else {
                                                                const index = selectedDocEvents.indexOf(e.target.value)
                                                                selectedDocEvents.splice(index, 1)
                                                                setSelectedDocEvents([...selectedDocEvents])
                                                            }
                                                        }}
                                                        checked={selectedDocEvents.includes(event.uniqId)}
                                                        type='checkbox'
                                                        value={event.uniqId}
                                                        className='default-css'
                                                    />
                                                    {otherLanguage && event.mongolianName ? event.mongolianName : event.eventName}
                                                </label>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                            {/* DOCUMENTS END */}

                            {/* EVENTS START */}
                            <div className='col-md-4'>
                                <div className='block-title'>{string.events}</div>
                                <div className='withNoBox'>
                                    <label>
                                        {' '}
                                        <input onClick={() => setEventSubmit(!eventSubmit)} checked={eventSubmit != 0} type='checkbox' className='default-css' />
                                        {string.notificationSettings.eventSubmit}
                                    </label>
                                    <label>
                                        {' '}
                                        <input onClick={() => setEventComment(!eventComment)} checked={eventComment != 0} type='checkbox' className='default-css' />
                                        {string.notificationSettings.eventComment}
                                    </label>
                                    <label>
                                        {' '}
                                        <input onClick={() => setEventAcceptance(!eventacceptance)} checked={eventacceptance != 0} type='checkbox' className='default-css' />
                                        {string.notificationSettings.eventAcceptance}
                                    </label>
                                    <label>
                                        {' '}
                                        <input onClick={() => setEventRejection(!eventrejection)} checked={eventrejection != 0} type='checkbox' className='default-css' />
                                        {string.notificationSettings.eventRejection}
                                    </label>
                                </div>
                                {alertEvents.length > 0 && (
                                    <div className='setting-card setting-content-wrap withSmallHeight'>
                                        {alertEvents.map((event, i) => {
                                            return (
                                                <label key={i}>
                                                    {' '}
                                                    <input
                                                        onClick={(e) => {
                                                            if (!selectedAlertEvents.includes(e.target.value)) {
                                                                selectedAlertEvents.push(e.target.value)
                                                                setSelectedAlertEvents([...selectedAlertEvents])
                                                            } else {
                                                                const index = selectedAlertEvents.indexOf(e.target.value)
                                                                selectedAlertEvents.splice(index, 1)
                                                                setSelectedAlertEvents([...selectedAlertEvents])
                                                            }
                                                        }}
                                                        checked={selectedAlertEvents.includes(event.uniqId)}
                                                        type='checkbox'
                                                        value={event.uniqId}
                                                        className='default-css'
                                                    />
                                                    {otherLanguage && event.mongolianName ? event.mongolianName : event.eventName}
                                                </label>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                            {/* EVENTS END */}

                            {/* FOOTER START */}
                            <div className='switch-wrap d-flex col-md-12 pl-0'>
                                <div className='custom-switch'>
                                    <Checkbox
                                        onClick={() => {
                                            setEmailNotify(!emailNotify)
                                        }}
                                        checked={!!emailNotify}
                                        value={string.notificationSettings.notifyEmail}
                                        id='Itemreceivedx'
                                        className='notification-check custom-control-input'
                                    />
                                    <label className='custom-control-label' htmlFor='Itemreceivedx'>
                                        {string.notificationSettings.notifyEmail}
                                    </label>
                                </div>
                                <div className='custom-switch'>
                                    <Checkbox
                                        onClick={() => {
                                            setStopNotify(!stopNotify)
                                        }}
                                        checked={!stopNotify}
                                        value={string.notificationSettings.stopNotify}
                                        id='StopNotify'
                                        className='notification-check custom-control-input'
                                    />
                                    <label className='custom-control-label' htmlFor='StopNotify'>
                                        {string.notificationSettings.stopNotify}
                                    </label>
                                </div>
                                <div className='switch-btns'>
                                    <Button type='button' className='btn btn-primary large-btn' onClick={() => _setToDefault()}>
                                        {' '}
                                        {string.notificationSettings.setToDefaultBtn}{' '}
                                    </Button>
                                    <Button className='btn btn-primary large-btn' onClick={() => _saveSettings()}>
                                        {' '}
                                        {string.notificationSettings.applyBtn}{' '}
                                    </Button>
                                </div>
                            </div>
                            {/* FOOTER END */}
                        </div>
                        {/* //content row end */}
                    </div>
                </div>
            </Modal>
        </div>
    )
}
export default NotificationSetting
