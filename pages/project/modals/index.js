import React from 'react'
import { Modal, ModalHeader, ModalBody, Spinner } from 'reactstrap'
import Button from '../../../components/common/form-elements/button/Button'
import string from '../../../utils/LanguageTranslation.js'
import DeleteModal from './DeleteModal'
import CompleteModal from './CompleteModal'
import ToggleModal from './ToggleModal.js'
import AddProjectStepOne from './AddProjectStepOne'
import AddProjectStepTwo from './AddProjectStepTwo.jsx'
import AddProjectStepThree from './AddProjectStepThree'
import RestoreModal from './RestoreModal'

const Modals = ({
    onDeleteEntry = () => {},
    deleteOpen = false,
    isDeleting,
    onRestoreEntry = () => {},
    restoreOpen = false,
    isRestore,
    toggleRestore = () => {},
    toggleDelete = () => {},
    completeOpen = false,
    toggleComplete = () => {},
    onCompleteProject = () => {},
    isActive,
    onToggleStatus = () => {},
    toggleOpen = false,
    toggleStatus = () => {},
    currentStep,
    _toggleStep = () => {},
    modalClass,
    isEdit,
    state,
    setState = () => {},
    user,
    setProjectData = () => {},
    allProjects,
    project_id,
    saveProject = () => {},
    showdraftmodal,
    toggleDraftModal = () => {},
    checkprojectdata,
    handleProjectChange = () => {},
    saveprojectData = () => {},
    isLoading,
    modalTitle,
    deleteMode,
    isReadOnly,
}) => {
    return (
        <>
            <div className='modal fade customModal document' id='deleteModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                <DeleteModal onDeleteEntry={onDeleteEntry} isOpen={deleteOpen} isDeleting={isDeleting} toggleDelete={toggleDelete} deleteMode={deleteMode} />
            </div>
            <div>
                <RestoreModal onRestoreEntry={onRestoreEntry} isOpen={restoreOpen} isRestore={isRestore} toggleRestore={toggleRestore} />
            </div>
            <div className='modal fade customModal document' id='completeModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                <CompleteModal onCompleteProject={onCompleteProject} isOpen={completeOpen} toggleComplete={toggleComplete} isLoading={isLoading} />
            </div>

            <div className='modal fade customModal document' id='toggleModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                <ToggleModal isActive={isActive} onToggleStatus={onToggleStatus} isOpen={toggleOpen} toggleStatus={toggleStatus} />
            </div>

            {currentStep > 0 && (
                <Modal isOpen={currentStep > 0} toggle={() => _toggleStep(0)} size={'lg'} className={modalClass} id='projectModal'>
                    <ModalHeader toggle={() => _toggleStep(0)} cssModule={{ 'modal-title': 'modal-title text-dark font-weight-bold' }} id='addProjectStepTwoModal'>
                        {modalTitle} ({currentStep}/3)
                    </ModalHeader>
                    <ModalBody>
                        {currentStep === 1 ? (
                            <AddProjectStepOne mode={isEdit ? 'edit' : 'add'} setState={setState} state={state} user={user} changeStep={_toggleStep} setProjectData={setProjectData} allProjects={allProjects} />
                        ) : currentStep === 2 ? (
                            <AddProjectStepTwo isReadOnly={isReadOnly} mode={isEdit ? 'edit' : 'add'} setState={setState} state={state} changeStep={_toggleStep} project_id={project_id} />
                        ) : currentStep === 3 ? (
                            <AddProjectStepThree isReadOnly={isReadOnly} mode={isEdit ? 'edit' : 'add'} setState={setState} state={state} changeStep={_toggleStep} saveProject={saveProject} project_id={project_id} />
                        ) : null}
                    </ModalBody>
                </Modal>
            )}

            {showdraftmodal > 0 && (
                <Modal isOpen={showdraftmodal > 0} toggle={toggleDraftModal} size={'md'} className={modalClass} id='projectModal'>
                    <ModalHeader toggle={toggleDraftModal} cssModule={{ 'modal-title': 'modal-title text-dark font-weight-bold' }} id='addProjectStepTwoModal'>
                        {string.project.updatetemplateModal}
                    </ModalHeader>
                    <ModalBody>
                        <>
                            <div className='row'>
                                <div className='col'>
                                    <input className='shiment-name' type='radio' name='saveprojectdata' checked={checkprojectdata == 'updateprojectdata' ? true : false} value='updateprojectdata' onChange={handleProjectChange} /> {string.project.updatetemplateship}
                                </div>
                                <div className='col'>
                                    <input type='radio' className='shiment-name' name='saveprojectdata' checked={checkprojectdata == 'saveprojectdata' ? true : false} value='saveprojectdata' onChange={handleProjectChange} /> {string.project.savetemplateship}
                                    <br />
                                </div>
                            </div>
                            <div className='col-md-12 text-center btnmodaldraftsect'>
                                <Button type='submit' className='btn btn-primary save-btn-width' onClick={saveprojectData}>
                                    {isLoading ? <Spinner size={'sm'} /> : string.submitBtnTxt}
                                </Button>
                            </div>
                        </>
                    </ModalBody>
                </Modal>
            )}
        </>
    )
}

export default Modals
