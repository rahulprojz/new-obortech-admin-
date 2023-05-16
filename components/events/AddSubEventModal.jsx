import React, { useState } from 'react'
import { Modal, ModalBody, ModalHeader, ModalFooter } from 'reactstrap'
import LoaderButton from '../common/form-elements/button/LoaderButton'

import string from '../../utils/LanguageTranslation.js'
import AddedSubEventsList from './AddedSubEventsList'
import SubEventList from './SubEventList'

const AddSubEventsModal = ({ title, filteredEvents, isOpen, toggleModal, availableSubEvents, updateSubEvents }) => {
    const [subEvents, setSubEvents] = useState([...availableSubEvents])
    const [isLoading, setIsLoading] = useState(false)
    const bounceClass = (event) => {
        let bounceClassName = 'bg-black black-fill'

        // Document events
        if (event?.eventType == 'document') {
            bounceClassName = 'bg-yellow'
        }

        return bounceClassName
    }

    const addToSubEvent = (event) => {
        const subEventsArray = [...subEvents]
        subEventsArray.push(event)
        setSubEvents([...subEventsArray])
    }

    const onSubmit = () => {
        updateSubEvents([...subEvents])
        toggleModal()
        setIsLoading(false)
    }

    const removeFromSubEvent = (event) => {
        const subEventsArray = [...subEvents]
        const index = subEventsArray.findIndex((ev) => ev._id == event._id)
        if (index > -1) {
            subEventsArray.splice(index, 1)
        }
        setSubEvents([...subEventsArray])
    }

    const badge = (
        <span>
            {string.submitBtnTxt}{' '}
            <span style={{ top: '4px' }} className={subEvents.length > 0 ? 'badge badge-danger badge-counter ml-1' : 'd-none'}>
                {' '}
                {subEvents.length}{' '}
            </span>
        </span>
    )

    return (
        <Modal className='customModal document modal-xl' isOpen={isOpen} toggle={toggleModal} id='documentModal'>
            <ModalHeader toggle={toggleModal} cssModule={{ 'modal-title': 'modal-title text-dark font-weight-bold' }}>
                {title == 'EVENTS' ? string.selectSubEvents : string.selectSubDocument}
            </ModalHeader>
            <ModalBody>
                <div className='border sub-event-container'>
                    {filteredEvents?.length > 0 && filteredEvents.map((event) => ![...availableSubEvents, ...subEvents].some((sEvent) => event._id == sEvent._id) && <SubEventList event={event} bounceClass={bounceClass} onClickAction={addToSubEvent} isAdd />)}
                </div>
                {subEvents.length > 0 && (
                    <div className='mt-3'>
                        <AddedSubEventsList title={title} subEvents={subEvents} removeFromSubEvent={removeFromSubEvent} />
                    </div>
                )}
            </ModalBody>
            <ModalFooter className='text-center '>
                <button className='btn btn-secondary large-btn' onClick={toggleModal}>
                    {string.back}
                </button>
                <LoaderButton cssClass='btn btn-primary large-btn' 
                              text={badge} 
                              onClick={(e)=>{
                                setIsLoading(true);
                                onSubmit(e);
                              }} 
                              isLoading={isLoading}/>
            </ModalFooter>
        </Modal>
    )
}

export default AddSubEventsModal
