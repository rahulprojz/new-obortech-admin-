import { useEffect, useState } from 'react'
import NProgress from 'nprogress'
import { v4 as uuidv4 } from 'uuid'
import { useCookies } from 'react-cookie'
import string from '../../utils/LanguageTranslation.js'
import Button from '../../components/common/form-elements/button/Button'
import AddModal from './models/AddModal'
import ViewUser from './models/ViewUser'
import ViewOrganization from './models/ViewOrganization'
import ConfirmationModal from './models/ConfirmationModal'
import DeleteModal from '../../components/common/DeleteModal'
import { fetchUsersAll } from '../../lib/api/user'
import { fetchAllPurpose } from '../../lib/api/purpose'
import { sanitize } from '../../utils/globalFunc'
import withAuth from '../../lib/withAuth'
import { fetchDataRequests, addDataRequest, changeRequestStatus, deleteDataRequest } from '../../lib/api/user-data-request'
import { getOrg } from '../../lib/api/organization'
import notify from '../../lib/notifier'
import { callNetworkApi } from '../../lib/api/network-api'
import List from './list'
import { INITIAL_PAGINATION_STATE } from '../../shared/constants'
import Pagination from '../../components/pagination'
import Loader from '../../components/common/Loader'
import { approveOrg } from '../../lib/api/org-approval'

const { PAGE_SIZE } = process.env

