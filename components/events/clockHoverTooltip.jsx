import { Tooltip } from 'reactstrap'

const ClockHoverTooltip = ({ id, openTooltip, setOpenTooltip = () => {}, actionTime, dateDiffText, isPastDate }) => {
    return (
        <Tooltip isOpen={openTooltip} placement='top' placementPrefix={'clock-hover bs-tooltip'} target={`action-date-${id}`} toggle={() => setOpenTooltip(!openTooltip)}>
            <div className='obt-clock-hover-tb w-100 p-2'>
                <span className='font-weight-bold m-1'>Action date</span>
                <span className='pr-1 pl-1'>{actionTime}</span>
                <span className={`font-weight-bold ${isPastDate ? 'date-diff-span-past' : 'date-diff-span'}  m-1`}>{dateDiffText}</span>
            </div>
        </Tooltip>
    )
}

export default ClockHoverTooltip
