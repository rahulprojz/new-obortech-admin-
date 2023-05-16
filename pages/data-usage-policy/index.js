import PropTypes from 'prop-types'
import NProgress from 'nprogress'
import DeleteModal from '../../components/common/DeleteModal'
import FormModal from './Form'
import withAuth from '../../lib/withAuth'
import notify from '../../lib/notifier'
import string from '../../utils/LanguageTranslation.js'
import Button from '../../components/common/form-elements/button/Button'
import { fetchAllPolicies, createPolicy, updatePolicy, deletePolicy, fetchSortAllPolicies } from '../../lib/api/data-usage-policy'
import { checkIntegrity } from '../../lib/api/integrity'
import { fetchAllPurpose } from '../../lib/api/purpose'
import { integrityWrapper } from '../../utils/integrityHelpers'
import List from './List'
import { sanitize } from '../../utils/globalFunc'

class PolicyListing extends React.Component {
    static getInitialProps() {
        const groupPage = true
        return { groupPage }
    }

    static propTypes = {
        user: PropTypes.shape({
            id: PropTypes.string,
        }),
    }

    static defaultProps = {
        user: null,
    }

    constructor(props) {
        super(props)
        this.state = {
            user: props.user || {},
            policies: [],
            purpose_arr: [],
            selectedPolicy: '',
            AddModalOpen: false,
            DeleteModalOpen: false,
            EditModalOpen: false,
            is_loading: false,
            is_fetching_policies: false,
            activeIntegerity: null,
            sort: 'DESC',
        }
    }

    async componentDidMount() {
        try {
            const purposeArr = []
            const fetchpurpose = await fetchAllPurpose()
            if (fetchpurpose.length > 0) {
                fetchpurpose.forEach((element) => {
                    purposeArr.push({ label: element.purpose_value, value: element.purpose_key })
                })
            }
            this.setState({ purpose_arr: purposeArr })
            await this._getPolicies()
        } catch (err) {
            notify(err.message || err.toString())
        }
    }

    _getPolicies = async () => {
        NProgress.start()
        try {
            this.setState({ is_fetching_policies: true })

            const policyResponse = await fetchAllPolicies()
            this.setState({ policies: policyResponse.reverse(), is_fetching_policies: false })
        } catch (err) {
            notify(err.message || err.toString())
        }
        NProgress.done()
    }

    _openAddModal = (policy) => {
        if (policy) {
            this.setState({ AddModalOpen: true, selectedPolicy: policy })
        } else {
            this.setState({ AddModalOpen: true, selectedPolicy: '' })
        }
    }

    _addPolicy = async (values) => {
        NProgress.start()
        this.setState({ is_loading: true })
        try {
            // Create and Update policy
            const policyObj = {
                userName: this.state.user.unique_id,
                orgName: sanitize(this.state.user.organization.blockchain_name),
                policy: {
                    purpose: values.purpose,
                    clause: values.clause,
                    dataOprands: values.dataOperands,
                    access: values.access,
                },
            }

            let apiResponse = ''
            if (this.state.selectedPolicy) {
                policyObj.policyId = this.state.selectedPolicy.policy_id
                apiResponse = await updatePolicy(policyObj)
            } else {
                apiResponse = await createPolicy(policyObj)
            }
            if (!apiResponse.success) {
                notify(apiResponse.message)
            } else {
                await this._getPolicies()
                this.setState({ AddModalOpen: !this.state.AddModalOpen })
                if (this.state.selectedPolicy) {
                    notify(string.privacyPolicy.policyUpdatedSuccessfully)
                } else {
                    notify(string.privacyPolicy.policyAddedSuccessfully)
                }
            }
        } catch (err) {
            console.log(err)
            notify(string.policyAddErr)
        }
        NProgress.done()
        this.setState({ is_loading: false })
    }

    _openDeleteModal = (policy) => {
        this.setState({ DeleteModalOpen: true, selectedPolicy: policy })
    }

    _deletePolicy = async () => {
        NProgress.start()
        this.setState({ is_loading: true })
        try {
            const { selectedPolicy } = this.state
            // Delete policy
            const policyObj = {
                userName: this.state.user.unique_id,
                orgName: sanitize(this.state.user.organization.blockchain_name),
                policyId: selectedPolicy.policy_id,
            }
            const apiResponse = await deletePolicy(policyObj)
            if (!apiResponse.success) {
                notify(apiResponse.message)
            } else {
                await this._getPolicies()
                this.setState({ DeleteModalOpen: !this.state.DeleteModalOpen })
                notify(string.privacyPolicy.policyDeletedSuccessfully)
            }
        } catch (err) {
            notify(err.message || err.toString())
        }
        NProgress.done()
        this.setState({ is_loading: false })
    }

    _handleIntegrity = async (policy) => {
        const { policies } = this.state
        this.setState({ activeIntegerity: policy })
        const response = await checkIntegrity({ type: 'policy', uniqId: policy.policy_id })
        if (response.data) {
            const updatedPolicies = await integrityWrapper(response.data, policies)
            this.setState({ activeIntegerity: null, policies: updatedPolicies })
        }
    }

    _handleSort = async (_key) => {
        const { sort } = this.state
        NProgress.start()
        try {
            this.setState({ is_fetching_policies: true })
            const policyResponse = await fetchSortAllPolicies({ sort, sortBy: _key })
            this.setState({ policies: policyResponse, is_fetching_policies: false, sort: sort === 'DESC' ? 'ASC' : 'DESC' })
        } catch (err) {
            notify(err.message || err.toString())
        }
        NProgress.done()
    }

    render() {
        const { is_loading, policies, is_fetching_policies, DeleteModalOpen, activeIntegerity } = this.state
        return (
            <div>
                <div className='container-fluid'>
                    <div className='row d-flex project-listing'>
                        <div className='tab-pane fade show active mt-3 w-100' id='group' role='tabpanel' aria-labelledby='group-listing'>
                            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                                <h4 className='text-dark'>{string.policyListing}</h4>
                                <div>
                                    <Button onClick={() => this._openAddModal()} className='btn btn-primary large-btn'>
                                        {string.privacyPolicy.createPolicyHeadListing}
                                    </Button>
                                </div>
                            </div>
                            <div className='project-table-listing table-responsive mt-2 w-100'>
                                <List handleSort={(key) => this._handleSort(key)} activeIntegerity={activeIntegerity} policies={policies} is_fetching_policies={is_fetching_policies} openAddModal={this._openAddModal} openDeleteModal={this._openDeleteModal} handleIntegrity={this._handleIntegrity} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* DELETE POLICY MODAL */}
                <DeleteModal toggle={() => this.setState({ DeleteModalOpen: !DeleteModalOpen })} onDeleteEntry={this._deletePolicy.bind(this)} isOpen={DeleteModalOpen} isLoading={is_loading} />

                {/* ADD/UPDATE POLICY MODAL */}
                <FormModal toggle={() => this.setState({ AddModalOpen: !this.state.AddModalOpen })} isOpen={this.state.AddModalOpen} policy={this.state.selectedPolicy} purposearr={this.state.purpose_arr} addPolicy={this._addPolicy.bind(this)} is_loading={is_loading} />
            </div>
        )
    }
}

export default withAuth(PolicyListing, { loginRequired: true })
