import PropTypes from 'prop-types'
import DeleteModal from './DeleteModal'
import AddModal from './AddModal'
import EditModal from './EditModal'
import NProgress from 'nprogress'
import notify from '../../lib/notifier'
import string from '../../utils/LanguageTranslation.js'
import withAuth from '../../lib/withAuth'
import { fetchWorkers, addWorker, removeWorker, updateWorker } from '../../lib/api/workers'
// updated
import Button from '../../components/common/form-elements/button/Button'
import { getAllFieldUserTypesApi } from '../../lib/api/field_user_type'
import { INITIAL_PAGINATION_STATE, LOADER_TYPES } from '../../shared/constants'
import Loader from '../../components/common/Loader'
import { getPaginationQuery, getPaginationState } from '../../utils/InfinitePagination'
import NoDataView from '../../components/common/NoDataView'

let timeout
class WorkerPage extends React.Component {
    static getInitialProps() {
        const workerPage = true
        return { workerPage }
    }

    static propTypes = {
        user: PropTypes.shape({
            id: PropTypes.string,
        }),
    }

    static defaultProps = {
        user: null,
    }

    handleFetchWorkerList = async (params = {}) => {
        NProgress.start()
        try {
            this.setState({ loadingMode: LOADER_TYPES.WORKERS })
            const query = { ...params, ...this.state.paginationData }
            const response = await fetchWorkers(getPaginationQuery(query))
            query.response = response
            this.setState({ loadingMode: '', paginationData: getPaginationState(query) })
            NProgress.done()
        } catch (err) {
            this.setState({ loadingMode: '', error: err.message || err.toString() }) // eslint-disable-line
            NProgress.done()
        }
    }

