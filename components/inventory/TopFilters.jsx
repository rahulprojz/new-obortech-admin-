import React, { useEffect, useState } from 'react'
import DateRangePicker from 'react-bootstrap-daterangepicker'
import moment from 'moment'
import 'bootstrap-daterangepicker/daterangepicker.css'

import { fetchCategory } from '../../lib/api/assets-categories.js'
import string from '../../utils/LanguageTranslation.js'
import AdvanceSelect from '../common/form-elements/select/AdvanceSelect'
import { otherLanguage } from '../../utils/selectedLanguage.js'

const searchOptions = [
    { value: 'inventoryDateRange', label: string.event.filterByDateRange },
    { value: 'assetCategory', label: string.inventory.filterByAssetCategory },
]

const TopFilters = ({ options, changeFilter }) => {
    const [filterSelection, setFilterSelection] = useState(searchOptions[1])


    const [datetime, setDatetime] = useState({
        start: null,
        end: null,
        updated: false,
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
        const startDate = moment(picker.startDate).format('YYYY-MM-DD HH:mm:ss')
        const endDate = moment(picker.endDate).format('YYYY-MM-DD HH:mm:ss')
        setDatetime({
            start: startDate,
            end: endDate,
            updated: true,
        })
        changeFilter({
            start: startDate,
            end: endDate,
        })
        // _fetchEventsJob(project_id, user_id, organization_id, eventId, created_by, startDate, endDate, searchText, searchEventId, eventName)
    }

    return (
        <>
            <div key='inventory-component-filter' className='inventory-component-filter'>
                {/* inventory-filter-sticky */}
                <div className='d-flex flex-wrap mt-3 inventory-top-filter'>
                    <div className='mr-0 filter'>
                        <AdvanceSelect
                            options={searchOptions}
                            styles={customStyles}
                            value={filterSelection}
                            onChange={(selectedOption) => {
                                if (selectedOption.value == 'inventoryDateRange' && !datetime.updated) {
                                    setDatetime({ updated: false, start: moment().subtract(30, 'days').format('YYYY-MM-DD HH:mm:ss'), end: moment().endOf('day').format('YYYY-MM-DD HH:mm:ss') })
                                }
                                setFilterSelection(selectedOption)
                            }}
                        />
                    </div>
                    {filterSelection.value == 'inventoryDateRange' && (
                        <div className='pl-0 filter'>
                            <DateRangePicker initialSettings={{ startDate: `${moment(datetime.start).format('MM/DD/YYYY')}`, endDate: `${moment(datetime.end).format('MM/DD/YYYY')}` }} onApply={setaddDatePicker}>
                                <input type='text' className='form-control mr-2' />
                            </DateRangePicker>
                        </div>
                    )}
                    {filterSelection.value == 'assetCategory' && (
                        <div className='pl-0 filter'>
                            <AdvanceSelect
                                defaultValue={{ label: string.inventory.showAllAssetCategory, value: '' }}
                                options={options.allByCategory}
                                styles={customStyles}
                                onChange={(event) => {
                                    changeFilter({ category: event.value })
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default TopFilters
