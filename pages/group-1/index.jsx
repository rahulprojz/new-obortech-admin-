/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable no-undef */
import React from 'react'
import PropTypes from 'prop-types'
import NProgress from 'nprogress'
import DeleteModal from './DeleteModal'
import AddModal from './AddModal'
import EditModal from './EditModal'
import notify from '../../lib/notifier'
import withAuth from '../../lib/withAuth'
import { fetchContainers, addContainer, removeContainer, updateContainer, fetchContainerProject } from '../../lib/api/container'
import { dynamicLanguageStringChange } from '../../utils/globalFunc'
import string from '../../utils/LanguageTranslation'
import Button from '../../components/common/form-elements/button/Button'
import { INITIAL_PAGINATION_STATE, LOADER_TYPES } from '../../shared/constants'
import Loader from '../../components/common/Loader'
import { getPaginationQuery, getPaginationState } from '../../utils/InfinitePagination'
import NoDataView from '../../components/common/NoDataView'

let timeout
class ContainerPage extends React.Component {
    static getInitialProps() {
        const containerPage = true
        return { containerPage }
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
            container: {},
            projectData: {},
            deleteMode: '',
            selectedIndex: '',
            containerProject: '',
            editMode: '',
            containerExists: false,
            AddmodalOpen: false,
            editModalOpen: false,
            loadingMode: '',
        }
    }

    componentDidMount() {
        this.handleFetchContainerList()
        window.addEventListener('scroll', this.handleScroll)
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll)
    }

    handleFetchContainerList = async (params = {}) => {
        NProgress.start()
        try {
            this.setState({ loadingMode: LOADER_TYPES.CONTAINERS })
            const query = { ...params, ...this.state.paginationData }
            const response = await fetchContainers(getPaginationQuery(query))
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
                    this.handleFetchContainerList({ page: pageNumber + 1 })
                }
            }, 300)
        }
    }

    resetInput = () => {
        this.setState({ container: {}, containerExists: false, AddmodalOpen: true })
    }

    // submit container function to check submitted details
    onContainerSubmit = () => {
        const { container } = this.state
        return this.addContainerData(container)
    }

    // add container function
    addContainerData = async (data) => {
        NProgress.start()
        this.setState({ containerExists: false })
        try {
            const container = await addContainer({
                containerID: data.containerID,
                manualCode: data.manualCode,
            })
            if (container.containerAlreadyExists) {
                this.setState({ containerExists: true })
                NProgress.done()
                return false
            }
            this.setState({ containerExists: false, container: {} })
            this.handleFetchContainerList({ page: 0 })
            $('#containerModal').modal('hide')
            notify(`${string.container.group1AddedSucessfully}`)
            NProgress.done()
            return true
        } catch (err) {
            notify(`${string.container.errorAddingGroup1}`)
            NProgress.done()
        }
        return false
    }

    // Function to delete entry from popup
    onDeleteEntry = async (event) => {
        event.preventDefault()
        const {
            deleteMode,
            containerProject,
            paginationData: { list },
            selectedIndex,
            projectData,
        } = this.state
        if (deleteMode === 'container') {
            // delete container data
            const containers_data = projectData?.container || list[selectedIndex]
            this.setState({ loadingMode: LOADER_TYPES.DELETE })
            if ((containers_data.is_available && !projectData?.container) || (!containers_data.is_available && !projectData?.container)) {
                const { success } = await removeContainer({ id: containers_data.id })
                if (success) {
                    this.handleFetchContainerList({ isFetchAll: true })
                    notify(`${string.container.group1DelatedSucessfully}`)
                }
                if (!success && !!containerProject && containerProject !== 'undefined') {
                    notify(`${string.group1} ${dynamicLanguageStringChange(string.alreadyInUse, { project: containerProject })}`)
                }
                $('#deleteModal').modal('hide')
            } else if (!containers_data.is_available && !projectData?.container) {
            } else {
                if (containerProject !== 'undefined') {
                    notify(`${string.group1} ${dynamicLanguageStringChange(string.alreadyInUse, { project: containerProject })}`)
                }
                $('#deleteModal').modal('hide')
            }
            this.setState({ loadingMode: '' })
        }
    }

    // update container function
    updateContainer = async () => {
        NProgress.start()
        this.setState({ containerExists: false })
        const { container } = this.state
        try {
            this.setState({ loadingMode: LOADER_TYPES.UPDATE })
            const containerUpdateResponse = await updateContainer(container)
            if (containerUpdateResponse.containerAlreadyExists) {
                this.setState({ containerExists: true, loadingMode: '' })
                NProgress.done()
                return false
            }
            this.setState({ containerExists: false, container: {}, loadingMode: '' })
            this.handleFetchContainerList({ isFetchAll: true })
            notify(`${string.container.group1UpdatedSucessfully}`)
            NProgress.done()
            return true
        } catch (err) {
            notify(`${string.container.errorAddingGroup1}`)
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
            const projectData = await fetchContainerProject({ container_id: list[i]?.id })
            this.setState({
                deleteMode: mode,
                projectData,
                containerProject: `${projectData?.project_selection?.project?.name}${projectData?.project_selection?.project?.isDraft ? ` (${string.project.draft})` : ''} ${projectData?.project_selection?.project?.archived ? ` (${string.project.archived})` : ''}`,
                selectedIndex: i,
            })
            $('#deleteModal').modal('show')
        }
    }

    setEditMode = (mode, i) => {
        if (mode) {
            this.setState({ selectedIndex: i, editMode: mode, containerExists: false })
            if (mode === 'container') {
                const {
                    paginationData: { list },
                } = this.state
                let container = list[i]
                this.setState({ container: container, editModalOpen: true })
            }
        }
    }

    togglePage = (state) => {
        this.setState({ container: {}, containerExists: false, AddmodalOpen: state })
    }

    editToggle = (state) => {
        this.setState({ editModalOpen: state })
    }

    render() {
        const { paginationData, container, containerExists, loadingMode } = this.state
        const isFetchingList = LOADER_TYPES.CONTAINERS === loadingMode

        return (
            <div>
                <div className='container-fluid'>
                    <div className='row d-flex project-listing'>
                        <div className='tab-pane fade show active mt-3 w-100' id='container' role='tabpanel' aria-labelledby='container-listing'>
                            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                                <h4 className='text-dark'>{string.container.group1Listing}</h4>
                                <Button onClick={this.resetInput} className='btn btn-primary large-btn'>
                                    {string.container.submitGroup1}
                                </Button>
                            </div>
                            <div className='project-table-listing table-responsive mt-2 w-100'>
                                <table className='table'>
                                    <thead className='thead-dark'>
                                        <tr>
                                            <th scope='col'>#</th>
                                            <th scope='col'>{string.container.group1ID}</th>
                                            <th className='text-center' scope='col'>
                                                {string.actions}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginationData.list.map((container1, i) => {
                                            return (
                                                <tr key={container1.i}>
                                                    <td>{i + 1}</td>
                                                    <td>{container1.containerID}</td>
                                                    <td>
                                                        <i role='button' tabIndex={0} aria-hidden='true' className='fa fa-pencil-alt' onClick={() => this.setEditMode('container', i)} />
                                                        <i role='button' tabIndex={0} aria-hidden='true' className='fa fa-trash' onClick={() => this.setDeleteMode('container', i)} />
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

                <AddModal toggle={() => this.togglePage(!this.state.AddmodalOpen)} isOpen={this.state.AddmodalOpen} state={this.setState.bind(this)} onContainerSubmit={this.onContainerSubmit.bind(this)} containerExists={containerExists} />

                {this.state.editModalOpen && (
                    <EditModal
                        container={container}
                        isLoading={LOADER_TYPES.UPDATE === loadingMode}
                        state={this.setState.bind(this)}
                        updateContainer={this.updateContainer.bind(this)}
                        containerExists={containerExists}
                        toggle={() => this.editToggle(!this.state.editModalOpen)}
                        isOpen={this.state.editModalOpen}
                    />
                )}
            </div>
        )
    }
}

export default withAuth(ContainerPage, { loginRequired: true })