    async componentDidMount() {
        NProgress.start()
        try {
            const rolesData = await getAllFieldUserTypesApi()
            let roles = {}

            rolesData.data.forEach((element) => {
                roles[element.id] = element.name
            })
            this.setState({ rolesArray: rolesData.data })
            this.setState({ roles: roles })
            this.handleFetchWorkerList()
            window.addEventListener('scroll', this.handleScroll)
            NProgress.done()
        } catch (err) {
            this.setState({ loadingMode: '', error: err.message || err.toString() }) // eslint-disable-line
            NProgress.done()
        }
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll)
    }

    handleScroll = () => {
        // End of the document reached?
        if (window.innerHeight + Math.ceil(document.documentElement.scrollTop) >= document.documentElement.offsetHeight - 100) {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
                const { list, totalCount, pageNumber } = this.state.paginationData
                if (list.length < totalCount) {
                    this.handleFetchWorkerList({ page: pageNumber + 1 })
                }
            }, 300)
        }
    }

    constructor(props) {
        super(props)
        this.state = {
            paginationData: INITIAL_PAGINATION_STATE,
            user: props.user || {},
            worker: {},
            deleteMode: '',
            selectedIndex: '',
            editMode: '',
            roles: {},
            rolesArray: [],
            emailExists: false,
            mobileExists: false,
            showAddModal: false,
            showEditModal: false,
            loadingMode: '',
        }
    }

    // submit worker function to check submitted details
    onWorkerSubmit = async (event) => {
        let { worker } = this.state
        const workerData = {}
        workerData.user_id = this.state.user.id
        workerData.user = this.state.user.username
        workerData.first_name = worker.first_name
        workerData.last_name = worker.last_name
        workerData.phone = worker.phone
        workerData.email = worker.email?.toLowerCase()
        workerData.role_id = worker.role_id
        workerData.is_active = worker.is_active
        workerData.country_code = worker.country_code
        return await this.addWorkerData(workerData)
    }

    // add worker function
    addWorkerData = async (data) => {
        NProgress.start()
        try {
            this.setState({ loadingMode: LOADER_TYPES.ADD, emailExists: false, mobileExists: false })
            const response = await addWorker(data)
            this.setState({ loadingMode: '' })
            if (response.error) {
                notify(response.error)
                NProgress.done()
                return false
            } else if (response.emailAlreadyExists) {
                this.setState({ emailExists: true })
                NProgress.done()
                return false
            } else if (response.mobileAlreadyExists) {
                NProgress.done()
                this.setState({ mobileExists: true })
                return false
            } else {
                this.handleFetchWorkerList({ page: 0 })
                this.toggle('AddModal')
                notify(string.worker.workerAddedSuccess)
                NProgress.done()
                this.setState({ worker: {} })
                return true
            }
        } catch (err) {
            this.setState({ loadingMode: '' })
            notify(err.message || err.toString())
            NProgress.done()
            return false
        }
    }

    // Function to delete entry from popup
    onDeleteEntry = async (event) => {
        event.preventDefault()
        this.setState({ loadingMode: LOADER_TYPES.DELETE })
        let {
            deleteMode,
            paginationData: { list },
            selectedIndex,
        } = this.state
        if (deleteMode == 'worker') {
            // delete worker data
            let workers_data = list[selectedIndex]
            await removeWorker({ id: workers_data.id })
            this.handleFetchWorkerList({ isFetchAll: true })
            notify(string.worker.workerDeleteSuccess)
        }
        this.setState({ loadingMode: '' })
    }

    // update worker function
    updateWorker = async () => {
        NProgress.start()
        let { worker } = this.state
        this.setState({ loadingMode: LOADER_TYPES.UPDATE })
        try {
            worker.role_id = parseInt(worker.role_id)
            worker.email = worker.email.toLowerCase()
            const response = await updateWorker(worker)
            if (response.error) {
                throw new Error(response.error)
            } else if (response.emailAlreadyExists) {
                this.setState({ emailExists: true })
            } else if (response.mobileAlreadyExists) {
                this.setState({ mobileExists: true })
            } else {
                this.handleFetchWorkerList({ isFetchAll: true })
                this.toggle('EditModal')
                this.setState({ worker: {} })
                notify(string.worker.workerEditSuccess)
            }
        } catch (err) {
            console.error(err)
            notify(string.worker.workerEditErr)
        }
        this.setState({ loadingMode: '' })
        NProgress.done()
    }

    // set delete mode upon selecting delete icon
    setDeleteMode = (mode, i) => {
        if (mode) {
            this.setState({ deleteMode: mode })
            this.setState({ selectedIndex: i })
            $('#deleteModal').modal('show')
        }
    }

    setEditMode = (mode, i) => {
        if (mode) {
            this.setState({ editMode: mode })
            this.setState({ selectedIndex: i })
            if (mode == 'worker') {
                const {
                    paginationData: { list },
                } = this.state
                let worker = list[i]
                this.setState({ worker })
                this.setState({ showEditModal: true })
            }
        }
    }

    toggle = (type) => {
        this.setState((prevState) => {
            if (type === 'AddModal') {
                return { showAddModal: !prevState.showAddModal }
            } else {
                return { showEditModal: !prevState.showEditModal }
            }
        })
    }

    render() {
        let { paginationData, worker, roles, loadingMode, emailExists, mobileExists } = this.state
        const isFetchingList = LOADER_TYPES.WORKERS === loadingMode

        return (
            <div>
                <div className='container-fluid'>
                    <div className='row d-flex project-listing'>
                        <div className='tab-pane fade show active mt-3 w-100' id='worker' role='tabpanel' aria-labelledby='worker-listing'>
                            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                                <h4 className='text-dark'>{string.worker.workerListing} </h4>
                                <Button
                                    className='btn btn-primary large-btn'
                                    onClick={() => {
                                        this.setState({ worker: {}, showAddModal: true })
                                    }}
                                >
                                    {string.worker.submitWorker}
                                </Button>
                            </div>
                            <div className='project-table-listing table-responsive mt-2 w-100'>
                                <table className='table'>
                                    <thead className='thead-dark'>
                                        <tr>
                                            <th scope='col'>#</th>
                                            <th scope='col'>{string.firstName}</th>
                                            <th scope='col'>{string.lastName}</th>
                                            {/* <th scope="col">{string.login.email}</th> */}
                                            {/* <th scope="col">{string.worker.phone}</th> */}
                                            <th scope='col'>{string.userType}</th>
                                            <th scope='col'>{string.worker.uniqueId}</th>
                                            <th scope='col'>{string.status}</th>
                                            <th className='text-center' scope='col'>
                                                {string.actions}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginationData.list.map((worker, i) => {
                                            return (
                                                <tr key={i}>
                                                    <td>{i + 1}</td>
                                                    <td>{worker.first_name}</td>
                                                    <td>{worker.last_name}</td>
                                                    {/* {worker.email ? <td>{worker.email}</td> :
                                                                <td style={{textAlign:"center"}}>{worker.email || "-"}</td>
                                                                }
                                                                <td>{worker.phone}</td> */}
                                                    <td>{roles[worker.role_id.toString()]}</td>
                                                    <td>{worker.username}</td>
                                                    <td>{worker.isActive ? `${string.worker.active}` : `${string.worker.inactive}`}</td>
                                                    <td>
                                                        <i className='fa fa-pencil-alt' onClick={() => this.setEditMode('worker', i)}></i>
                                                        <i className='fa fa-trash' onClick={() => this.setDeleteMode('worker', i)}></i>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        <NoDataView list={paginationData.list} isLoading={isFetchingList} />
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    {isFetchingList && <Loader className='pagination-loader' />}
                </div>
                <div className='modal fade customModal document' id='deleteModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                    <DeleteModal onDeleteEntry={this.onDeleteEntry} isLoading={LOADER_TYPES.DELETE === loadingMode} />
                </div>
                {this.state.showAddModal && (
                    <AddModal
                        isOpen={this.state.showAddModal}
                        toggle={this.toggle}
                        state={this.setState.bind(this)}
                        onWorkerSubmit={this.onWorkerSubmit.bind(this)}
                        rolesArray={this.state.rolesArray}
                        isLoading={LOADER_TYPES.ADD === loadingMode}
                        emailExists={emailExists}
                        mobileExists={mobileExists}
                    />
                )}
                {this.state.showEditModal && (
                    <EditModal
                        isOpen={this.state.showEditModal}
                        toggle={this.toggle}
                        worker={worker}
                        state={this.setState.bind(this)}
                        updateWorker={this.updateWorker.bind(this)}
                        rolesArray={this.state.rolesArray}
                        isLoading={LOADER_TYPES.UPDATE === loadingMode}
                        emailExists={emailExists}
                        mobileExists={mobileExists}
                    />
                )}
            </div>
        )
    }
}

export default withAuth(WorkerPage, { loginRequired: true })
