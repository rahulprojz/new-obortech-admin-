import PropTypes from 'prop-types'
import _ from 'lodash'
import NProgress from 'nprogress'
import { useCookies } from 'react-cookie'
import DeleteModal from '../../components/common/DeleteModal'
import notify from '../../lib/notifier'
import withAuth from '../../lib/withAuth'
import { fetchParticipantCategories, addParticipantCategory, removeParticipantCategory, updateParticipantCategory } from '../../lib/api/participant-category'
import { getAllTypesApi } from '../../lib/api/user_type'
import { getAllTitlesApi } from '../../lib/api/user_title'
import { getAllRolesApi } from '../../lib/api/role'
import { deployICA, getOrgMSPCrypto, addOrgToChannel, registerPeer, deployPeer, joinChannel, installChaincode, addCronForSyncUpdate, removeOrgFromChannel, removeOrgFromAllPDC, createVaultICA, getMSPCryptoFromVault, registerPeerInVault, deployPeerWithVaultMSP } from '../../lib/api/onboarding-msp'
import { fetchUsers, addUser, removeUser, updateUser, approveUser, VerifyUser } from '../../lib/api/user'
import string from '../../utils/LanguageTranslation.js'
import { addOrganization, approveOrgs, fetchOrgs, removeOrgs, updateOrganization, updateOrganizationCCP, getOrg, fetchVerifiedOrg } from '../../lib/api/organization'
import { notificationViewUser } from '../../lib/api/notification'
import { getAllCountriesApi } from '../../lib/api/country'
import { getAllCitiesApi } from '../../lib/api/city'
import { getAllStatesApi } from '../../lib/api/state'
import InviteOrganization from '../../components/inviteOrganization/InviteOrganization'
import OrganizationList from './organization-list'
import ApproveOrganization from './modals/ApproveOrganization'
import ViewOrganization from './modals/ViewOrganization'
import EditUser from './modals/EditUser'
import EditPublicUser from './modals/EditPublicUser'
import EditOrganization from './modals/EditOrganization'
import AddUser from './modals/AddUser'
import ApproveUser from './modals/ApproveUser'
import AddPublicUser from './modals/AddPublicUser'
import ApproveDeletePDC from './modals/ApproveDeletePDC'
import { sanitize } from '../../utils/globalFunc'
import InviteUser from '../../components/inviteUser/InviteUser'
import ViewUser from './modals/ViewUser'
import { INITIAL_PAGINATION_STATE, LOADER_TYPES } from '../../shared/constants'
import { getPaginationQuery, getPaginationState } from '../../utils/InfinitePagination'
let timeoutScrollEvent

let timeout
let isFetchAll = false
class ParticipantPage extends React.Component {
    static getInitialProps() {
        const participantPage = true
        return { participantPage }
    }

    static propTypes = {
        user: PropTypes.shape({
            id: PropTypes.string,
        }),
    }

    static defaultProps = {
        user: null,
        participant_category: {},
    }

