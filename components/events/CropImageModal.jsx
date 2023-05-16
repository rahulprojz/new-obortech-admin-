import React from 'react'
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'

import ImageCrop from '../imageCrop'

const CropImageModal = ({ isOpen, toggle, onToggle, getBlob, image, fileName, onCancelClick, onSaveClick }) => {
    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal document modal-lg' id='documentModal'>
            <ModalHeader toggle={onToggle}>
                <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    CROP IMAGE
                </h5>
            </ModalHeader>
            <ModalBody>
                <ImageCrop getBlob={getBlob} inputImg={image} fileName={fileName || ''} />
            </ModalBody>
            <ModalFooter>
                <button className='btn btn-secondary' onClick={onCancelClick}>
                    Cancel
                </button>
                <button className='btn btn-primary' onClick={onSaveClick}>
                    Save
                </button>
            </ModalFooter>
        </Modal>
    )
}

export default CropImageModal
