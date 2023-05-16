import { Formik } from 'formik'
import { Modal, ModalBody, ModalHeader } from 'reactstrap'
import { useEffect, useState, useMemo } from 'react'
import ShortUniqueId from 'short-unique-id'
import _ from 'lodash'
import { components } from 'react-select'
import { withCookies, useCookies } from 'react-cookie'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import AdvanceSelect from '../common/form-elements/select/AdvanceSelect'
import string from '../../utils/LanguageTranslation'
import { fetchPdcUsers } from '../../lib/api/user'
import { fetchProjectParticipantCategory, fetchOrgsByCategory, getOrg } from '../../lib/api/organization'
import { addPdcCategory, checkPdcName, updatePdcCategory } from '../../lib/api/pdc-category'
import notify from '../../lib/notifier'
import FormHelperMessage from '../common/form-elements/formHelperMessage'
import { updatePdc } from '../../lib/api/pdc-api'
import { sanitize } from '../../utils/globalFunc'
import Spinner from '../common/OverlaySpinner'

const OptionLabel = ({ data, ...props }) => {
    const { innerProps, innerRef } = props
    return (
        <div {...props} ref={innerRef} {...innerProps} style={{ padding: 10, cursor: 'pointer', textTransform: 'capitalize' }}>
            <span style={{ color: '#F47B02' }}>{data.username} </span>
            <span style={{ color: '#A26239' }}>{data.organization?.name}</span>
        </div>
    )
}

const GetOptionLabel = (user) => (
    <div style={{ textTransform: 'capitalize' }}>
        <span style={{ color: '#F47B02' }}>{user.username} </span>
        <span style={{ color: '#A26239' }}>{user.organization?.name}</span>
    </div>
)

