import PropTypes from 'prop-types'
import { useEffect, useState, useRef } from 'react'
import AddCommentModal from './modal/AddCommentModal'
import ApproveModal from './modal/ApproveModal'
import CancelModal from './modal/CancelModal'
import EditModal from './modal/EditModal'
import AddModal from './modal/AddModal'
import CommitModal from './modal/CommitModal'
import GitHubAccessModal from './modal/GitHubAccessModal'
import NProgress from 'nprogress'
import notify from '../../lib/notifier'
import string from '../../utils/LanguageTranslation.js'
import withAuth from '../../lib/withAuth'
import { fetchSmartContracts, fetchSmartContractApprovals, fetchSmartContractComments, addSmartContractComment, approveSmartContract, addSmartContractProposal, cancelSmartContractProposal, commitSmartContractProposal } from '../../lib/api/smart-contract'
import { INITIAL_PAGINATION_STATE, LOADER_TYPES, SMART_CONTRACT_PAGE_TAB } from '../../shared/constants'
import SmartContractList from './components/smart-contract-list'
import SmartContractDetails from './components/smart-contract-details'
import { getPaginationQuery, getPaginationState } from '../../utils/InfinitePagination'
import { useCookies } from 'react-cookie'
import Button from '../../components/common/form-elements/button/Button'
import { useRouter } from 'next/router'
import { acceptGitRepoInvitation, addGitRepoCollaborator, fetchGitRepoAccessData, rejectGitRepoInvitation, updateGitHubAccess, updateGitRepoAccessData } from '../../lib/api/github'
import { async } from 'q'
import { checkGithubDetails } from '../../lib/api/user'
import GithubInfoModal from './modal/GithubInfoModal'

