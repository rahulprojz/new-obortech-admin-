import React from 'react'
import TimePicker from 'rc-time-picker'
import moment from 'moment'
import string from '../../utils/LanguageTranslation'
import 'rc-time-picker/assets/index.css'

const DateCustomInput = React.forwardRef(({ value, onClick, onChange }, ref) => {
    return (
        <input
            name='custom-input'
            className='text-left'
            autoComplete='off'
            placeholder={string.event.setEventDueDate}
            style={{ width: '100%', borderWidth: 0, backgroundColor: 'white' }}
            onClick={(e) => {
                e.preventDefault()
                onClick()
            }}
            ref={ref}
            value={value}
            onChange={(date) => onChange(date)}
        />
    )
})
export const CustomTimeInput = ({ date, onChangeCustom }) => {
    const dateObj = moment(date)
    const value = dateObj.isValid() ? moment(date) : moment()

    return <TimePicker showSecond defaultValue={value} className='due-date-time-picker' onChange={(event) => onChangeCustom(date, event?.format('HH:mm:ss'))} />
}

export default DateCustomInput