const AddPdcCategoryModal = ({ isOpen, selectedPdcId, user, allOrgs, projectCategory, event_categories, eventAssets, document_categories, onSelectProjectCategory, onfetchProjectCategories, closeToggle }) => {
    const [cookies, setCookie, removeToken] = useCookies(['authToken'])

    // filter events
    const eventTypes = ['event', 'document']
    const eventsIds = projectCategory?.project_event_categories.map((pec) => pec.event_category_id) || []
    const selectedEventCategories = (event_categories.length && event_categories?.filter((ecat) => eventsIds.indexOf(ecat?.id) > -1)) || []
    const eventProps = []
    selectedEventCategories.forEach((sec) => {
        eventAssets?.events?.map((event) => {
            if (event?.event_category_id == sec.id) {
                eventProps.push({ categoryId: event.event_category_id, ...event })
            }
        })
    })
    const [events, setEvents] = useState(eventProps)
    // filter documents
    const docsIds = projectCategory?.project_document_categories.map((pdc) => pdc.document_category_id) || []
    const selectedDocCategories = (document_categories.length && document_categories?.filter((dcat) => docsIds.indexOf(dcat?.id) > -1)) || []

    const docs = []
    selectedDocCategories.forEach((sdc) => {
        eventAssets?.documents?.map(({ event_category_id, eventType, ...rest }) => {
            if (event_category_id == sdc.id && eventType === 'document') {
                docs.push({ categoryId: event_category_id, eventType, ...rest })
            }
        })
    })
    const msgStyles = {
        textTransform: 'capitalize',
        color: '#F47B02',
    }

    const GetOptionLabel = (allowedUsers) => (
        <div style={{ textTransform: 'capitalize' }}>
            <span style={{ color: '#F47B02' }}>{allowedUsers.username} </span>
            <span style={{ color: '#A26239' }}>{allowedUsers.organization?.name}</span>
        </div>
    )
    const userStyles = {
        textTransform: 'capitalize',
        color: '#A26239',
    }
    const [isLoadingContent, setIsLoadingContent] = useState(false)
    const [pdcName, setPdcName] = useState('')
    const [isLoading, setLoading] = useState(false)
    const [selectedEventList, setEventList] = useState([])
    const [orgList, setOrgList] = useState([])
    const [selectedPdcOrgList, setSelectedPdcOrgList] = useState([])
    const [selectedPdcOrgs, setSelectedPdcOrgs] = useState([])
    const [selectedOrgAndParticipants, setSelectedOrgAndParticipants] = useState({
        participants: [],
        organization: [],
    })
    const [userToSubmitSeeAccept, setUsersToSubmitSeeAccept] = useState({
        accept: [],
        see: [],
        submit: [],
    })
    const [allowedUsers, setAllowedUsers] = useState([])
    const [categoryIds, setCategoryIds] = useState([])
    const [pdcData, setPdcData] = useState([])

    const organizationList = useMemo(() => {
        const optionList = []
        projectCategory?.project_participant_categories.map((item) => {
            optionList.push({ ...item, name: item?.participant_category?.name, label: 'Participant Category' })
        })
        orgList.map((item) => (item.label = 'Organization'))
        return [
            { label: 'Organization', options: [...orgList] },
            { label: 'Participant Category', options: [...optionList] },
        ]
    }, [orgList, projectCategory, selectedPdcId])

    const [pdcDetail_, setPdcDetail] = useState([])

    const setPdcEvents = (pdcDetail, events_) => {
        const pdcDetails = projectCategory.project_pdc_categories?.find((pdcCat) => pdcCat.id === selectedPdcId)
        const totalEvents = [...(events_ ? events_ : events), ...docs]
        const pdcEvents = pdcDetail.map((ps) => {
            return totalEvents.find((ev) => ev.uniqId == ps.event_id)
        })
        setEventList(pdcEvents[0])
        const accept = []
        const see = []
        const submit = []

        pdcDetails.pdc_organizations.map(({ accept_user_id, see_user_id, submit_user_id }) => {
            if (submit_user_id > 0) {
                const user = allowedUsers.find(({ id }) => id == submit_user_id)
                submit.push(user)
            }

            if (see_user_id > 0) {
                const user = allowedUsers.find(({ id }) => id == see_user_id)
                see.push(user)
            }

            if (accept_user_id > 0) {
                const user = allowedUsers.find(({ id }) => id == accept_user_id)
                accept.push(user)
            }
        })

        setUsersToSubmitSeeAccept({ accept, see, submit })
    }

    useEffect(() => {
        const getPDCData = async () => {
            setIsLoadingContent(true)
            if (selectedPdcId) {
                const pdcDetails = projectCategory.project_pdc_categories?.find((pdcCat) => pdcCat.id === selectedPdcId)
                const pdcDetail = []
                if (pdcDetails) {
                    const { name, pdc_selections, pdc_name, pdc_orgs, pdc_participants, project_pdc_category_events, pdc_organizations } = pdcDetails
                    const org_list = {
                        organization: pdc_orgs,
                        participants: pdc_participants,
                    }
                    const orgs = []
                    const participants = []
                    setPdcName(name)
                    const orgListData = []

                    const orgsOption = []
                    let pCategoryId = ''

                    org_list.organization.map(({ org_id: pId }) => {
                        orgs.push(pId)
                        const item = orgList.find(({ id }) => id == pId)
                        orgsOption.push({ organization_type_id: pId, ...item })
                        if (item) {
                            orgListData.push({ ...item, ...{ label: 'Organization' } })
                        }
                    })
                    org_list.participants.map(({ participant_id: pId }) => {
                        participants.push(pId)
                        const item = projectCategory?.project_participant_categories.find(({ participant_category_id }) => participant_category_id == pId)

                        if (item) {
                            pCategoryId = item.project_category_id
                            orgListData.push({ participant_category_id: pId, ...item, ...item.participant_category, label: 'Participant Category' })
                        }
                    })

                    const categoryList = pCategoryId ? await fetchProjectParticipantCategory({ pCategoryId }) : []
                    const allOrgs = []
                    categoryList.map((category) => {
                        category.participant_category.organization_categories.map((orgCategory) => {
                            allOrgs.push(orgCategory.org_id)
                        })
                    })
                    setSelectedOrgAndParticipants({
                        participants,
                        organization: orgs,
                    })
                    const users = await fetchPdcUsers({ orgs: [...orgs, ...allOrgs] })

                    setAllowedUsers(
                        users.map((item) => {
                            return {
                                value: item.id,
                                label: item.username,
                                ...item,
                            }
                        }),
                    )
                    project_pdc_category_events.map((pdc) => {
                        const organizations = pdc_organizations.filter(({ event_id }) => pdc.event_id === event_id)
                        const accept = []
                        const see = []
                        const submit = []
                        organizations.map((org) => {
                            if (org.accept_user_id > 0) {
                                const user = users.find(({ id }) => id == org.accept_user_id)
                                accept.push(user)
                            }

                            if (org.see_user_id > 0) {
                                const user = users.find(({ id }) => id == org.see_user_id)
                                see.push(user)
                            }

                            if (org.submit_user_id > 0) {
                                if (pdc.is_submit_selected) {
                                    const user = users.find(({ id }) => id === org.submit_user_id)
                                    submit.push(user)
                                }
                            }
                        })
                        pdcDetail.push({ ...pdc, id: pdc.event_id, accept, see, submit })
                    })
                    setPdcEvents(pdcDetail)

                    setPdcData([...pdcDetail])
                    setPdcDetail(pdcDetail)
                    setSelectedPdcOrgList(orgListData)
                }
            }
            setIsLoadingContent(false)
        }
        getPDCData()
        return () => {
            setPdcData([])
        }
    }, [selectedPdcId, orgList, events])

    if (events.length !== eventProps.length) {
        setEvents(eventProps)
    }

    useEffect(() => {
        if (projectCategory?.project_participant_categories?.length) {
            const pCategoryId = projectCategory?.project_participant_categories.map((ppc) => ppc.project_category_id) || []
            if (pCategoryId?.length) {
                fetchProjectParticipantCategory({ pCategoryId }).then((result) => {
                    let orgList = []
                    if (result.length > 0) {
                        result.map((category) => {
                            category.participant_category.organization_categories.map((orgCategory) => {
                                orgList.push(orgCategory.organization)
                            })
                        })
                        orgList = _.uniqBy(orgList, 'id')
                    }
                    setOrgList(orgList)
                })
            }
        }
    }, [projectCategory])

    useEffect(() => {
        if (selectedPdcOrgList[0]?.id) {
            _handleSelectOrganizations(selectedPdcOrgList)
        }
    }, [selectedPdcOrgList[0]?.id])

    const _handleSelectOrganizations = async (selected) => {
        try {
            if (!selected) {
                const users = await fetchPdcUsers({ orgs: [] })

                setAllowedUsers(
                    users.map((item) => {
                        return {
                            value: item.id,
                            label: item.username,
                            ...item,
                        }
                    }),
                )
            }
            setSelectedPdcOrgList((prevOrgs) => {
                if (selected) {
                    for (const sorg of selected) {
                        const oorg = prevOrgs.find((porg) => porg.id === sorg.id)
                        if (!oorg) {
                            sorg.canSubmit = true
                            sorg.canAccept = true
                            break
                        }
                    }
                }
                return selected || []
            })

            const orgs = []
            const participants = []
            const projectIds = []
            const data = {
                participants: [],
                organization: [],
            }
            selected.map((item) => {
                if (item.label !== 'Organization') {
                    participants.push(item.participant_category_id)
                    projectIds.push(item.project_category_id)
                    Object.assign(data, { participants: [...data.participants] })
                } else {
                    orgs.push(item.id)
                    Object.assign(data, { organization: [...data.organization] })
                }
            })

            setCategoryIds(projectIds)
            const categoryList = await fetchProjectParticipantCategory({ pCategoryId: projectIds })
            const orgsList = await fetchOrgsByCategory({ catIds: participants })
            const allOrgs = []
            categoryList.map((category) => {
                category.participant_category.organization_categories.map((orgCategory) => {
                    allOrgs.push(orgCategory.org_id)
                })
            })
            setSelectedPdcOrgs(_.uniqBy([...orgs, ...allOrgs]))
            setSelectedOrgAndParticipants({
                participants,
                organization: orgs,
            })
            const users = await fetchPdcUsers({ orgs: [...orgs, ...allOrgs] })

            setAllowedUsers(
                users.map((item) => {
                    return {
                        value: item.id,
                        label: item.username,
                        ...item,
                    }
                }),
            )
        } catch (error) {
            console.log(error)
        }
    }

    const _handleToggleLoader = () => {
        setLoading((prevState) => !prevState)
    }

    const checkPdcNameExist = async (payLoad) => {
        const response = await checkPdcName(payLoad)

        return response.code == 400
    }

    const createUniquePdcName = async () => {
        const sanitizedName = sanitize(user.organization.name).substr(0, 3)
        let isAlreadyExist = false
        let uniquePdcName = ''
        do {
            const randomCode = new ShortUniqueId({ length: 6, dictionary: 'alpha_lower' })
            uniquePdcName = `${sanitizedName}${randomCode()}`
            isAlreadyExist = await checkPdcNameExist({ pdc_name: uniquePdcName, checkPDCName: true })
        } while (isAlreadyExist)

        return uniquePdcName
    }

    const _onSubmit = async (values, { resetForm }) => {
        try {
            let iteration = 0
            let pdc_name = await createUniquePdcName()
            const pdcEventList = []
            const userIds = {
                submit: [],
                see: [],
                accept: [],
            }
            const pdcRef = pdcData
                ?.map((data) => {
                    if (data?.see?.length || data?.submit?.length || data?.accept?.length) return data
                })
                .filter(Boolean)
            pdcRef.map((pdcDetails) => {
                const userToOrgList = []
                pdcDetails.submit?.map((data) => {
                    userToOrgList.push({
                        ...(data || {}),
                        canSubmit: true,
                        canSee: false,
                        canAccept: false,
                    })
                    Object.assign(userIds, { ...userIds, submit: [...userIds.submit, data?.id] })
                })
                pdcDetails.see?.map((data) => {
                    userToOrgList.push({
                        ...(data || {}),
                        canSubmit: false,
                        canSee: true,
                        canAccept: false,
                    })
                    Object.assign(userIds, { ...userIds, see: [...userIds.see, data?.id] })
                })
                pdcDetails.accept?.map((data) => {
                    userToOrgList.push({
                        ...(data || {}),
                        canSubmit: false,
                        canSee: false,
                        canAccept: true,
                    })
                    Object.assign(userIds, { ...userIds, accept: [...userIds.accept, data?.id] })
                })

                pdcEventList.push({ id: pdcDetails.id, orgs: userToOrgList, userIds })
            })
            if (selectedPdcId) {
                const pdcDetails = projectCategory.project_pdc_categories?.find((pdcCat) => pdcCat.id === selectedPdcId)
                if (pdcDetails?.pdc_name) {
                    pdc_name = pdcDetails.pdc_name
                }
            }
            const pdcDataObj = {
                name: pdcName,
                pdc_name,
                project_category_id: projectCategory.id,
                orgs: pdcData,
                createdBy: user.organization_id,
                userIds: userIds,
                orgList: selectedOrgAndParticipants,
                pdcData: _.uniqBy(pdcEventList, 'id'),
            }
            // Start loader
            _handleToggleLoader()
            const userOrg = allOrgs.find((org) => org.id == user.organization_id)
            const orgNameList = []
            selectedPdcOrgList.forEach((sorg) => {
                const orgName = orgList?.find((org) => org.id === sorg.id)?.blockchain_name || ''
                if (orgName) {
                    if (orgName.toLowerCase() == process.env.HOST_ORG) {
                        orgNameList.push(process.env.HOST_MSP)
                    } else {
                        orgNameList.push(sanitize(orgName))
                    }
                }
            })

            const categoryList = await fetchProjectParticipantCategory({ pCategoryId: categoryIds })
            const orgNameLists = []
            categoryList.map((category) => {
                category.participant_category.organization_categories.map((orgCategory) => {
                    if (orgCategory.organization.name?.toLowerCase() == process.env.HOST_ORG) {
                        orgNameLists.push(process.env.HOST_MSP)
                    } else {
                        orgNameLists.push(sanitize(orgCategory.organization.blockchain_name))
                    }
                })
            })
            const filteredOrgList = []
            Array(...orgNameLists, ...orgNameList).map((name) => {
                if (filteredOrgList.includes(name)) {
                } else {
                    filteredOrgList.push(name === process.env.HOST_MSP ? name : name.replace(' ', '').toLowerCase())
                }
            })

            //There must be more than one Orgs in order to create a PDC
            if (filteredOrgList.length < 2) {
                throw string.pdcCategory.validatePdcOrgs
            }

            // Get organization
            const organization = await getOrg({
                id: user.organization.id,
            })

            const pdcJson = {
                orgName: sanitize(organization.blockchain_name),
                peerId: process.env.PEER_ID,
                chaincode: process.env.CHAINCODE_NAME,
                pdcName: pdc_name,
                memberOrgs: filteredOrgList,
            }
            pdcDataObj.members = pdcJson.memberOrgs

            if (selectedPdcId) {
                pdcDataObj.project_category_id = selectedPdcId
                // if (iteration === 0) {
                //     const updatePdcReponse = await updatePdc(pdcJson, userOrg.msp_type, cookies.authToken)
                //     if (updatePdcReponse.success != true && !updatePdcReponse.message.includes('unchanged content')) {
                //         throw updatePdcReponse
                //     }
                // }
                await updatePdcCategory(pdcDataObj)
                notify(string.pdcCategory.updateEventSuccess)
            } else {
                // if (iteration === 0) {
                //     pdcDataObj.members = pdcJson.memberOrgs
                //     // const createPdcReponse = await createPdc(pdcJson, userOrg.msp_type, cookies.authToken)
                //     // if (createPdcReponse.success != true) {
                //     //     throw createPdcReponse
                //     // }
                // }

                await addPdcCategory(pdcDataObj)
                notify(string.pdcCategory.pdcReqInProgress)
            }
            iteration += 1

            // Get updated project categories
            onfetchProjectCategories()
            onSelectProjectCategory()
            resetForm()
            resetStates()
            _handleToggleLoader()
        } catch (err) {
            notify(err.message || err.toString())
            _handleToggleLoader()
        }
    }

    const resetStates = () => {
        setEventList([])
        setSelectedPdcOrgList([])
        setPdcName('')
        setUsersToSubmitSeeAccept({
            accept: [],
            see: [],
            submit: [],
        })
    }

    const isValidOrg = (id) => {
        const org = selectedPdcOrgList.find((org) => org.id === id)
        if (org?.canSee) {
            return false
        }
        return true
    }

    const _handleSelectedEvents = (selected, type) => {
        if (!selected) {
            setEventList({})
            return
        }
        setEventList(selected)
        if (pdcData.some(({ id }) => id === selected.uniqId)) {
            return
        }

        setPdcData([...pdcData, { id: selected.uniqId, see: [], submit: [], accept: [] }])
    }

    const handleSubmitEvents = (selected, key) => {
        let data = []
        if (selected) {
            data = selected?.map((item) => {
                return {
                    ...item,
                    name: item.eventName,
                }
            })
        }
        setUsersToSubmitSeeAccept({ ...userToSubmitSeeAccept, [key]: data })
        const pdcDetails = []

        pdcData.map((pdc) => {
            if (pdc.id === selectedEventList?.uniqId) {
                if (key === 'submit') {
                    pdcDetails.push({ ...pdc, submit: data, see: _.uniqBy(pdc?.see ? [...data, ...pdc.see] : data, 'id') })
                } else if (key === 'accept') {
                    pdcDetails.push({ ...pdc, accept: data, see: _.uniqBy(pdc?.see ? [...pdc.see, ...data] : data, 'id') })
                } else {
                    pdcDetails.push({ ...pdc, see: data })
                }
            } else {
                pdcDetails.push({ ...pdc })
            }
        })
        setPdcData([...pdcDetails])
    }

    const CustomGroup = (props) => {
        return (
            <div className='group-heading-wrapper'>
                <components.Group {...props} />
            </div>
        )
    }

    const userSubmitAcceptList = useMemo(() => {
        return pdcData.find(({ id }) => id === selectedEventList?.uniqId) || { submit: [], see: [], accept: [] }
    }, [selectedEventList, pdcData, selectedPdcId])

    return typeof window === 'undefined' ? null : (
        <Modal
            className='customModal document pdc-modal'
            isOpen={isOpen}
            toggle={() => {
                closeToggle()
                resetStates()
            }}
        >
            <ModalHeader
                toggle={() => {
                    closeToggle()
                    resetStates()
                }}
            >
                <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {string.pdcCategory[selectedPdcId ? 'updatePDCBtnText' : 'createPDCBtnText']}
                </h5>
            </ModalHeader>
            <ModalBody className='overlay-modal-css' style={{ display: 'grid' }}>
                {isLoadingContent && <Spinner />}
                <Formik
                    enableReinitialize
                    initialValues={{
                        pdcName,
                        selectedEventList,
                        selectedPdcOrgList,
                    }}
                    validate={async ({ pdcName, selectedEventList, selectedPdcOrgList }) => {
                        const errors = {}
                        if (!pdcName) {
                            errors.pdcName = string.pdcCategory.pdcNameErr
                        }
                        if (!selectedPdcId) {
                            const checkPDCName = await checkPdcNameExist({ name: pdcName, checkPDCName: false })
                            if (checkPDCName) {
                                errors.pdcName = string.pdcCategory.pdcNameExist
                            }
                        }
                        if (!selectedEventList || !Object.keys(selectedEventList).length) {
                            errors.selectedEvents = string.pdcCategory.eventDocErr
                        }
                        if (selectedPdcOrgs.length < 2) {
                            errors.orgError = string.pdcCategory.orgError
                        }
                        const pattern = /^(?!.*["'`\\])/
                        if (!pattern.test(pdcName)) {
                            notify(`${string.pdcCategory.pdcName} ${string.errors.invalid}`)
                            errors.pdcName = `${string.pdcCategory.pdcName} ${string.errors.invalid}`
                        }
                        return errors
                    }}
                    onSubmit={(values, { resetForm }) => {
                        _onSubmit(values, { resetForm })
                    }}
                >
                    {({ errors, handleSubmit, values }) => (
                        <form onSubmit={handleSubmit}>
                            <div className='row ml-0 mr-0 content-block'>
                                <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                    {string.pdcCategory.selectOrgText}
                                </label>
                                <div className='form-group col-md-12 pl-0 pr-0 mb-0'>
                                    <AdvanceSelect
                                        name='selectedPdcOrgList'
                                        isMulti
                                        className='basic-single'
                                        classNamePrefix='select'
                                        isClearable
                                        isSearchable
                                        options={organizationList}
                                        placeholder={string.pdcCategory.selectOrgText}
                                        getOptionLabel={(event) => event.name}
                                        getOptionValue={(event) => event.id}
                                        value={selectedPdcOrgList}
                                        onChange={_handleSelectOrganizations}
                                        components={{ Group: CustomGroup }}
                                    />
                                    <FormHelperMessage message={errors.orgError} className='error' />
                                </div>
                            </div>
                            <div className='row ml-0 mr-0 content-block'>
                                <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                    {string.pdcCategory.pdcName}
                                </label>
                                <input type='text' style={{ borderColor: '#cccccc' }} name='pdcName' disabled={!!selectedPdcId} className='form-control' placeholder={string.pdcCategory.pdcName} value={values.pdcName} onChange={(e) => setPdcName(e.target.value)} />
                                <FormHelperMessage message={errors.pdcName} className='error' />
                            </div>
                            <div className='row m-0 content-block'>
                                <div className='form-group m-0 col-md-6 p-0'>
                                    <div className='form-group m-0 col-md-12 pl-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.pdcEventText}
                                        </label>
                                        <AdvanceSelect
                                            className='basic-single'
                                            classNamePrefix='select'
                                            isClearable
                                            isSearchable
                                            name={eventTypes[0]}
                                            options={events}
                                            placeholder={string.pdcEventText}
                                            getOptionLabel={(event) => event.eventName}
                                            getOptionValue={(event) => event.uniqId}
                                            value={selectedEventList?.eventType === eventTypes[0] ? selectedEventList : null}
                                            onChange={(selected) => _handleSelectedEvents(selected, eventTypes[0])}
                                        />
                                    </div>
                                </div>
                                <div className='form-group m-0 col-md-6 p-0'>
                                    <div className='form-group m-0 col-md-12 pr-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.pdcDocText}
                                        </label>
                                        <AdvanceSelect
                                            className='basic-single'
                                            classNamePrefix='select'
                                            isClearable
                                            isSearchable
                                            name={eventTypes[1]}
                                            options={docs}
                                            placeholder={string.pdcDocText}
                                            getOptionLabel={(doc) => doc.eventName}
                                            getOptionValue={(doc) => doc.uniqId}
                                            value={selectedEventList?.eventType === eventTypes[1] ? selectedEventList : null}
                                            onChange={(selected) => _handleSelectedEvents(selected, eventTypes[1])}
                                        />
                                    </div>
                                </div>
                            </div>
                            {errors.selectedEvents ? <FormHelperMessage message={errors.selectedEvents} className='error' /> : null}

                            <div className='row ml-0 mr-0 content-block'>
                                <div className='form-group m-0 col-md-4 p-0'>
                                    <div className='form-group col-md-12 pl-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.pdcCategory.whoCanSubmit}
                                        </label>
                                        <AdvanceSelect
                                            isMulti
                                            className='basic-single'
                                            classNamePrefix='select'
                                            isClearable
                                            isSearchable
                                            options={allowedUsers}
                                            placeholder={string.pdcCategory.selectusers}
                                            formatOptionLabel={GetOptionLabel}
                                            getOptionValue={(user) => user.id}
                                            value={userSubmitAcceptList?.submit || []}
                                            onChange={(selected) => handleSubmitEvents(selected, 'submit')}
                                            components={{ Option: OptionLabel }}
                                        />
                                    </div>
                                </div>

                                <div className='form-group m-0 col-md-4 p-0'>
                                    <div className='form-group col-md-12 px-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.pdcCategory.whoCanSee}
                                        </label>

                                        <AdvanceSelect
                                            isMulti
                                            className='basic-single'
                                            classNamePrefix='select'
                                            isClearable
                                            isSearchable
                                            options={allowedUsers}
                                            placeholder={string.pdcCategory.selectusers}
                                            formatOptionLabel={GetOptionLabel}
                                            getOptionValue={(user) => user.id}
                                            value={_.uniqBy(userSubmitAcceptList?.see || [], 'id')}
                                            onChange={(selected) => handleSubmitEvents(selected, 'see')}
                                            components={{ Option: OptionLabel }}
                                        />
                                    </div>
                                </div>

                                <div className='form-group m-0 col-md-4 p-0'>
                                    <div className='form-group col-md-12 pr-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.pdcCategory.whoCanAccept}
                                        </label>
                                        <AdvanceSelect
                                            isMulti
                                            className='basic-single'
                                            classNamePrefix='select'
                                            isClearable
                                            isSearchable
                                            options={allowedUsers}
                                            placeholder={string.pdcCategory.selectusers}
                                            formatOptionLabel={GetOptionLabel}
                                            getOptionValue={(user) => user.id}
                                            value={userSubmitAcceptList?.accept || []}
                                            onChange={(selected) => handleSubmitEvents(selected, 'accept')}
                                            components={{ Option: OptionLabel }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className='modal-footer'>
                                <LoaderButton type='submit' isLoading={isLoading} cssClass='btn btn-primary large-btn' text={string.pdcCategory.saveBtnText} />
                            </div>
                        </form>
                    )}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

AddPdcCategoryModal.propTypes = {}
AddPdcCategoryModal.defaultProps = {}

export default withCookies(AddPdcCategoryModal)
