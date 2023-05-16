import React from 'react'
import { Popover, OverlayTrigger, Button } from 'react-bootstrap'
import string from '../../utils/LanguageTranslation'
import { otherLanguage } from '../../utils/selectedLanguage'

const ShowHidePopup = (props) => {
    const { setCheckTrue, filteredEvent, visible } = props
    const userEvents = filteredEvent.map((val) => val.val.filter((ev) => ev?.project_event?.event?.eventType !== 'alert'))
    const selectedAll = userEvents.every((val) => val.every((ev) => ev?.project_event?.checked))
    const deselectedAll = userEvents.every((val) => val.every((ev) => !ev?.project_event?.checked))
    //  this section was hidded from the view
    return (
        <div className='vertical-timeline-item vertical-timeline-element mb-0 mt-3' style={{ visibility: visible }}>
            <div className='events-popover'>
                <span className='vertical-timeline-element-date invisible' />
                <span className='vertical-timeline-element-icon bounce-in invisible'>
                    <i className='badge badge-dot badge-dot-xl bg-black black-fill'> </i>
                </span>
                <div className='vertical-timeline-element-content row'>
                    <div className='list-content col-sm-8 pl-0 m-0 invisible' />
                    <div className='col-sm-4'>
                        <OverlayTrigger
                            trigger='click'
                            placement='right'
                            rootClose
                            overlay={
                                <Popover style={{ zIndex: '1' }} id={otherLanguage ? 'base-local-popover' : 'base-popover'}>
                                    <Popover.Content>
                                        <div style={{ color: 'black' }}>
                                            <OverlayTrigger
                                                trigger='click'
                                                placement='bottom'
                                                rootClose
                                                overlay={
                                                    <Popover style={{ zIndex: '1' }} id={otherLanguage ? 'for-local-eye' : 'for-eye'}>
                                                        <Popover.Content>
                                                            <div style={{ color: 'black' }}>
                                                                <div style={{ margin: '0px 76px 16px 0px' }}>
                                                                    <b>{string.showEvents}</b>
                                                                </div>
                                                                <div className='row'>
                                                                    <div className='col-6 p-0'>
                                                                        <a
                                                                            style={selectedAll ? { color: 'black', textDecoration: 'none' } : { color: '#666', textDecoration: 'none' }}
                                                                            href='#'
                                                                            onClick={(event) => {
                                                                                event.preventDefault()
                                                                                setCheckTrue(true)
                                                                            }}
                                                                        >
                                                                            {string.selectAll}
                                                                        </a>
                                                                        <br />
                                                                        <a
                                                                            style={deselectedAll ? { color: 'black', textDecoration: 'none' } : { color: '#666', textDecoration: 'none' }}
                                                                            href='#'
                                                                            onClick={(event) => {
                                                                                event.preventDefault()
                                                                                setCheckTrue(false)
                                                                            }}
                                                                        >
                                                                            {string.deselectAll}
                                                                        </a>
                                                                    </div>
                                                                    <Button style={{ fontSize: '14px', height: '30px' }} className={`py-1 px-3 ${otherLanguage ? 'mt-3' : 'mt-2'}`}>
                                                                        {string.notificationSettings.applyBtn}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </Popover.Content>
                                                    </Popover>
                                                }
                                            >
                                                <i className='fas fa-eye mr-3 cursor-pointer' />
                                            </OverlayTrigger>
                                            <i className='fas fa-upload cursor-pointer' />
                                        </div>
                                    </Popover.Content>
                                </Popover>
                            }
                        >
                            <div className='events-popover-toggle' style={{ color: '#666', fontSize: '20px' }}>
                                <i className='fas fa-ellipsis-h cursor-pointer' />
                            </div>
                        </OverlayTrigger>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ShowHidePopup
