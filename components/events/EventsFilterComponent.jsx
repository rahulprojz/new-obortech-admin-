import React, { useState, useContext, useEffect } from 'react'
import Select, { components } from 'react-select'
import DateRangePicker from 'react-bootstrap-daterangepicker'
import moment from 'moment'
import 'bootstrap-daterangepicker/daterangepicker.css'
import EventFilters from './miniStatus/EventFilters'
import CustomSelect from '../common/form-elements/select/CustomSelect'
import Button from '../common/form-elements/button/Button'
import string from '../../utils/LanguageTranslation.js'
import EventContext from '../../store/event/eventContext'
import '../../static/css/all.css'

let timeFilter = ''
const EventFilterComponent = ({
    project,
    projectSelections,
    refetchProjectSelection,
    user,
    _fetchEventsJob,
    eventType,
    getGroupedData,
    _toggleEvent,
    _toggleDocument,
    project_id,
    user_id,
    _fetchEvents,
    isChanged,
    categoryEvents,
    pdcEvents,
    setCheckTrue,
    filteredEvent,
    hideEvents,
    menuIsOpen,
    SetMenuIsOpen,
    setShowHiddenEvents,
    setIsShowHiddenEvents,
}) => {
    const {
        datetime,
        setDatetime,
        organization_id,
        setOrganizationId,
        created_by,
        setCreatedBy,
        eventoptions,
        eventId,
        setEventId,
        eventName,
        setEventName,
        searchText,
        setSearchText,
        pdcCategoryList,
        setSelectedPDCName,
        searchEventId,
        setSearchEventId,
        timeSelectorFilter,
        setTimeSelectorFilter,
        projectEventParticipants,
        advanceFilterSelection,
        advanceSearchOptions,
        setAdvanceFilterSelection,
        selectedMenu,
        setselectedMenu,
    } = useContext(EventContext)
    const userEvents = filteredEvent.map((val) => val.val.filter((ev) => ev?.project_event))
    const selectedAll = selectedMenu != 'showEvents' && userEvents.length && userEvents.every((val) => val.every((ev) => ev?.project_event?.checked))
    const deselectedAll = selectedMenu !== undefined && userEvents.length && userEvents.every((val) => val.every((ev) => !ev?.project_event?.checked))
    const organizatoinOptions = [{ label: string.participant.showForAllOrganizations, userName: string.participant.showForAllOrganizations, organizationName: '', value: '' }]
    const userOptions = [{ label: string.participant.showForAllUsers, userName: string.participant.showForAllUsers, organizationName: '', value: '' }]
    projectEventParticipants.length > 0 &&
        projectEventParticipants.map((pUsers) => {
            if (pUsers.id) {
                userOptions.push({
                    label: `${pUsers.username} ${pUsers.organization.name}`,
                    userName: pUsers.username,
                    organizationName: pUsers.organization.name,
                    value: pUsers.id,
                })
                const ifExists = organizatoinOptions.find((org) => org.label == pUsers.organization.name)
                if (!ifExists) {
                    organizatoinOptions.push({ label: pUsers.organization.name, value: pUsers.organization.id })
                }
            }
        })

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: 35,
            height: 35,
            fontSize: 14,
            color: '#6e707e',
            borderRadius: 3,
        }),
    }

    const setaddDatePicker = async (event, picker) => {
        setTimeSelectorFilter('')
        timeFilter = ''
        const startDate = moment(picker.startDate).format('YYYY-MM-DD HH:mm:ss')
        const endDate = moment(picker.endDate).format('YYYY-MM-DD HH:mm:ss')
        setDatetime({
            start: startDate,
            end: endDate,
            updated: true,
        })
        _fetchEventsJob(project_id, user_id, organization_id, eventId, created_by, startDate, endDate, searchText, searchEventId, eventName)
    }

    const onDateMonthChange = async (filterBy) => {
        if (filterBy != '0') {
            await setTimeSelectorFilter(filterBy)
            timeFilter = filterBy
            await getGroupedData(eventType, filterBy)
        } else {
            await setTimeSelectorFilter('')
            timeFilter = ''
        }
    }

    const MenuList = (props) => {
        const style = selectedAll ? { color: 'black', textDecoration: 'none' } : { color: '#666', textDecoration: 'none' }
        return (
            <components.MenuList {...props}>
                <div className='px-3'>
                    <div className='d-flex'>
                        <a
                            style={selectedMenu == 'showEvents' ? { color: 'black', textDecoration: 'none', fontWeight: 'bold', top: 12 } : { color: '#666', textDecoration: 'none', top: 12 }}
                            href='#'
                            className='position-relative py-2'
                            onClick={(event) => {
                                event.preventDefault()
                                setselectedMenu('showEvents')
                                setIsShowHiddenEvents(true)
                            }}
                        >
                            {string.showEvents}
                        </a>
                    </div>
                    <div className='d-flex'>
                        <a
                            style={selectedMenu == 'hideEvents' ? { color: 'black', textDecoration: 'none', fontWeight: 'bold', top: 12 } : { color: '#666', textDecoration: 'none', top: 12 }}
                            href='#'
                            className='position-relative py-2'
                            onClick={(event) => {
                                event.preventDefault()
                                setselectedMenu('hideEvents')
                                setIsShowHiddenEvents(false)
                            }}
                        >
                            {string.hideEvent}
                        </a>
                    </div>
                </div>

                <div className='d-flex p-3 mt-2 justify-content-between'>
                    <div className='show-hide'>
                        <a
                            style={style}
                            href='#'
                            className={`mr-2  ${selectedMenu == 'showEvents' && 'disabled'}`}
                            onClick={(event) => {
                                event.preventDefault()
                                if (selectedMenu != 'showEvents') setCheckTrue(true)
                                setselectedMenu('')
                            }}
                        >
                            {string.selectAll}
                        </a>
                        <span>|</span>
                        <a
                            style={deselectedAll ? { color: 'black', textDecoration: 'none' } : { color: '#666', textDecoration: 'none' }}
                            href='#'
                            className='ml-2'
                            onClick={(event) => {
                                event.preventDefault()
                                setCheckTrue(false)
                                if (!selectedMenu) {
                                    setselectedMenu('showEvents')
                                }
                            }}
                        >
                            {string.deselectAll}
                        </a>
                    </div>
                    <Button className='btnresponsive' onClick={hideEvents}>
                        {string.notificationSettings.applyBtn}
                    </Button>
                </div>
            </components.MenuList>
        )
    }

    useEffect(() => {
        let searchTimeOut
        if (isChanged) {
            let eventIds = []
            if (searchText) {
                const eventsArr = categoryEvents.filter((event) => {
                    if (event.eventName.search(new RegExp(searchText, 'i')) >= 0) {
                        return true
                    }
                })
                eventIds = eventsArr.map((event) => event.uniqId)
                setSearchEventId(eventIds)
            }
            _fetchEventsJob(project_id, user_id, organization_id, eventId, created_by, datetime.start, datetime.end, searchText, eventIds, eventName)
            searchTimeOut = setTimeout(() => _fetchEvents(), 1000)
        }
        return () => {
            if (searchTimeOut) {
                clearTimeout(searchTimeOut)
            }
        }
    }, [searchText])

    return (
        <>
            <div key='event-component-filter' className='show-hide-popup'>
                {/* event-filter-sticky */}
                <div className='event-filter'>
                    <div className='d-flex flex-wrap'>
                        <EventFilters project={projectSelections} refetchProjectSelection={refetchProjectSelection} user={user} showQrCode='show' showGroupQrCode />
                    </div>
                    <div className='d-flex flex-wrap mt-3 event-filter'>
                        <div className='col-md-3 mr-0'>
                            <Select
                                options={advanceSearchOptions}
                                styles={customStyles}
                                value={advanceFilterSelection}
                                onChange={(selectedOption) => {
                                    if (selectedOption.value == 'clearFilter') {
                                        setDatetime({
                                            start: null,
                                            end: null,
                                            updated: false,
                                        })
                                        onDateMonthChange('0')
                                        setOrganizationId('')
                                        setCreatedBy('')
                                        setEventId('')
                                        setEventName('')
                                        setSearchText('')
                                        setCheckTrue(false)
                                        setSelectedPDCName('')
                                        setAdvanceFilterSelection(advanceSearchOptions[1])
                                        return
                                    }
                                    setShowHiddenEvents(selectedOption.value == 'hideEvents')
                                    if (selectedOption.value == 'eventDateRange' && !datetime.updated) {
                                        setDatetime({ updated: false, start: moment().subtract(30, 'days').format('YYYY-MM-DD HH:mm:ss'), end: moment().endOf('day').format('YYYY-MM-DD HH:mm:ss') })
                                    } else if (!datetime.updated) {
                                        // setDatetime({
                                        //     start: null,
                                        //     end: null,
                                        //     updated: false,
                                        // })
                                    }
                                    setAdvanceFilterSelection(selectedOption)
                                }}
                            />
                        </div>
                        {advanceFilterSelection.value == 'eventDateRange' && (
                            <div className='col-md-3 pl-0'>
                                <DateRangePicker initialSettings={{ startDate: `${moment(datetime.start).format('MM/DD/YYYY')}`, endDate: `${moment(datetime.end).format('MM/DD/YYYY')}` }} onApply={setaddDatePicker}>
                                    <input type='text' className='form-control mr-2' />
                                </DateRangePicker>
                            </div>
                        )}
                        {advanceFilterSelection.value == 'timelineSeparator' && (
                            <div className='col-md-3 pl-0'>
                                <CustomSelect className='form-control' value={timeSelectorFilter} onChange={(event) => onDateMonthChange(event.target.value)}>
                                    <option value='0'>{string.timelineSelector}</option>
                                    <option value='day'>{string.timelineSelectorday}</option>
                                    <option value='week'>{string.timelineSelectorweek}</option>
                                    <option value='month'>{string.timelineSelectormonth}</option>
                                </CustomSelect>
                            </div>
                        )}
                        {advanceFilterSelection.value == 'eventOrganization' && (
                            <div className='col-md-3 pl-0'>
                                <Select
                                    defaultValue={{ label: string.participant.showForAllOrganizations, userName: string.participant.showForAllOrganizations, organizationName: '', value: '' }}
                                    options={organizatoinOptions.length > 1 ? organizatoinOptions : []}
                                    styles={customStyles}
                                    onChange={(event) => {
                                        setOrganizationId(event.value)
                                        setCreatedBy('')
                                        setEventName('')
                                        setSelectedPDCName('')
                                        setDatetime({
                                            start: null,
                                            end: null,
                                            updated: false,
                                        })
                                        _fetchEventsJob(project_id, user_id, event.value, eventId, created_by, datetime.start, datetime.end, searchText, searchEventId, eventName)
                                    }}
                                />
                            </div>
                        )}
                        {advanceFilterSelection.value == 'eventUser' && (
                            <div className='col-md-3 pl-0'>
                                <Select
                                    defaultValue={{ label: string.participant.showForAllUsers, userName: string.participant.showForAllUsers, organizationName: '', value: '' }}
                                    options={userOptions.length > 1 ? userOptions : []}
                                    styles={customStyles}
                                    onChange={(event) => {
                                        setCreatedBy(event.value)
                                        setOrganizationId('')
                                        setEventName('')
                                        setSelectedPDCName('')
                                        setDatetime({
                                            start: null,
                                            end: null,
                                            updated: false,
                                        })
                                        _fetchEventsJob(project_id, user_id, organization_id, eventId, event.value, datetime.start, datetime.end, searchText, searchEventId, eventName)
                                    }}
                                    formatOptionLabel={function (data) {
                                        return (
                                            <>
                                                <span style={{ color: data.value ? '#ED8931' : '#333333' }}>{data.userName}</span> <span style={{ color: '#a56233' }}>{data.organizationName}</span>
                                            </>
                                        )
                                    }}
                                />
                            </div>
                        )}
                        {advanceFilterSelection.value == 'eventAndDocuments' && (
                            <div className='col-md-3 pl-0'>
                                <Select
                                    styles={customStyles}
                                    defaultValue={{ label: string.showAllEvents, value: 0 }}
                                    className='selectOptions'
                                    options={eventoptions}
                                    onChange={(event) => {
                                        setEventName(event.value)
                                        setEventId(event.id)
                                        _fetchEventsJob(project_id, user_id, organization_id, event.id, created_by, datetime.start, datetime.end, searchText, searchEventId, event.value)
                                    }}
                                />
                            </div>
                        )}
                        {advanceFilterSelection.value == 'allContent' && (
                            <div className='col-md-3 pl-0'>
                                <input className='form-control' value={searchText} onChange={(e) => setSearchText(e.target.value)} type='search' placeholder={advanceFilterSelection.label} />
                            </div>
                        )}
                        {advanceFilterSelection.value == 'hideEvents' && (
                            <div className='col-md-3 pl-0'>
                                <Select defaultValue={{ label: string.event.hideEvents, value: '' }} options={[]} styles={customStyles} menuIsOpen={menuIsOpen} onMenuOpen={() => SetMenuIsOpen(true)} onMenuClose={() => SetMenuIsOpen(false)} components={{ MenuList }} />
                            </div>
                        )}
                        {advanceFilterSelection.value == 'searchByPDC' && (
                            <div className='col-md-3 pl-0'>
                                <Select
                                    styles={customStyles}
                                    defaultValue={{ label: string.showAllPDCs, value: 0 }}
                                    className='selectOptions'
                                    options={pdcCategoryList.length > 1 ? pdcCategoryList : []}
                                    onChange={(event) => {
                                        setSelectedPDCName(event)
                                        _fetchEventsJob(project_id, user_id, organization_id, eventId, created_by, datetime.start, datetime.end, searchText, searchEventId, eventName)
                                    }}
                                />
                            </div>
                        )}
                        {!project?.is_completed && (
                            <>
                                <Button className='btn btn-primary large-btn' onClick={_toggleEvent}>
                                    {string.submitEvent}
                                </Button>
                                <Button className='btn btn-primary large-btn' onClick={_toggleDocument}>
                                    {string.event.submitDocument}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default EventFilterComponent
