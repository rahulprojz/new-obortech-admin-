import Select from 'react-select'
import DateRangePicker from 'react-bootstrap-daterangepicker'
import moment from 'moment-timezone'
import CustomSelect from '../../components/common/form-elements/select/CustomSelect'
import string from '../../utils/LanguageTranslation.js'

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

const Filters = ({ datetime, setDatetime, searchText, timeselectorfilter, advanceSearchOptions, advanceFilterSelection, eventoptions, setAdvanceFilterSelection, setaddDatePicker, setOrganizationId, setCreatedBy, eventParticipantFilters, handleInputChange, ondatemonthchange, setEventCategory,setEventName }) => {
    const organizatoinOptions = [{ label: string.participant.showForAllOrganizations, value: '' }]
    const userOptions = [{ label: string.participant.showForAllUsers, value: '' }]

    eventParticipantFilters?.length > 0 &&
        eventParticipantFilters.map((pusers) => {
            if (pusers.id) {
                userOptions.push({
                    label: `${pusers.username} ${pusers.organization.name}`,
                    userName: pusers.username,
                    organizationName: pusers.organization.name,
                    value: pusers.id,
                })
                const ifExists = organizatoinOptions.find((org) => org.label == pusers.organization.name)
                if (!ifExists) {
                    organizatoinOptions.push({ label: pusers.organization.name, value: pusers.organization.id })
                }
            }
        })

    return (
        <div className='row mt-3 pb-5 event-filter' style={{ justifyContent: 'center' }}>
            <div className='col-md-3 pl-0'>
                <CustomSelect
                    className='form-control'
                    value={advanceFilterSelection.value}
                    onChange={(selectedOption) => {
                        if (selectedOption.target.value == 'eventDateRange' && !datetime.updated) {
                            setDatetime({ updated: false, start: moment().subtract(30, 'days').format('YYYY-MM-DD HH:mm:ss'), end: moment().endOf('day').format('YYYY-MM-DD HH:mm:ss') })
                        } else if (!datetime.updated) {
                            setDatetime({
                                start: null,
                                end: null,
                                updated: false,
                            })
                        }
                        setAdvanceFilterSelection(advanceSearchOptions.find((option) => option.value === selectedOption.target.value))
                    }}
                >
                    {advanceSearchOptions.map((option) => (
                        <option value={option.value}>{option.label}</option>
                    ))}
                </CustomSelect>
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
                    <CustomSelect className='form-control' value={timeselectorfilter} onChange={(event) => ondatemonthchange(event)}>
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
                        defaultValue={{ label: string.participant.showForAllOrganizations, value: '' }}
                        options={organizatoinOptions.length > 1 ? organizatoinOptions : []}
                        styles={customStyles}
                        onChange={(event) => {
                            setOrganizationId(event.value)
                        }}
                    />
                </div>
            )}
            {advanceFilterSelection.value == 'eventUser' && (
                <div className='col-md-3 pl-0'>
                    <Select
                        defaultValue={{ label: string.participant.showForAllUsers, value: '' }}
                        options={userOptions.length > 1 ? userOptions : []}
                        styles={customStyles}
                        onChange={(event) => {
                            setCreatedBy(event.value)
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
                            setEventCategory(event.id)
                            setEventName(event.value)
                        }}
                    />
                </div>
            )}
            {advanceFilterSelection.value == 'allContent' && (
                <div className='col-md-3 pl-0'>
                    <input className='form-control' value={searchText} onChange={(e) => handleInputChange(e)} type='search' placeholder={advanceFilterSelection.label} />
                </div>
            )}
        </div>
    )
}

export default Filters
