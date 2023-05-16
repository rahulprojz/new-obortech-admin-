import React, { useState } from 'react'
import { Modal, ModalBody, ModalHeader } from 'reactstrap'
import string from '../../utils/LanguageTranslation.js'
import './profile.css'
import '../../static/css/modal.css'
import NProgress from 'nprogress'
import notify from '../../lib/notifier'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import { callNetworkApi } from '../../lib/api/network-api'
import { addDataRequest } from '../../lib/api/user-data-request'
import { v4 as uuidv4 } from 'uuid'

function DeleteAccount(props) {
    const { userData, openConfirmModal, toggleDeleteAcc, cookies } = props
    const [isLoading, setIsLoading] = useState(false)

    const _handleDeleteAccount = async () => {
        NProgress.start()
        setIsLoading(true)

        try {
            //Get controller
            const controllerReqObj = {
                orgName: 'obortech',
                userName: 'oboadmin',
            }
            const controllerResponse = await callNetworkApi(cookies.cookies.authToken, 'get-controller', controllerReqObj)
            if (!controllerResponse.success) {
                throw controllerResponse.error
            }

            //Get policy by purpose
            const policyReqObj = {
                purpose: 'erasure',
            }
            const policyResponse = await callNetworkApi(cookies.cookies.authToken, 'get-policy', policyReqObj, false, {}, 'GET')

            if (!policyResponse.success) {
                throw policyResponse.error
            }

            const uuid = uuidv4().split('-')
            const req_uniq_id = uuid[0].toUpperCase()

            //Create user data request
            const requestObj = {
                processorid: '',
                userid: userData.unique_id,
                purpose: 'erasure',
                validity: policyResponse.data.validity,
                status: 'open',
                status_desc: 'Requested to delete account',
                requestUniqId: req_uniq_id,
                is_delete_request: 1,
            }

            const createRequestResponse = await callNetworkApi(cookies.cookies.authToken, 'create-data-request', requestObj)
            if (!createRequestResponse.success) {
                throw createRequestResponse.error
            }

            const userDataRequest = await addDataRequest({
                ...requestObj,
                controller_id: controllerResponse.data.controllerID,
                request_txn_id: createRequestResponse.data,
                policy: policyResponse.data,
            })

            if (userDataRequest.error) {
                throw userDataRequest.error
            }

            notify(string.userDataRequest.deleteRequestAdded)
            setOpenConfirmModal(false)
        } catch (err) {
            notify(err.message || err.toString())
        }

        NProgress.done()
        setIsLoading(false)
    }

    return (
        <Modal isOpen={openConfirmModal} toggle={toggleDeleteAcc} className='customModal'>
            <ModalHeader toggle={() => toggleDeleteAcc()}></ModalHeader>
            <ModalBody className='modal-body text-center mb-5'>
                <p>
                    <strong>{string.confirmDeleteAccount}</strong>
                </p>
                <LoaderButton cssClass='btn btn-primary large-btn' type='submit' onClick={_handleDeleteAccount} isLoading={isLoading} text={string.deleteBtnTxt} />
            </ModalBody>
        </Modal>
    )
}
export default DeleteAccount
