import { useState, useImperativeHandle } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'
import ProjectMap from './ProjectMap'
import Button from '../common/form-elements/button/Button'
import string from '../../utils/LanguageTranslation.js'

const MapGeofencing = ({ selectedRoad, allRoadsMapping, isOpen, onBack, onSubmit, listIndex, listItems, mapRef }) => {
    const paths = listItems[listIndex]?.pathArray || (selectedRoad.road_id && allRoadsMapping[selectedRoad.road_id] && allRoadsMapping[selectedRoad.road_id].paths ? JSON.parse(allRoadsMapping[selectedRoad.road_id].paths) || [] : [])
    const [drawingMode, setDrawingMode] = useState(paths.length ? 'draw-shape' : 'draw-circle')

    useImperativeHandle(mapRef, () => ({
        getDrawingMode: () => drawingMode,
    }))

    return (
        <Modal isOpen={isOpen} className='customModal modal-lg'>
            <ModalHeader toggle={() => onBack(selectedRoad)}>{string.setGeofencing}</ModalHeader>
            <ModalBody className='text-center'>
                <ProjectMap allRoadsMapping={allRoadsMapping} selectedRoad={selectedRoad} listIndex={listIndex} listItems={listItems} drawingMode={drawingMode} setDrawingMode={setDrawingMode} />
            </ModalBody>
            <ModalFooter>
                <Button className='btn btn-secondary large-btn' type='button' onClick={() => onBack(selectedRoad)}>
                    {string.onboarding.btn.back}
                </Button>
                <Button className='btn btn-primary large-btn' type='button' onClick={() => onSubmit(selectedRoad)}>
                    {string.submitBtnTxt}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

export default MapGeofencing