    async componentDidMount() {
        NProgress.start()
        try {
            this.handleFetchOrganizationList()
            window.addEventListener('scroll', this.handleScroll)
            const participant_categories = await fetchParticipantCategories()
            const participants = await fetchUsers()
            const user_types = await getAllTypesApi()
            const user_titles = await getAllTitlesApi()
            const user_roles = await getAllRolesApi()
            const countries = await getAllCountriesApi()
            this.setState({ participant_categories, participants, countries: countries.data, user_types: user_types.data, user_titles: user_titles.data, user_roles: user_roles.data })
            NProgress.done()
        } catch (err) {
            this.setState({ loading: false, error: err.message || err.toString() }) // eslint-disable-line
            NProgress.done()
        }
    }
    handleScroll = () => {
        // End of the document reached?
        if (window.innerHeight + Math.ceil(document.documentElement.scrollTop) >= document.documentElement.offsetHeight - 100) {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
                const { list, totalCount, pageNumber } = this.state.organizations
                if (list.length < totalCount && !isFetchAll) {
                    this.handleFetchOrganizationList({ page: pageNumber + 1 }, true)
                }
            }, 300)
        }
    }

    handleFetchOrganizationList = async (params = {}, isScroll = false) => {
        NProgress.start()
        try {
            this.setState({ loadingMode: LOADER_TYPES.ORGANIZATIONS })
            const query = { ...params, ...this.state.organizations }
            const payload = getPaginationQuery(query)
            const response = await fetchOrgs(payload)

            if (response.rows?.length % payload.limit !== 0 || (!response.rows.length && isScroll)) {
                isFetchAll = true
            }
            const resp = await fetchVerifiedOrg()
            const res = resp.filter((r) => ![...this.state.organizations.list, ...response.rows].some((l) => l.id == r.id))
            response.rows = response.rows.concat(res)
            response.count += resp.length
            query.response = response
            this.setState({ loadingMode: '', organizations: getPaginationState(query) })
            NProgress.done()
        } catch (err) {
            console.log(err)
            this.setState({ loadingMode: '', error: err.message || err.toString() }) // eslint-disable-line
            NProgress.done()
        }
    }

    async componentWillUnmount() {
        clearTimeout(this.state.delayTimer)
        clearInterval(this.state.notifyTimer)
        window.removeEventListener('scroll', this.handleScroll)
    }

    constructor(props) {
        super(props)
        this.state = {
            user: props.user || {},
            participant_categories: [],
            participant_category: {},
            participants: [],
            organizations: INITIAL_PAGINATION_STATE,
            organization: {},
            countries: [],
            cities: [],
            states: [],
            participant: {},
            user_roles: [],
            user_role: {},
            user_types: [],
            user_type: {},
            user_titles: [],
            user_title: {},
            deleteMode: '',
            selectedIndex: '',
            editMode: '',
            approveMode: '',
            openParticipant: false,
            openOrganization: false,
            deleteOpen: false,
            openCategory: false,
            openApprove: false,
            approvalInProgress: false,
            progressBarPercent: 0,
            errorInApproval: false,
            approvalErrorMsg: '',
            approvalCompleted: false,
            approvemsg: string.approveUser,
            openUserAppDisapp: false,
            orgExists: false,
            delayTimer: false,
            notifyTimer: false,
            blockSyncTime: false,
            selectedOrg: {},
            selectedUser: {},
            openViewOrg: false,
            openViewUser: false,
            approveDeletePDC: false,
            loadingMode: '',
        }
    }

    handleSetState = (data) => {
        this.setState(data)
    }

    // submit participant function to check submitted details
    onParticipantSubmit = (event) => {
        const { participant } = this.state
        this.addParticipantData(participant)
    }

    // add participant function
    addParticipantData = async (data) => {
        NProgress.start()
        try {
            this.setState({ loadingMode: LOADER_TYPES.UPSERT })
            await addUser(data)
            this.handleFetchOrganizationList({ page: 0 })
            this.setState({ participant: {}, loadingMode: '' })
            notify(string.participant.participantAddedSuccess)
            this.togglePrticipantModal()
            NProgress.done()
        } catch (err) {
            this.setState({ loadingMode: '' })
            console.error(err)
            notify(string.participant.participantAddErr)
            NProgress.done()
        }
    }

    // submit category function to check submitted details
    onCategorySubmit = (event) => {
        const { participant_category } = this.state
        this.addCategory(participant_category)
    }

    // Function to delete entry from popup
    onDeleteEntry = async () => {
        this.setState({ loadingMode: LOADER_TYPES.DELETE })
        try {
            const { deleteMode, participant_categories, participant, selectedIndex, organizations } = this.state
            if (deleteMode == 'participant') {
                // delete participant data
                let participants_data = participant
                await removeUser({ id: participants_data.id, email: participants_data.email })
                this.handleFetchOrganizationList({ isFetchAll: true })
                this.setState({ participant: {} })
                this.toggleDelete()
                notify(string.participant.participantDeletedSuccess)
            } else if (deleteMode == 'participant_category') {
                // delete participant category data
                const category = participant_categories[selectedIndex]
                const response = await removeParticipantCategory({ id: category.id })
                participant_categories.splice(selectedIndex, 1)
                this.setState({ participant_categories })
                this.toggleDelete()
                if (!response.success) {
                    return notify(string.category.alreadyInOrganization)
                }
                notify(string.category.categoryDelSuccess)
            } else if (deleteMode == 'organization') {
                const organization = organizations.list[selectedIndex]
                const org_name = sanitize(organization.name)

                // Remove org from all PDCs, Using obortech as of now, will change it later
                if (organization.isApproved) {
                    await removeOrgs({ ccp: organization.ccp_name, id: organization.id })
                    const removeOrgPdcJson = { orgName: process.env.HOST_ORG, orgToRemove: org_name, peerId: process.env.PEER_ID }
                    const removeOrgPdcResp = await removeOrgFromAllPDC(removeOrgPdcJson, this.props.cookies.authToken)
                    if (removeOrgPdcResp.success != true) {
                        throw removeOrgPdcResp
                    }

                    // Remove org from channel
                    const removeOrgChanl = { orgName: org_name }
                    const removeOrgResp = await removeOrgFromChannel(removeOrgChanl, this.props.cookies.authToken)
                    if (removeOrgResp.success != true) {
                        throw removeOrgResp
                    }
                }

                this.handleFetchOrganizationList({ isFetchAll: true })
                notify(string.organization.organizationDeleteSuccess)
            }
        } catch (err) {
            const { deleteMode } = this.state
            if (deleteMode !== 'organization') this.toggleDelete()
            notify(err.message || err.toString())
        }
        NProgress.done()
        this.setState({ loadingMode: '' })
    }

    // add participant category function
    addCategory = async (data) => {
        NProgress.start()
        try {
            const category = await addParticipantCategory(data)
            const { participant_categories } = this.state
            participant_categories.push(category)
            this.setState({ participant_categories, participant_category: {} })
            notify(string.category.categoryAddSuccess)
            this.toggleCategory()
        } catch (err) {
            console.error(err)
            notify(string.category.errorAddCategory)
            NProgress.done()
        }
    }

    // update participant category function
    updateCategory = async () => {
        NProgress.start()
        const { participant_category, selectedIndex } = this.state
        try {
            await updateParticipantCategory(participant_category)
            const { participant_categories } = this.state
            participant_categories[selectedIndex] = participant_category
            this.setState({ participant_categories, participant_category: {} })
            notify(string.category.categoryUpdate)
            this.toggleCategory()
        } catch (err) {
            console.error(err)
            notify(string.category.errorAddCategory)
            NProgress.done()
        }
    }

    // update participant function
    updateUser = async () => {
        NProgress.start()
        const { participant } = this.state
        try {
            if (participant?.country_id == 146 && !participant.is_mvs_verified && participant.role_id != process.env.ROLE_PUBLIC_USER) {
                this.togglePrticipantModal()
                NProgress.done()
                return notify(string.participant.notVerifyMVS)
            }
            this.setState({ loadingMode: LOADER_TYPES.UPSERT })
            await updateUser(participant)
            this.handleFetchOrganizationList({ isFetchAll: true })
            this.setState({ participant: {}, loadingMode: '' })
            notify(string.participant.participantUpdateSuccess)
            this.togglePrticipantModal()
            NProgress.done()
        } catch (err) {
            this.setState({ loadingMode: '' })
            console.error(err)
            notify(string.participant.participantAddErr)
            NProgress.done()
        }
    }

    updateOrganizationData = async () => {
        NProgress.start()
        const { organization } = this.state
        this.setState({ loadingMode: LOADER_TYPES.UPSERT })
        try {
            const categories = organization.organization_categories.map((cat) => cat.id)
            const updateResponse = await updateOrganization({ ...organization, organization_categories: categories })
            if (updateResponse.organizationAlreadyExists) {
                this.setState({ orgExists: true })
            } else {
                this.handleFetchOrganizationList({ isFetchAll: true })
                this.setState({ organization: {} })
                notify(string.organization.organizationUpdateSuccess)
                this.toggleOrganizationModal()
            }
            NProgress.done()
        } catch (err) {
            console.error(err)
            notify(string.organization.organizationUpdateErr)
            NProgress.done()
        }
        this.setState({ loadingMode: '' })
    }

    addOrganizationData = async () => {
        NProgress.start()
        const { organization } = this.state
        this.setState({ loadingMode: LOADER_TYPES.UPSERT })
        try {
            const categories = organization.organization_categories.map((cat) => cat.id)
            const addResponse = await addOrganization({ ...organization, organization_categories: categories })
            if (addResponse.organizationAlreadyExists) {
                this.setState({ orgExists: true })
            } else {
                this.handleFetchOrganizationList({ page: 0 })
                this.setState({ organization: {} })
                notify(string.organization.organizationAddSuccess)
                this.toggleOrganizationModal()
            }
            NProgress.done()
        } catch (err) {
            console.error(err)
            notify(string.organization.organizationAddErr)
            NProgress.done()
        }
        this.setState({ loadingMode: '' })
    }

    handleApprove = async () => {
        try {
            const { approveMode } = this.state
            if (approveMode === 'organization') {
                const { organizations, selectedIndex, user } = this.state
                const organizationData = organizations.list[selectedIndex]
                // let delayTimer = setTimeout(this._handleDelayMessage, 60000)
                // this.setState({
                //     delayTimer,
                //     approvalInProgress: true,
                // })
                // this.setState({ loadingMode: LOADER_TYPES.APPROVE })
                await this.callVerificationApis(organizationData, user)
                // this.setState({ loadingMode: '' })
            }
        } catch (err) {
            console.log(err)
        }
    }

    approveDisapproveUser = async () => {
        try {
            NProgress.start()
            this.setState({ loadingMode: LOADER_TYPES.APPROVE })
            const { participant, user } = this.state
            const { id, isApproved, organization_id, username, role_id, organization, email } = participant

            const dataToUpdate = { isApproved: !isApproved, id, organization_id, username, email }
            await approveUser(dataToUpdate)
            // When CEO is approved it should add record to organisation_approval table
            if ((role_id == process.env.ROLE_CEO || role_id == process.env.ROLE_SENIOR_MANAGER) && !isApproved) {
                await approveOrgs({ id: organization_id, org_name: organization.name, msp_type: organization.msp_type, approver_org_id: user.organization_id })
            }
            this.handleFetchOrganizationList({ isFetchAll: true })
            this.toggleApproveDisapproveModal({})
            notify(`${dataToUpdate.isApproved ? string.organization.userApprovedSuccess : string.organization.userDisapprovedSuccess}`)
            NProgress.done()
            this.setState({ loadingMode: '' })
        } catch (err) {
            this.setState({ loadingMode: '' })
            notify(err.error || err.toString())
            NProgress.done()
        }
    }

    onUserVerify = async (orgUser, status) => {
        try {
            const { code } = await VerifyUser({ isVerified: status, id: orgUser.id })
            if (code == 200) {
                notify(status ? string.userVerifiedSuccessfully : string.userUnVerifiedSuccessfully)
                this.handleFetchOrganizationList()
            } else {
                notify(string.errors.somethingwentwrong)
            }
        } catch (error) {
            console.log(error)
        }
    }

    handleCountryChange = async (id, state_id) => {
        const states = await getAllStatesApi(id)
        this.setState({ states: states.data })
        if (state_id) {
            await this.handleStateChange(state_id)
        }
    }

    handleStateChange = async (state_id) => {
        const cities = await getAllCitiesApi(state_id)
        this.setState({ cities: cities.data })
    }

    _handleDelayMessage = async () => {
        notify(string.errors.processTimeTake)
        // let notifyTimer = setInterval(() => notify(string.errors.processTimeTake), 15000)
        // this.setState({ notifyTimer })
    }

    callVerificationApis = async (organizationdata, user) => {
        try {
            const org_name = sanitize(organizationdata.name)
            /* if (!organizationdata.isApproved) {
                const userOrg = await getOrg({
                    id: user.organization_id,
                })

                const endorserName = sanitize(userOrg.name)
                const bodyJson = { orgName: org_name }

                //Get access token
                const accesstoken = await getAccess(user.unique_id)
                if (accesstoken.error) {
                    throw accesstoken.error
                }

                //#1
                if (organizationdata.msp_type == 2) {
                    const createVaultICAResponse = await createVaultICA(bodyJson, accesstoken)
                    if (createVaultICAResponse.success != true) {
                        throw createVaultICAResponse
                    }
                } else {
                    const deployICAResponse = await deployICA(bodyJson, accesstoken)
                    if (deployICAResponse.success != true) {
                        throw deployICAResponse
                    }
                }
                this.setState({ progressBarPercent: 0, approvemsg: string.interCaDeployed })

                //#2
                if (organizationdata.msp_type == 2) {
                    const getMSPCryptoFromVaultResponse = await getMSPCryptoFromVault(bodyJson, accesstoken)
                    if (getMSPCryptoFromVaultResponse.success != true) {
                        throw getMSPCryptoFromVaultResponse
                    }
                } else {
                    const getOrgMSPCryptoResponse = await getOrgMSPCrypto(bodyJson, accesstoken)
                    if (getOrgMSPCryptoResponse.success != true) {
                        throw getOrgMSPCryptoResponse
                    }
                }
                this.setState({ progressBarPercent: 17, approvemsg: string.orgMspCrypto })

                //#3
                //First organization will be Obortech always
                const hostMsp = user.organization_id == 1 ? process.env.HOST_MSP : endorserName
                const hostName = user.organization_id == 1 ? process.env.HOST_ORG : endorserName

                const AddOrgBodyJson = { orgName: org_name, hostMsp, hostName }
                const addOrgToChannelResponse = await addOrgToChannel(AddOrgBodyJson, accesstoken)
                if (addOrgToChannelResponse.success != true) {
                    throw addOrgToChannelResponse
                }
                this.setState({ progressBarPercent: 34, approvemsg: string.orgAddedChannel })

                //#4
                const peerBodyJson = { orgName: org_name, peerId: process.env.PEER_ID }
                if (organizationdata.msp_type == 2) {
                    const registerPeerInVaultResponse = await registerPeerInVault(peerBodyJson, accesstoken)
                    if (registerPeerInVaultResponse.success != true) {
                        throw registerPeerInVaultResponse
                    }
                } else {
                    const registerPeerResponse = await registerPeer(peerBodyJson, accesstoken)
                    if (registerPeerResponse.success != true) {
                        throw registerPeerResponse
                    }
                }
                this.setState({ progressBarPercent: 51, approvemsg: string.peerRegistered })

                //#5
                let deployPeerResponse = { data: '', success: false }
                if (organizationdata.msp_type == 2) {
                    deployPeerResponse = await deployPeerWithVaultMSP(peerBodyJson, accesstoken)
                    if (deployPeerResponse.success != true) {
                        throw deployPeerResponse
                    }
                } else {
                    deployPeerResponse = await deployPeer(peerBodyJson, accesstoken)
                    if (deployPeerResponse.success != true) {
                        throw deployPeerResponse
                    }
                }
                if (deployPeerResponse.data) {
                    await updateOrganizationCCP({
                        id: organizationdata.id,
                        ccp_name: deployPeerResponse.data,
                    })
                }
                this.setState({ progressBarPercent: 68, approvemsg: string.peerDeployed })

                //#6
                const chnlJoinJson = { orgName: org_name, peerId: process.env.PEER_ID, channel: process.env.CHANNEL_NAME }
                const joinChannelResponse = await joinChannel(chnlJoinJson, accesstoken)
                if (joinChannelResponse.success != true) {
                    throw joinChannelResponse
                }
                this.setState({ progressBarPercent: 85, approvemsg: string.channelJoined })

                //#7
                const chncodeJoinJson = { orgName: org_name, peerId: process.env.PEER_ID, chaincode: process.env.CHAINCODE_NAME }
                const installChaincodeResponse = await installChaincode(chncodeJoinJson, accesstoken)
                if (installChaincodeResponse.success != true) {
                    throw installChaincodeResponse
                }
                this.setState({ approvemsg: string.chaincodeInstalled })

                //#8
                const addCronResponse = await addCronForSyncUpdate(chnlJoinJson, organizationdata.msp_type, accesstoken)
                if (addCronResponse.success != true) {
                    throw addCronResponse
                }
                this.setState({ progressBarPercent: 100, approvemsg: string.chaincodeInstalled })
            }

            clearTimeout(this.state.delayTimer)
            clearInterval(this.state.notifyTimer) */

            await approveOrgs({ id: organizationdata.id, org_name, msp_type: organizationdata.msp_type, approver_org_id: user.organization_id })
            this.handleFetchOrganizationList({ isFetchAll: true })
            this.setState({
                notifyTimer: false,
                delayTimer: false,
                approvalCompleted: true,
                approvalInProgress: false,
                approveMode: '',
            })
        } catch (error) {
            clearTimeout(this.state.delayTimer)
            clearInterval(this.state.notifyTimer)
            this.setState({
                errorInApproval: true,
                approvalErrorMsg: [string.errors.processBusyMsg, string.errors.tryagainWarning],
            })
        }
    }

    // set approve mode upon selecting approve icon
    setApproveMode = (mode, i, data) => {
        if (mode) {
            this.setState({ selectedIndex: i, approveMode: mode, approvemsg: string.approveUser })
            if (mode === 'participant') {
                this.setState({ participant: data })
            }
            this.toggleApprove()
        }
    }

    // set delete mode upon selecting delete icon
    setDeleteMode = (mode, i, data) => {
        if (mode) {
            this.setState({ deleteMode: mode })
            this.setState({ selectedIndex: i })
            if (mode === 'participant') {
                this.setState({ participant: data })
            }
            if (mode !== 'organization') this.toggleDelete()
            else this.onDeleteEntry()
        }
    }

    // set add mode upon click on SUBMIT PARTICIPANT button
    setAddMode = (mode, i) => {
        if (mode) {
            this.setState({ editMode: '' })
            this.togglePrticipantModal()
        }
    }

    setEditMode = (mode, i, data) => {
        if (mode) {
            this.setState({ editMode: mode })
            this.setState({ selectedIndex: i })
            if (mode == 'participant') {
                const participant = data
                this.setState({ participant })
                this.togglePrticipantModal()
            } else if (mode == 'participant_category') {
                const { participant_categories } = this.state
                const participant_category = participant_categories[i]
                this.setState({ participant_category })
                this.toggleCategory()
            } else if (mode == 'organization') {
                const organization = data
                this.handleCountryChange(organization.country_id, organization.state_id)
                this.setState({ organization })
                this.toggleOrganizationModal()
            }
        }
    }

    viewOrganizationDetails = (org) => {
        this.setState({ selectedOrg: org, openViewOrg: true })
    }

    viewUserDetails = (user) => {
        const userViewProfile = notificationViewUser({ user_id: user.id, user_username: user.username })
        this.setState({ selectedUser: user, openViewUser: true })
    }

    toggleOrganizationModal = () => {
        this.setState({
            openOrganization: !this.state.openOrganization,
            orgExists: false,
        })
    }

    togglePrticipantModal = () => {
        this.setState({
            openParticipant: !this.state.openParticipant,
        })
    }

    toggleDelete = () => {
        this.setState({
            deleteOpen: !this.state.deleteOpen,
        })
    }

    toggleCategory = () => {
        this.setState({
            openCategory: !this.state.openCategory,
        })
    }

    toggleApprove = () => {
        this.setState({
            approvalInProgress: false,
            progressBarPercent: 0,
            openApprove: !this.state.openApprove,
            progressBarPercent: 0,
            errorInApproval: false,
            approvalErrorMsg: '',
            approvalCompleted: false,
        })
    }

    toggleApproveDisapproveModal = (userData) => {
        this.setState({
            participant: userData,
            openUserAppDisapp: !this.state.openUserAppDisapp,
        })
    }

    render() {
        const {
            user,
            participant_categories,
            participant,
            deleteOpen,
            openParticipant,
            editMode,
            openOrganization,
            openApprove,
            user_roles,
            user_titles,
            user_types,
            organizations,
            organization,
            countries,
            cities,
            states,
            openUserAppDisapp,
            orgExists,
            approvalInProgress,
            approvalErrorMsg,
            progressBarPercent,
            loadingMode,
        } = this.state
        const ifPublicUser = participant.role_id == process.env.ROLE_PUBLIC_USER
        return (
            <div>
                <div className='container-fluid'>
                    <div className='row d-flex project-listing'>
                        <div className='tab-content w-100' id='myTabContent'>
                            <div className='tab-pane fade show active mt-3 w-100' id='participant' role='tabpanel' aria-labelledby='participant-listing'>
                                <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                                    <h4 className='text-dark'>{string.organization.orgAndUserListing}</h4>
                                    <div>
                                        <AddPublicUser user={user} onFetchOrgs={this.handleFetchOrganizationList} />
                                        <InviteUser user={user} />
                                        <InviteOrganization user={user} />
                                    </div>
                                </div>
                                <OrganizationList
                                    loadingMode={loadingMode}
                                    handleFetchOrganizationList={this.handleFetchOrganizationList}
                                    organizations={organizations}
                                    user={user}
                                    viewOrganizationDetails={this.viewOrganizationDetails}
                                    viewUserDetails={this.viewUserDetails}
                                    setEditMode={this.setEditMode}
                                    setDeleteMode={this.setDeleteMode}
                                    setApproveMode={this.setApproveMode}
                                    toggleApproveDisapproveModal={this.toggleApproveDisapproveModal}
                                    onUserVerify={this.onUserVerify}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* DELETE RECORD */}
                <DeleteModal toggle={this.toggleDelete} isOpen={deleteOpen} isLoading={LOADER_TYPES.DELETE === loadingMode} onDeleteEntry={this.onDeleteEntry} />

                {/* APPROVE ORGANIZATION */}
                <ApproveOrganization
                    approvemsg={this.state.approvemsg}
                    errorInApproval={this.state.errorInApproval}
                    approvalCompleted={this.state.approvalCompleted}
                    openApprove={openApprove}
                    approvalInProgress={approvalInProgress}
                    approvalErrorMsg={approvalErrorMsg}
                    progressBarPercent={progressBarPercent}
                    isLoading={LOADER_TYPES.APPROVE === loadingMode}
                    toggleApprove={this.toggleApprove}
                    handleApprove={this.handleApprove}
                />

                {/* EDIT USER */}
                {ifPublicUser ? (
                    <EditPublicUser
                        participant={participant}
                        user_titles={user_titles}
                        openParticipant={openParticipant}
                        editMode={editMode}
                        isLoading={LOADER_TYPES.UPSERT === loadingMode}
                        togglePrticipantModal={this.togglePrticipantModal}
                        setState={this.handleSetState}
                        updateUser={this.updateUser}
                    />
                ) : (
                    <EditUser
                        isLoading={LOADER_TYPES.UPSERT === loadingMode}
                        participant={participant}
                        user_titles={user_titles}
                        user_roles={user_roles}
                        openParticipant={openParticipant}
                        editMode={editMode}
                        togglePrticipantModal={this.togglePrticipantModal}
                        setState={this.handleSetState}
                        updateUser={this.updateUser}
                        onParticipantSubmit={this.onParticipantSubmit}
                    />
                )}

                {/* EDIT ORGANIZATION */}
                <EditOrganization
                    isLoading={LOADER_TYPES.UPSERT === loadingMode}
                    cities={cities}
                    states={states}
                    countries={countries}
                    orgExists={orgExists}
                    user_types={user_types}
                    participant_categories={participant_categories}
                    organization={organization}
                    editMode={editMode}
                    openOrganization={openOrganization}
                    toggleOrganizationModal={this.toggleOrganizationModal}
                    setState={this.handleSetState}
                    updateOrganizationData={this.updateOrganizationData}
                    addOrganizationData={this.addOrganizationData}
                    handleStateChange={this.handleStateChange}
                    handleCountryChange={this.handleCountryChange}
                    user={user}
                    user_roles={user_roles}
                />

                {/* APPROVE/DISAPPROVE USER */}
                <ApproveUser participant={participant} openUserAppDisapp={openUserAppDisapp} isLoading={LOADER_TYPES.APPROVE === loadingMode} toggleApproveDisapproveModal={this.toggleApproveDisapproveModal} approveDisapproveUser={this.approveDisapproveUser} />

                {/* ADD USER */}
                <AddUser
                    user_titles={user_titles}
                    user_roles={user_roles}
                    organization={organization}
                    organizations={organizations.list}
                    participant={participant}
                    openParticipant={openParticipant}
                    editMode={editMode}
                    isLoading={LOADER_TYPES.UPSERT === loadingMode}
                    togglePrticipantModal={this.togglePrticipantModal}
                    setState={this.handleSetState}
                    onParticipantSubmit={this.onParticipantSubmit}
                />

                {/* VIEW ORGANIZATION */}
                <ViewOrganization user={user} isOpen={this.state.openViewOrg} selectedOrg={this.state.selectedOrg} onToggle={() => this.setState({ openViewOrg: false })} />

                {/* VIEW USER */}
                <ViewUser isOpen={this.state.openViewUser} selectedUser={this.state.selectedUser} onToggle={() => this.setState({ openViewUser: false })} />

                {/* Approve Delete PDC Modal */}
                <ApproveDeletePDC organization_id={user?.organization_id} role_id={user?.role_id} />
            </div>
        )
    }
}

export default withAuth(ParticipantPage, { loginRequired: true })
