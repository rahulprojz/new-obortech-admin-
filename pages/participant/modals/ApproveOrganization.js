import React from 'react'
import { Modal, ModalBody, ModalHeader } from 'reactstrap'
import string from '../../../utils/LanguageTranslation.js'
import { ProgressBar, Step } from 'react-step-progress-bar'
import 'react-step-progress-bar/styles.css'
import LoaderButton from "../../../components/common/form-elements/button/LoaderButton";

const ApproveOrganization = (props) => {
    const progressBar = () => {
        const getStepContent = () => {
            let stepContent = []
            for (let index = 0; index < 7; index++) {
                stepContent.push(<Step transition='scale'>{({ accomplished }) => <div className={`indexedStep ${accomplished ? 'accomplished' : null}`}></div>}</Step>)
            }
            return stepContent
        }
        return <ProgressBar percent={props.progressBarPercent}>{getStepContent()}</ProgressBar>
    }

    return (
        <Modal isOpen={props.openApprove} toggle={props.toggleApprove} className='customModal'>
            {props.approvalInProgress ? <ModalHeader></ModalHeader> : <ModalHeader toggle={props.toggleApprove}></ModalHeader>}
            {!props.errorInApproval && !props.approvalCompleted ? (
                <ModalBody className='text-center mb-5'>
                    <p>
                        <strong>{props.approvemsg}</strong>
                    </p>
                    {props.approvalInProgress ? (
                        progressBar()
                    ) : (
                        <LoaderButton
                            cssClass='btn btn-primary large-btn'
                            data-dismiss='modal'
                            type='button'
                            isLoading={props.isLoading}
                            onClick={props.handleApprove}
                            text={string.approveBtn}
                        />
                    )}
                </ModalBody>
            ) : (
                <ModalBody className='text-center mb-5'>
                    {props.errorInApproval ? (
                        <p>
                            <strong>
                                <h3>
                                    <i className='fa fa-exclamation-triangle' aria-hidden='true' />
                                </h3>
                            </strong>
                            <h5>
                                {props.approvalErrorMsg[0]} <br /> {props.approvalErrorMsg[1]}
                            </h5>
                        </p>
                    ) : (
                        <p>
                            <strong>
                                <h3>
                                    <i className='fa fa-check green-text' aria-hidden='true' />
                                </h3>
                            </strong>
                            <h5> {string.participant.participantApproveSuccess} </h5>
                        </p>
                    )}
                </ModalBody>
            )}
        </Modal>
    )
}

export default ApproveOrganization
