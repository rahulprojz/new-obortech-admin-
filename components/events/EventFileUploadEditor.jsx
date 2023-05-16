import React from 'react'
import dynamic from 'next/dynamic'
import { Modal, ModalBody } from 'reactstrap'

import Loader from '../common/Loader'

const FilerobotImageEditor = dynamic(() => import('react-filerobot-image-editor'), {
    ssr: false,
})
const EventFileUploadEditor = ({ show, changeEditImage, event_file, setShow, editImage }) => {
    if (show)
        return (
            <Modal isOpen={show} className='customModal modal-lg' style={{ width: 900 }} backdrop>
                <ModalBody>
                    <div className='file-robort-modal'>
                        {!editImage && <Loader />}
                        {editImage && (
                            <>
                                <FilerobotImageEditor
                                    source={editImage}
                                    closeAfterSave
                                    defaultSavedImageName={event_file.name}
                                    avoidChangesNotSavedAlertOnLeave
                                    onSave={(editedImageObject, designState) => changeEditImage(editedImageObject, designState)}
                                    onClose={() => setShow(false)}
                                    onBeforeSave={() => false}
                                    tabsIds={['Adjust']} // or {['Adjust', 'Annotate', 'Watermark']}
                                    defaultTabId='Adjust' // or 'Annotate'
                                    defaultToolId='Crop' // or 'Text'
                                    theme={{
                                        palette: {
                                            'bg-primary-active': '#ECF3FF',
                                            'bg-secondary': '#ffffff',
                                        },
                                        typography: {
                                            fontFamily: 'Roboto, Arial',
                                        },
                                    }}
                                />
                            </>
                        )}
                    </div>
                </ModalBody>
            </Modal>
        )

    return null
}

export default EventFileUploadEditor