function UserDataRequest(props) {
    const [paginationData, setPaginationData] = useState(INITIAL_PAGINATION_STATE)
    const [user, setUser] = useState(props.user || {})
    const [openAddModal, setOpenAddModal] = useState(false)
    const [openDeleteModal, setOpenDeleteModal] = useState(false)
    const [purpose, setPurpose] = useState([])
    const [users, setUsers] = useState([])
    const [openViewModal, setOpenViewModal] = useState(false)
    const [openViewOrgModal, setOpenViewOrgModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false)
    const [selectedRequest, setSelectedRequest] = useState('')
    const [confirmationType, setconfirmationType] = useState('')
    const [footerLoader, setFooterLoder] = useState(true)
    const [cookies, _] = useCookies(['authToken'])
    const isProcessor = !!(user.role_id == process.env.ROLE_MANAGER || user.role_id == process.env.ROLE_CEO || process.env.ROLE_SENIOR_MANAGER == user.role_id)
    const isAdmin = user.role_id == process.env.ROLE_ADMIN
    const isUser = user.role_id == process.env.ROLE_USER

    useEffect(() => {
        _fetchDataRequests()
        _fetchUsersPurposes()
    }, [])

    const _fetchDataRequests = async (page) => {
        const pageNo = page > -1 ? page : paginationData.pageNumber
        NProgress.start()
        try {
            // User data requests
            setIsLoading(true)
            setPaginationData(INITIAL_PAGINATION_STATE)
            const result = await fetchDataRequests({ user, limit: PAGE_SIZE, offset: pageNo * PAGE_SIZE })
            setFooterLoder(false)
            setIsLoading(false)
            setPaginationData({
                list: result.rows || [],
                pageNumber: pageNo,
                totalPages: Math.ceil(result.count / PAGE_SIZE),
                totalCount: result.count,
            })
        } catch (err) {
            setIsLoading(false)
            notify(err.message || err.toString())
        }
        NProgress.done()
    }
    const _fetchUsersPurposes = async () => {
        NProgress.start()
        try {
            // Users and purposes
            const userData = await fetchUsersAll()
            const user_arr = []
            const purpose_arr = []
            if (userData.length > 0) {
                userData.forEach((user) => {
                    user_arr.push({
                        label: `${user.username} (${user.email})`,
                        value: user.unique_id,
                    })
                })
            }

            const fetchallpurpose = await fetchAllPurpose()
            if (fetchallpurpose.length > 0) {
                fetchallpurpose.forEach((element) => {
                    purpose_arr.push({ label: element.purpose_value, value: element.purpose_key })
                })
            }
            setPurpose(purpose_arr)
            setUsers(user_arr)
        } catch (err) {
            notify(err.message || err.toString())
        }
        NProgress.done()
    }

    const _handleSubmit = async (formData) => {
        try {
            NProgress.start()
            setIsLoading(true)

            // Get organization
            const organization = await getOrg({
                id: user.organization_id,
            })

            // Get access token
            const accesstoken = cookies.authToken

            // Create/get processor
            const processorBodyObj = {
                userId: user.unique_id,
                orgName: sanitize(organization.blockchain_name),
            }
            const processorResponse = await callNetworkApi(accesstoken, 'create-processor', processorBodyObj)
            if (!processorResponse.success) {
                throw processorResponse.error
            }

            // Get controller
            const controllerReqObj = {
                orgName: 'obortech',
                userName: 'oboadmin',
            }
            const controllerResponse = await callNetworkApi(accesstoken, 'get-controller', controllerReqObj)
            if (!controllerResponse.success) {
                throw controllerResponse.error
            }

            // Get policy by purpose
            const policyReqObj = {
                purpose: formData.purpose,
            }
            const policyResponse = await callNetworkApi(accesstoken, 'get-policy', policyReqObj, false, {}, 'GET')
            if (!policyResponse.success) {
                throw policyResponse.error
            }

            const uuid = uuidv4().split('-')
            const req_uniq_id = uuid[0].toUpperCase()

            // Create user data request
            const requestObj = {
                processorid: processorResponse.data,
                userid: formData.user,
                purpose: formData.purpose,
                validity: policyResponse.data.validity,
                status: 'open',
                status_desc: 'User data requested',
                requestUniqId: req_uniq_id,
                is_delete_request: 0,
                orgName: sanitize(organization.name),
            }

            const createRequestResponse = await callNetworkApi(accesstoken, 'create-data-request', requestObj)
            if (!createRequestResponse.success) {
                throw createRequestResponse.error
            }

            const userDataRequest = await addDataRequest({
                requestObj,
                controller_id: controllerResponse.data.controllerID,
                request_txn_id: createRequestResponse.data,
                policy: policyResponse.data,
                request_from: 'user-data-request',
            })

            if (userDataRequest.error) {
                throw userDataRequest.error
            }

            _fetchDataRequests(0)
            notify(string.userDataRequest.dataRequestAdded)
            setOpenAddModal(false)
        } catch (err) {
            notify(err.message || err.toString())
        }

        NProgress.done()
        setIsLoading(false)
    }

    const _handleDelete = (request) => {
        setSelectedRequest(request)
        setOpenDeleteModal(true)
    }

    const _handleViewData = (request) => {
        setSelectedRequest(request)
        if (request.request_purpose.purpose_key == 'onboardingkyc') {
            setOpenViewOrgModal(true)
        } else {
            setOpenViewModal(true)
        }
    }

    const _handleRequestDelete = async () => {
        NProgress.start()
        setIsLoading(true)
        try {
            const response = await deleteDataRequest({
                id: selectedRequest.id,
            })
            if (response.error) {
                notify(response.error)
            } else {
                notify(string.userDataRequest.requestDeleted)
                await _fetchDataRequests(0)
                setOpenDeleteModal(false)
            }
        } catch (err) {
            notify(err.message || err.toString())
        }
        setIsLoading(false)
        NProgress.done()
    }

    const _toggleConfirmationModal = (confirmType, request) => {
        setOpenConfirmationModal(true)
        setSelectedRequest(request)
        setconfirmationType(confirmType)
    }

    const _handleRequestStatus = async () => {
        NProgress.start()
        setIsLoading(true)
        try {
            if (confirmationType === 'APPROVE') {
                if (!user.organization_id || !selectedRequest.user.organization_id) {
                    return
                }
                const { processor_id, user_id } = selectedRequest
                await approveOrg({
                    org_id: selectedRequest.user.organization_id,
                    approver_org_id: user.organization_id,
                    processor_id,
                    user_id,
                })
                notify(string.organization.orgApprovedSuccess)
            } else {
                let status = 'approved'
                let status_description = 'Data shared by user'
                let fromUser = 'data subject'
                const accesstoken = cookies.authToken

                let { approved_by_dc } = selectedRequest
                let { approved_by_ds } = selectedRequest
                let { rejected_by_dc } = selectedRequest
                let { rejected_by_ds } = selectedRequest

                // If approve, check current status of the request
                if (confirmationType == 'ACCEPT') {
                    if (isAdmin) {
                        fromUser = 'data controller'
                        approved_by_dc = 1
                        status_description = 'Request approved by data controller'
                    } else {
                        fromUser = 'data subject'
                        approved_by_ds = 1
                        status_description = 'Request approved by data subject'
                    }

                    // Delete request will be approved by data controller only
                    if (selectedRequest.status == 'open') {
                        status = selectedRequest.is_delete_request ? 'approved' : 'partially approved'
                    }
                    if (selectedRequest.status == 'in progress') {
                        status = 'approved'
                    }
                }

                // If reject
                if (confirmationType == 'REJECT') {
                    status = 'rejected'
                    if (isAdmin) {
                        fromUser = 'data controller'
                        rejected_by_dc = 1
                        status_description = 'Request rejected by data controller'
                    } else {
                        fromUser = 'data subject'
                        rejected_by_ds = 1
                        status_description = 'Request rejected by data subject'
                    }
                }

                //Delete user data if delete request
                if (isAdmin && selectedRequest.is_delete_request) {
                    const deleteReqObj = {
                        userId: selectedRequest.user.unique_id,
                    }

                    const deleteResponse = await callNetworkApi(accesstoken, 'remove-details', deleteReqObj)
                    if (!deleteResponse.success) {
                        throw deleteResponse.error
                    }
                }

                // Grant access to processor for data usage
                if (isUser) {
                    // Get policy by purpose
                    const policyReqObj = {
                        purpose: selectedRequest.request_purpose.purpose_key,
                    }
                    const policyResponse = await callNetworkApi(accesstoken, 'get-policy', policyReqObj, false, {}, 'GET')
                    if (!policyResponse.success) {
                        throw policyResponse.error
                    }

                    const accessObj = {
                        processor: {
                            type: 'processor',
                            userID: 'userID',
                            pubKey: 'pubKey',
                            permissions: ['permissions'],
                            orgName: 'orgName',
                        },
                        orgName: selectedRequest.user.organization.blockchain_name,
                        policyId: policyResponse.data.policyID,
                        dataRequestId: selectedRequest.request_txn_id,
                        requestUniqId: selectedRequest.request_id,
                    }

                    const grantAccessResponse = await callNetworkApi(accesstoken, 'grant-access', accessObj)
                    if (!grantAccessResponse.success) {
                        throw grantAccessResponse.error
                    }
                }

                // // If onboarding kyc request, no data contoller needed, so we will approve directly
                // if (selectedRequest.request_purpose.purpose_key == 'onboardingkyc') {
                //     if (status != 'rejected') status = 'approved'
                //     approved_by_dc = 1
                // }

                // Update user data request
                const requestObj = {
                    requestId: selectedRequest.request_txn_id,
                    status,
                    status_desc: status_description,
                    requestUniqId: selectedRequest.request_id,
                }

                const createRequestResponse = await callNetworkApi(accesstoken, 'update-data-request', requestObj)
                if (!createRequestResponse.success) {
                    throw createRequestResponse.error
                }

                // Update in mysql table
                const response = await changeRequestStatus({
                    id: selectedRequest.id,
                    fromUser,
                    status,
                    status_description,
                    approved_by_dc,
                    approved_by_ds,
                    rejected_by_dc,
                    rejected_by_ds,
                })
                if (response.error) {
                    throw response.error
                } else {
                    notify(string.userDataRequest.requestUpdated)
                }
            }
            await _fetchDataRequests(0)
            setOpenConfirmationModal(false)
        } catch (err) {
            notify(err.message || err.toString())
        }
        NProgress.done()
        setIsLoading(false)
    }

    return (
        <div>
            <div className='container-fluid'>
                <div className='row d-flex project-listing'>
                    <div className='tab-content w-100' id='myTabContent'>
                        <div className='tab-pane fade show active mt-3 w-100' id='user-data-requests' role='tabpanel' aria-labelledby='user-data-requests'>
                            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                                <h4 className='text-dark'>{string.userDataRequest.userDataRequestListing}</h4>
                                {isProcessor && (
                                    <Button className='btn btn-primary large-btn' data-toggle='modal' data-target='#userDataRequest' onClick={() => setOpenAddModal(true)}>
                                        {string.userDataRequest.requestUserListHeading}
                                    </Button>
                                )}
                            </div>
                            <div className='project-table-listing user-data-request-table table-responsive mt-2 w-100'>
                                <List isLoading={isLoading} paginationData={paginationData} user={user} handleDelete={_handleDelete} handleViewData={_handleViewData} toggleConfirmationModal={_toggleConfirmationModal} />
                                {footerLoader && <Loader style={{ marginTop: '20px' }} />}
                            </div>
                            <Pagination data={paginationData} onPageChange={_fetchDataRequests} />
                        </div>
                    </div>
                </div>
            </div>

            {/** ADD MODAL * */}
            <AddModal isOpen={openAddModal} toggle={() => setOpenAddModal(false)} userslist={users} purposelist={purpose} handleSubmit={_handleSubmit} isLoading={isLoading} />

            {/** VIEW USER MODAL * */}
            {openViewModal && <ViewUser isOpen={openViewModal} request={selectedRequest} toggle={() => setOpenViewModal(false)} isLoading={isLoading} accessToken={cookies.authToken} />}

            {/** VIEW ORGANIZATION MODAL * */}
            {openViewOrgModal && <ViewOrganization isOpen={openViewOrgModal} user={user} request={selectedRequest} toggle={() => setOpenViewOrgModal(false)} accessToken={cookies.authToken} />}

            {/** CONFIRMATION MODAL * */}
            <ConfirmationModal isOpen={openConfirmationModal} toggle={() => setOpenConfirmationModal(false)} confirmationType={confirmationType} handleRequestStatus={_handleRequestStatus} isLoading={isLoading} />

            {/** DELETE MODAL * */}
            <DeleteModal isOpen={openDeleteModal} toggle={() => setOpenDeleteModal(false)} onDeleteEntry={_handleRequestDelete} isLoading={isLoading} />
        </div>
    )
}

export default withAuth(UserDataRequest, { loginRequired: true })