const SmartContractPage = (props) => {
    const { user } = props
    const [paginationSmartContractData, setPaginationSmartContractData] = useState([])
    const [paginationSmartContractDetails, setPaginationSmartContractDetails] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [approvalsData, setApprovalsData] = useState([])
    const [codeAccessData, setCodeAccessData] = useState([])
    const [commentsData, setCommentsData] = useState([])
    const [smartContract, setSmartContract] = useState({})
    const [smartContractEditData, setsmartContractEditData] = useState({})
    const [values, setValues] = useState({})
    const [deleteMode, setDeleteMode] = useState('')
    const [selectedIndex, setSelectedIndex] = useState('')
    const [editMode, setEditMode] = useState('')
    const [cancelProposalId, setCancelProposalId] = useState('0')
    const [viewDetailsTab, setViewDetailsTab] = useState(false)
    const [proposalName, setProposalName] = useState('')
    const [proposalVersion, setProposalVersion] = useState(1)
    const [loadingComments, setLoadingComments] = useState(true)
    const [committingProposal, setCommittingProposal] = useState(false)
    const [submittingComment, setSubmittingComment] = useState(false)
    const [submittingApproval, setSubmittingApproval] = useState(false)
    const [cancellingProposal, setCancellingProposal] = useState(false)
    const [addingProposal, setAddingProposal] = useState(false)
    const [modifyingAccess, setModifyingAccess] = useState(false)
    const [loadingApprovals, setLoadingApprovals] = useState(true)
    const [loadingCodeAccess, setLoadingCodeAccess] = useState(true)
    const [loadingProposal, setLoadingProposal] = useState(true)
    const [selectedTab, setSelectedTab] = useState(SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_LISTING)
    const [loadingMode, setLoadingMode] = useState('')
    const [isListLoading, setIsListLoading] = useState(false)
    const [creatingNewProposal, setCreatingNewProposal] = useState(false)
    const [createFormValues, setCreateFormValues] = useState({
        name: '',
        commitAddress: '',
        packageId: '',
        desc: '',
    })
    const [showModal, setShowModal] = useState(false)
    const [showStarted, setShowStarted] = useState(false)

    const [showGitAccessModal, setShowGitAccessModal] = useState(false)
    const [showGitAccessStarted, setShowGitAccessStarted] = useState(false)
    const [gitHubAccessData, setGitHubAccessData] = useState({})
    const [gitHubConfirmationMessage, setGitHubConfirmationMessage] = useState('')
    const [gitHubModalAction, setGitHubModalAction] = useState('')
    const [gitHubHostOrganization, setGitHubHostOrganization] = useState(0)
    const [gitHubRepoDetails, setGitHubRepoDetails] = useState({})

    const listTabRef = useRef()
    const detailsTabRef = useRef()
    const [isOpenGithubModal, setIsOpenGithubModal] = useState(false)

    const [cookies, setCookie, removeCookie] = useCookies()
    const router = useRouter()

    const handleOnToggleGithubModal = () => {
        setIsOpenGithubModal((isOpen) => !isOpen)
    }

    useEffect(() => {
        //Check if the use is CEO
        if (user != undefined) {
            if (!(user.role_id == 5 || user.role_id == 6)) {
                //Redirect to 404
                router.push('/404')
            }
        }
    })

    useEffect(() => {
        if (!isOpenGithubModal) {
            handleFetchList({ selectedTab: SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_LISTING })
        }
    }, [isOpenGithubModal])

    useEffect(() => {
        checkGithubDetails().then((result) => {
            if (!result.status) {
                handleOnToggleGithubModal()
            }
        })
    }, [])

    const handleFetchList = async (params = {}) => {
        try {
            if (params.selectedTab === SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_LISTING) {
                NProgress.start()
                setIsListLoading(true)
                setPaginationSmartContractData([])
                setSelectedTab(SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_LISTING)
                setLoadingMode(LOADER_TYPES.FETCHING)

                const data = {
                    orgName: user.organization.blockchain_name.toLowerCase(),
                    userName: user.unique_id.toLowerCase(),
                    page_size: '1000',
                    bookmark: '',
                }
                const query = { ...data }
                const response = await fetchSmartContracts(query, cookies.authToken)
                if (response.data.data.length > 0) {
                    setPaginationSmartContractData(response.data.data)
                    setProposalName(response.data.data[0].data.name)
                    setProposalVersion(response.data.data[0].data.version)
                    setCancelProposalId(response.data.data[0].id)
                }
                setLoadingMode('')
                setIsListLoading(false)
                NProgress.done()
            } else {
                if (params.manual) {
                    setSelectedTab(SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_DETAILS)
                }
                setIsLoading(true)
                setLoadingComments(true)
                setLoadingApprovals(true)
                setCommentsData([])
                setSmartContract([])
                setApprovalsData([])

                const data = {
                    orgName: user.organization.blockchain_name.toLowerCase(),
                    userName: user.unique_id.toLowerCase(),
                    page_size: '1',
                    bookmark: '',
                }
                const query = { ...data }
                const response = await fetchSmartContracts(query, cookies.authToken)
                const name = response.data.data[0].data.name
                const version = response.data.data[0].data.version
                const proposalId = response.data.data[0].id
                setProposalName(name)
                setProposalVersion(version)
                if (router.asPath != '/smart-contracts/' + name + '/' + version) {
                    router.push('/smart-contracts/' + name + '/' + version)
                }
                setSelectedSubTab(SMART_CONTRACT_PAGE_TAB.COMMENTS)
            }
        } catch (err) {
            NProgress.done()
        }
    }

    const handleReload = async (params = {}) => {
        NProgress.start()
        try {
            setIsLoading(true)
            setLoadingComments(true)
            setLoadingApprovals(true)
            setCommentsData([])
            setSmartContract([])
            setApprovalsData([])

            const commentQueryData = {
                orgName: user.organization.blockchain_name.toLowerCase(),
                userName: user.unique_id.toLowerCase(),
                version: proposalVersion,
            }

            const commentQuery = { ...commentQueryData }
            const commentResponse = await fetchSmartContractComments(params.name, commentQuery, cookies.authToken)
            commentResponse.data.proposalId = cancelProposalId
            setCommentsData(commentResponse.data.comments)
            setSmartContract(commentResponse.data)
            setIsLoading(false)
            setLoadingComments(false)
            setLoadingApprovals(false)

            NProgress.done()
        } catch (err) {
            NProgress.done()
        }
    }

    const viewDetails = async (version, name) => {
        if (router.asPath != '/smart-contracts/' + name + '/' + version) {
            router.push('/smart-contracts/' + name + '/' + version)
        }
    }

    const handleFetchSubTab = async (tab, name, version) => {
        NProgress.start()
        try {
            if (tab === SMART_CONTRACT_PAGE_TAB.COMMENTS) {
                setLoadingComments(true)
                const commentQueryData = {
                    orgName: user.organization.blockchain_name.toLowerCase(),
                    userName: user.unique_id.toLowerCase(),
                    version: version,
                }

                const commentQuery = { ...commentQueryData }
                const commentResponse = await fetchSmartContractComments(name, commentQuery, cookies.authToken)
                setCommentsData(commentResponse.data.comments)
                setLoadingComments(false)
            } else if (tab === SMART_CONTRACT_PAGE_TAB.CODE_ACCESS) {
                setLoadingCodeAccess(true)
                const codeAccessQueryData = {
                    proposal_name: name,
                }
                //Update github access status in local DB
                const codeAccessUpdateResponse = await updateGitRepoAccessData(codeAccessQueryData)
                if (codeAccessUpdateResponse.success) {
                    const codeAccessResponse = await fetchGitRepoAccessData(codeAccessQueryData)
                    if (codeAccessResponse) {
                        setGitHubHostOrganization(codeAccessResponse.host_organization)
                        setGitHubRepoDetails({
                            host_organization: codeAccessResponse.host_organization,
                            proposal_name: codeAccessResponse.proposal_name,
                            repository_name: codeAccessResponse.repository_name,
                            repository_owner: codeAccessResponse.repository_owner,
                        })
                        setCodeAccessData(codeAccessResponse.smart_contract_github_accesses)
                    }
                    setLoadingCodeAccess(false)
                }
            } else {
                setLoadingApprovals(true)
                const approvalQueryData = {
                    orgName: user.organization.blockchain_name.toLowerCase(),
                    userName: user.unique_id.toLowerCase(),
                    version: version,
                }

                const approvalQuery = { ...approvalQueryData, ...approvalsData }
                const approvalResponse = await fetchSmartContractApprovals(name, approvalQueryData, cookies.authToken)
                setApprovalsData(approvalResponse.data)
                setLoadingApprovals(false)
            }
            NProgress.done()
        } catch (err) {
            NProgress.done()
        }
    }

    const viewSmartContractDetails = async (name, version, id, action) => {
        setSelectedTab(SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_DETAILS)

        if (action) {
            setProposalVersion(version)
            setProposalName(name)
            setCancelProposalId(id)
            viewDetails(version, name)
        } else {
            if (selectedTab !== SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_DETAILS) {
                handleFetchList({ selectedTab: SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_DETAILS })
            }
        }
    }

    // submit proposal function to check submitted details
    const onCommentSubmit = async (values) => {
        //Add proposal
        NProgress.start()
        try {
            setSubmittingComment(true)
            const payload = {
                orgName: user.organization.blockchain_name.toLowerCase(),
                userName: user.unique_id.toLowerCase(),
                name: values.name,
                version: values.version,
                comment: values.comment,
            }
            const commentResponse = await addSmartContractComment(payload, cookies.authToken)
            if (commentResponse.success) {
                notify(string.smartContract.commentAdded)
            } else {
                notify(string.smartContract.commentFailed)
            }
            setSubmittingComment(false)
            $('#commentModal').modal('hide')
            handleFetchSubTab(SMART_CONTRACT_PAGE_TAB.COMMENTS, values.name, values.version)
            NProgress.done()
        } catch (err) {
            NProgress.done()
        }
    }

    const editSmartContractDetails = async (name, version) => {
        try {
            setsmartContractEditData([])
            setLoadingProposal(true)
            $('#editModal').modal('show')
            const smartContractQueryData = {
                orgName: user.organization.blockchain_name.toLowerCase(),
                userName: user.unique_id.toLowerCase(),
                version: version,
            }

            const smartContractQuery = { ...smartContractQueryData }
            const smartContractResponse = await fetchSmartContractComments(name, smartContractQuery, cookies.authToken)
            setsmartContractEditData(smartContractResponse.data)
            setLoadingProposal(false)
        } catch (err) {
            NProgress.done()
        }
        //Fetch and update smart contract details
    }

    const onProposalCancelled = async (cancelProposalId, currentTab) => {
        try {
            setCancellingProposal(true)
            const payload = {
                orgName: user.organization.blockchain_name.toLowerCase(),
                userName: user.unique_id.toLowerCase(),
                id: cancelProposalId,
            }
            // Cancel proposal
            const smartContractResponse = await cancelSmartContractProposal(payload, cookies.authToken)
            if (smartContractResponse.success) {
                notify(string.smartContract.proposalCancelled)
            } else {
                notify(string.smartContract.proposalCancelFailed)
            }
            setCancellingProposal(false)
            $('#cancelModal').modal('hide')
            if (!cancellingProposal) {
                if (currentTab == SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_LISTING) {
                    handleFetchList({ selectedTab: SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_LISTING })
                    handleReload({ selectedTab: SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_DETAILS, name: proposalName, version: proposalVersion, proposalId: cancelProposalId })
                } else {
                    setSelectedTab(SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_DETAILS)
                    handleReload({ selectedTab: SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_DETAILS, name: proposalName, version: proposalVersion, proposalId: cancelProposalId })
                }
            }
        } catch (err) {
            NProgress.done()
        }
    }

    const onProposalCommitted = async (commitName, commitVersion, commitProposalId, currentTab) => {
        try {
            setCommittingProposal(true)
            const payload = {
                orgName: user.organization.blockchain_name.toLowerCase(),
                userName: user.unique_id.toLowerCase(),
                name: commitName,
                version: commitVersion,
            }
            //Commit proposal
            const smartContractResponse = await commitSmartContractProposal(payload, cookies.authToken)
            if (smartContractResponse.success) {
                notify(string.smartContract.proposalCommitted)
            } else {
                notify(string.smartContract.proposalCommitFailed)
            }
            setCancelProposalId(commitProposalId)
            setCommittingProposal(false)
            $('#commitModal').modal('hide')
            handleReload({ selectedTab: SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_DETAILS, name: commitName, version: commitVersion })
        } catch (err) {
            NProgress.done()
        }
    }

    // submit proposal function
    const addProposal = async (values) => {
        try {
            setAddingProposal(true)
            const payload = {
                orgName: user.organization.blockchain_name.toLowerCase(),
                userName: user.unique_id.toLowerCase(),
                description: values.description,
                package_id: values.package_id,
                github_commit_address: values.github_commit_address,
                name: values.name,
                token: cookies.authToken,
            }
            const proposalResponse = await addSmartContractProposal(payload, cookies.authToken)
            if (proposalResponse.success) {
                $('#editModal').modal('hide')
                notify(string.smartContract.proposalAdded)
            } else {
                $('#editModal').modal('hide')
                notify(string.smartContract.proposalAdditionFailed)
            }
            handleFetchList({ selectedTab: SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_LISTING })
            setAddingProposal(false)
        } catch (err) {
            NProgress.done()
        }
    }

    // Create new proposal function
    const createNewProposal = async (values) => {
        NProgress.start()
        try {
            setCreatingNewProposal(true)
            const payload = {
                orgName: user.organization.blockchain_name.toLowerCase(),
                userName: user.unique_id.toLowerCase(),
                description: values.description,
                package_id: values.package_id,
                github_commit_address: values.github_commit_address,
                name: values.proposal_name,
                token: cookies.authToken,
            }

            const proposalResponse = await addSmartContractProposal(payload, cookies.authToken)
            if (proposalResponse.success) {
                toggleModal(false)
                notify(string.smartContract.proposalAdded)
            } else {
                toggleModal(false)
                notify(string.smartContract.proposalAdditionFailed)
            }
            handleFetchList({ selectedTab: SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_LISTING })
            setCreatingNewProposal(false)
            NProgress.done()
        } catch (err) {
            NProgress.done()
        }
    }

    const viewCancelModal = async (id) => {
        setCancellingProposal(false)
        setCancelProposalId(id)
        setSelectedTab(SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_LISTING)
        $('#cancelModal').modal('show')
    }

    // Approve proposal
    const onProposalApproved = async (values) => {
        //Add proposal
        NProgress.start()
        try {
            setSubmittingApproval(true)
            const payload = {
                orgName: user.organization.blockchain_name.toLowerCase(),
                userName: user.unique_id.toLowerCase(),
                name: values.name,
                version: values.version,
                description: values.description,
            }
            const approveResponse = await approveSmartContract(payload, cookies.authToken)
            if (approveResponse.success) {
                notify(string.smartContract.proposalApproved)
            } else {
                notify(string.smartContract.alreadyApproved)
            }
            $('#approveModal').modal('hide')
            setCancelProposalId(cancelProposalId)
            setSubmittingApproval(false)
            handleReload({ selectedTab: SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_DETAILS, name: values.name, version: values.version })
            NProgress.done()
        } catch (err) {
            NProgress.done()
        }
    }

    const toggleModal = async (status) => {
        setCreateFormValues({
            name: '',
            commitAddress: '',
            packageId: '',
            desc: '',
        })
        if (!status) {
            setShowStarted(false)
            setTimeout(() => {
                setShowModal(false)
            }, 200)
        } else {
            setShowModal(true)
            setTimeout(() => {
                setShowStarted(true)
            }, 100)
        }
    }

    // Update GitHub Status
    const onGitAccessChanged = async (organization_id, proposal_id, invitation_id = 0, action, github_username) => {
        NProgress.start()
        try {
            setModifyingAccess(true)
            const payload = {
                invitationId: invitation_id,
                organizationId: organization_id,
                proposalId: proposal_id,
                owner: gitHubRepoDetails.repository_owner,
                repo: gitHubRepoDetails.repository_name,
                proposalName: gitHubRepoDetails.proposal_name,
                username: github_username,
            }
            let isHost = false
            if (gitHubHostOrganization == user.organization_id) {
                isHost = true
            }
            await changeGitHubAccess(action, payload, isHost)

            toggleGitAccessModal(false)
            setModifyingAccess(false)
            handleFetchSubTab(SMART_CONTRACT_PAGE_TAB.CODE_ACCESS, proposalName, null)
            NProgress.done()
        } catch (err) {
            NProgress.done()
        }
    }

    const toggleGitAccessModal = async (status, gitAccessData = {}, action = '') => {
        if (!status) {
            setGitHubAccessData({})
            setModifyingAccess(false)
            setShowGitAccessStarted(false)
            setTimeout(() => {
                setShowGitAccessModal(false)
            }, 200)
        } else {
            await setGitHubAccessDetails(gitAccessData)
            await setGitAccessStatusMessage(action)
            setShowGitAccessModal(true)
            setTimeout(() => {
                setShowGitAccessStarted(true)
            }, 100)
        }
    }
    const setGitHubAccessDetails = async (gitAccessData) => {
        setGitHubAccessData(gitAccessData)
    }

    const setGitAccessStatusMessage = async (action) => {
        setGitHubModalAction(action)
        switch (action) {
            case 'ACCEPT':
                setGitHubConfirmationMessage(string.smartContract.gitActionAcceptMessage)
                return

            case 'REJECT':
                setGitHubConfirmationMessage(string.smartContract.gitActionRejectMessage)
                return

            case 'REQUEST':
                setGitHubConfirmationMessage(string.smartContract.gitActionRequestMessage)
                return

            default:
                return
        }
    }

    const changeGitHubAccess = async (action, payload, isHost) => {
        switch (action) {
            case 'ACCEPT':
                if (isHost) {
                    //create invitation by adding a collaborator
                    await addGitRepoCollaborator(payload)
                } else {
                    //Accept invitation
                    await acceptGitRepoInvitation(payload)
                }
                return

            case 'REJECT':
                if (isHost) {
                    //Change status to rejected
                    await updateGitHubAccess(payload, 'REJECTED')
                } else {
                    //Reject invitation
                    await rejectGitRepoInvitation(payload)
                }
                return

            case 'REQUEST':
                //Change status to requested
                await updateGitHubAccess(payload, 'REQUESTED')
                return

            default:
                return
        }
    }

    const isFetchingList = LOADER_TYPES.FETCHING === loadingMode

    return (
        <div className='pb-4'>
            {!isOpenGithubModal && (
                <div className='container-fluid'>
                    <div className='row d-flex project-listing'>
                        <div className='col-md-12 add-contract d-flex align-items-center justify-content-between p-0 event-filter '>
                            <h4 className='text-dark pb-3'>{string.smartContract.title}</h4>
                            <Button className='btn btn-primary large-btn ob-button-positive' onClick={() => toggleModal(true)}>
                                {string.smartContract.addNew}
                            </Button>
                        </div>
                        <ul className='nav nav-tabs w-100' id='myTab' role='tablist'>
                            <li className='nav-item ob-hand-pointer' onClick={() => handleFetchList({ selectedTab: SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_LISTING })}>
                                <a className={selectedTab === SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_LISTING ? 'nav-link active' : 'nav-link'} id='smartcontracts' role='tab' aria-controls='smartcontracts' aria-selected='true' ref={listTabRef}>
                                    {string.smartContract.smartContractListing}
                                </a>
                            </li>
                            <li className='nav-item ob-hand-pointer' onClick={() => viewSmartContractDetails(null, null, null, false)}>
                                <a className={selectedTab === SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_DETAILS ? 'nav-link active' : 'nav-link'} id='smartcontractdetails' role='tab' aria-controls='smartcontractdetails' ref={detailsTabRef}>
                                    {string.smartContract.smartContractDetails}
                                </a>
                            </li>
                        </ul>

                        <div className='tab-content w-100' id='myTabContent'>
                            {selectedTab === SMART_CONTRACT_PAGE_TAB.SMART_CONTRACT_LISTING ? (
                                <SmartContractList isLoading={isFetchingList} paginationData={paginationSmartContractData} viewSmartContractDetails={viewSmartContractDetails} editSmartContractDetails={editSmartContractDetails} user={user} viewCancelModal={viewCancelModal} />
                            ) : (
                                !isFetchingList && (
                                    <SmartContractDetails
                                        isLoading={isLoading}
                                        isLoadingComments={loadingComments}
                                        isLoadingApprovals={loadingApprovals}
                                        smartContractDetails={smartContract}
                                        approvalsData={approvalsData}
                                        commentsData={commentsData}
                                        onSetEditMode={setEditMode}
                                        onSetDeleteMode={setDeleteMode}
                                        version={proposalVersion}
                                        name={proposalName}
                                        user={user}
                                        viewDetails={viewDetails}
                                        handleFetchSubTab={handleFetchSubTab}
                                        isLoadingCodeAccess={loadingCodeAccess}
                                        codeAccessData={codeAccessData}
                                        toggleGitAccessModal={toggleGitAccessModal}
                                        gitHubRepoDetails={gitHubRepoDetails}
                                    />
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {!loadingComments ? (
                <div className='modal fade document' id='commentModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                    <AddCommentModal isLoading={submittingComment} smartContract={smartContract.proposal} onCommentSubmit={onCommentSubmit} />
                </div>
            ) : (
                ''
            )}
            {!loadingApprovals && !isLoading ? (
                <div className='modal fade document' id='approveModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                    <ApproveModal isLoading={submittingApproval} smartContract={smartContract.proposal} onProposalApproved={onProposalApproved} />
                </div>
            ) : (
                ''
            )}
            <div className='modal fade document' id='editModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                <EditModal addingProposal={addingProposal} loadingProposal={loadingProposal} smartContract={smartContractEditData.proposal} addProposal={addProposal} allSmartContracts={paginationSmartContractData} />
            </div>
            {showModal && (
                <div className={!showStarted ? 'modal document show ob-backdrop' : 'modal document show ob-backdrop-show'} id='createNewModal' tabIndex='-1' role='dialog' aria-modal='true'>
                    <AddModal creatingNewProposal={creatingNewProposal} createFormValues={createFormValues} toggleModal={toggleModal} createNewProposal={createNewProposal} allSmartContracts={paginationSmartContractData} />
                </div>
            )}

            <div className='modal fade document' id='cancelModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                <CancelModal cancellingProposal={cancellingProposal} onProposalCancelled={onProposalCancelled} cancelProposalId={cancelProposalId} selectedTab={selectedTab} />
            </div>

            {!loadingComments && (
                <div className='modal fade document' id='commitModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                    <CommitModal committingProposal={committingProposal} onProposalCommitted={onProposalCommitted} smartContract={smartContract} commitProposalId={cancelProposalId} selectedTab={selectedTab} />
                </div>
            )}

            {!loadingCodeAccess && showGitAccessModal && (
                <div className={!showGitAccessStarted ? 'modal document show ob-backdrop' : 'modal document show ob-backdrop-show'} id='createNewModal' tabIndex='-1' role='dialog' aria-modal='true'>
                    <GitHubAccessModal modifyingAccess={modifyingAccess} onGitAccessChanged={onGitAccessChanged} toggleGitAccessModal={toggleGitAccessModal} gitHubAccessData={gitHubAccessData} confirmationMessage={gitHubConfirmationMessage} gitHubModalAction={gitHubModalAction} />
                </div>
            )}

            <GithubInfoModal isOpen={isOpenGithubModal} onToggle={handleOnToggleGithubModal} />
        </div>
    )
}
SmartContractPage.getInitialProps = (ctx) => {
    const smartContractPage = true
    return { smartContractPage }
}

SmartContractPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.string,
    }),
}

SmartContractPage.defaultProps = {
    user: null,
    eventCategory: {},
    projectCategory: {},
}

export default withAuth(SmartContractPage, { loginRequired: true })
