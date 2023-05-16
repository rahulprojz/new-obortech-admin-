/* eslint-disable no-undef */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/destructuring-assignment */
import PropTypes from 'prop-types'
import React from 'react'
import NProgress from 'nprogress'
import DeleteModal from './DeleteModal'
import AddModal from './AddModal'
import EditModal from './EditModal'
import notify from '../../lib/notifier'
import string from '../../utils/LanguageTranslation'
import withAuth from '../../lib/withAuth'
import { fetchTrucks, addTruck, removeTruck, updateTruck, fetchTruckProject } from '../../lib/api/truck'
import { dynamicLanguageStringChange } from '../../utils/globalFunc'
import Button from '../../components/common/form-elements/button/Button'
import { INITIAL_PAGINATION_STATE, LOADER_TYPES } from '../../shared/constants'
import Loader from '../../components/common/Loader'
import { getPaginationQuery, getPaginationState } from '../../utils/InfinitePagination'
import NoDataView from '../../components/common/NoDataView'

let timeout
class TruckPage extends React.Component {
    static getInitialProps() {
        const truckPage = true
        return { truckPage }
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
            paginationData: INITIAL_PAGINATION_STATE,
            user: props.user || {},
            truck: {},
            deleteMode: '',
            selectedIndex: '',
            truckProject: '',
            editMode: '',
            truckExists: false,
            AddmodalOpen: false,
            editModalOpen: false,
            loadingMode: '',
            projectData: {},
        }
    }

    componentDidMount() {
        this.handleFetchTruckList()
        window.addEventListener('scroll', this.handleScroll)
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll)
    }

    handleFetchTruckList = async (params = {}) => {
        NProgress.start()
        try {
            this.setState({ loadingMode: LOADER_TYPES.TRUCKS })
            const query = { ...params, ...this.state.paginationData }
            const response = await fetchTrucks(getPaginationQuery(query))
            query.response = response
            this.setState({ loadingMode: '', paginationData: getPaginationState(query) })
            NProgress.done()
        } catch (err) {
            this.setState({ loadingMode: '', error: err.message || err.toString() }) // eslint-disable-line
            NProgress.done()
        }
    }

    handleScroll = () => {
        // End of the document reached?
        if (window.innerHeight + Math.ceil(document.documentElement.scrollTop) >= document.documentElement.offsetHeight - 100) {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
                const { list, totalCount, pageNumber } = this.state.paginationData
                if (list.length < totalCount) {
                    this.handleFetchTruckList({ page: pageNumber + 1 })
                }
            }, 300)
        }
    }

    resetInput = () => {
        this.setState({ truck: {}, truckExists: false, AddmodalOpen: true })
    }

    // submit truck function to check submitted details
    onTruckSubmit = () => {
        const { truck } = this.state
        const { truckID } = truck

        if (!truckID) {
            notify(string.truck.group2IdRequire)
        } else {
            return this.addTruckData(truck)
        }
        return false
    }

    // add truck function
    addTruckData = async (data) => {
        NProgress.start()
        this.setState({ truckExists: false })
        try {
            const truck = await addTruck({ truckID: data.truckID })
            if (truck.truckAlreadyExists) {
                this.setState({ truckExists: true })
                NProgress.done()
                return false
            }
            this.setState({ truckExists: false, truck: {} })
            this.handleFetchTruckList({ page: 0 })
            $('#truckModal').modal('hide')
            notify(string.truck.group2AddedSuccess)
            NProgress.done()
            return true
        } catch (err) {
            // console.error(err)
            notify(string.truck.group2AddedErr)
            NProgress.done()
        }
        return false
    }

    // Function to delete entry from popup
    onDeleteEntry = async (event) => {
        event.preventDefault()
        let {
            deleteMode,
            projectData,
            truckProject,
            paginationData: { list },
            selectedIndex,
        } = this.state
        if (deleteMode == 'truck') {
            // delete truck data
            const trucks_data = projectData?.truck || list[selectedIndex]
            if ((trucks_data.is_available && !projectData?.truck) || (!trucks_data.is_available && !projectData?.truck)) {
                this.setState({ loadingMode: LOADER_TYPES.DELETE })
                const { success } = await removeTruck({ id: trucks_data.id })
                if (success) {
                    notify(string.truck.group2DeletedSuccess)
                } else if (truckProject != 'undefined') {
                    notify(`${string.group2} ${truckProject ? dynamicLanguageStringChange(string.alreadyInUse, { project: truckProject }) : string.alreadyInProject}`)
                }
                this.handleFetchTruckList({ isFetchAll: true, loadingMode: '' })
                $('#deleteModal').modal('hide')
            } else {
                if (truckProject !== 'undefined') {
                    notify(`${string.group2} ${truckProject ? dynamicLanguageStringChange(string.alreadyInUse, { project: truckProject }) : string.alreadyInProject}`)
                }
                $('#deleteModal').modal('hide')
            }
        }
    }

    // update truck function
    updateTruck = async () => {
        NProgress.start()
        this.setState({ truckExists: false })
        const { truck } = this.state
        try {
            this.setState({ loadingMode: LOADER_TYPES.UPDATE })
            const truckUpdateResponse = await updateTruck(truck)
            if (truckUpdateResponse.truckAlreadyExists) {
                this.setState({ truckExists: true, loadingMode: '' })
                NProgress.done()
                return false
            } else {
                this.setState({ truckExists: false, truck: {} })
                this.handleFetchTruckList({ isFetchAll: true, loadingMode: '' })
                notify(string.truck.group2UpdatedSuccess)
                NProgress.done()
                return true
            }
        } catch (err) {
            // console.error(err)
            notify(string.truck.group2AddedErr)
            NProgress.done()
        }
        return false
    }

    // set delete mode upon selecting delete icon
    setDeleteMode = async (mode, i) => {
        if (mode) {
            const {
                paginationData: { list },
            } = this.state
            const projectData = await fetchTruckProject({ truck_id: list[i]?.id })
            this.setState({
                deleteMode: mode,
                selectedIndex: i,
                projectData,
                truckProject: `${projectData?.project_selection?.project?.name}${projectData?.project_selection?.project?.isDraft ? ` (${string.project.draft})` : ''} ${projectData?.project_selection?.project?.archived ? ` (${string.project.archived})` : ''}`,
                truckExists: false,
            })
            $('#deleteModal').modal('show')
        }
    }

    setEditMode = (mode, i) => {
        if (mode) {
            this.setState({ editMode: mode, selectedIndex: i, truckExists: false })
            if (mode == 'truck') {
                let {
                    paginationData: { list },
                } = this.state
                let truck = list[i]
                this.setState({ truck: truck, editModalOpen: true })
            }
        }
    }

    editToggle = (state) => {
        this.setState({ editModalOpen: state })
    }

    togglePage = (state) => {
        this.setState({ AddmodalOpen: state, truck: {}, truckExists: false })
    }

    render() {
        const { paginationData, truck, truckExists, loadingMode } = this.state
        const isFetchingList = LOADER_TYPES.TRUCKS === loadingMode

        return (
            <div>
                <div className='container-fluid'>
                    <div className='row d-flex project-listing'>
                        <div className='tab-pane fade show active mt-3 w-100' id='truck' role='tabpanel' aria-labelledby='truck-listing'>
                            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                                <h4 className='text-dark'>{string.truck.group2Listing}</h4>
                                <Button onClick={this.resetInput} className='btn btn-primary large-btn'>
                                    {string.truck.submitGroup2Btn}
                                </Button>
                            </div>
                            <div className='project-table-listing table-responsive mt-2 w-100'>
                                <table className='table'>
                                    <thead className='thead-dark'>
                                        <tr>
                                            <th scope='col'>#</th>
                                            <th scope='col'>{string.truck.group2Id}</th>
                                            <th className='text-center' scope='col'>
                                                {string.actions}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginationData.list.map((truck1, i) => {
                                            return (
                                                <tr key={truck1.i}>
                                                    <td>{i + 1}</td>
                                                    <td>{truck1.truckID}</td>
                                                    <td>
                                                        {truck1.id > 1 && (
                                                            <>
                                                                <i className='fa fa-pencil-alt' onClick={() => this.setEditMode('truck', i)}></i>
                                                                <i className='fa fa-trash' onClick={() => this.setDeleteMode('truck', i)}></i>
                                                            </>
                                                        )}
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
                    <DeleteModal isLoading={LOADER_TYPES.DELETE === loadingMode} onDeleteEntry={this.onDeleteEntry} />
                </div>

                <AddModal toggle={() => this.togglePage(!this.state.AddmodalOpen)} isOpen={this.state.AddmodalOpen} state={this.setState.bind(this)} onTruckSubmit={this.onTruckSubmit.bind(this)} truckExists={truckExists} />

                {this.state.editModalOpen && (
                    <EditModal truck={truck} isLoading={LOADER_TYPES.UPDATE === loadingMode} state={this.setState.bind(this)} updateTruck={this.updateTruck.bind(this)} truckExists={truckExists} isOpen={this.state.editModalOpen} toggle={() => this.editToggle(!this.state.editModalOpen)} />
                )}
            </div>
        )
    }
}

export default withAuth(TruckPage, { loginRequired: true })
