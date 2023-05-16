import PropTypes from 'prop-types'
import NProgress from 'nprogress'
import Autocomplete from 'react-google-autocomplete'
import DeleteModal from './DeleteModal'
import AddModal from './AddModal'
import EditModal from './EditModal'
import notify from '../../lib/notifier'
import string from '../../utils/LanguageTranslation'
import withAuth from '../../lib/withAuth'
import { fetchStations, addStation, removeStation, updateStation } from '../../lib/api/station'
// updated
import Button from '../../components/common/form-elements/button/Button'
import { INITIAL_PAGINATION_STATE, LOADER_TYPES } from '../../shared/constants'
import Loader from '../../components/common/Loader'
import { getPaginationQuery, getPaginationState } from '../../utils/InfinitePagination'
import NoDataView from '../../components/common/NoDataView'

let timeout
class RoadPage extends React.Component {
    static getInitialProps() {
        const roadPage = true
        return { roadPage }
    }

    static propTypes = {
        user: PropTypes.shape({
            id: PropTypes.string,
        }),
    }

    static defaultProps = {
        user: null,
    }

    handleFetchRoadList = async (params = {}) => {
        NProgress.start()
        try {
            this.setState({ loadingMode: LOADER_TYPES.STATIONS })
            const query = { ...params, ...this.state.paginationData }
            const response = await fetchStations(getPaginationQuery(query))
            query.response = response
            this.setState({ loadingMode: '', paginationData: getPaginationState(query) })
            NProgress.done()
        } catch (err) {
            this.setState({ loadingMode: '', error: err.message || err.toString() }) // eslint-disable-line
            NProgress.done()
        }
    }

    componentDidMount() {
        this.handleFetchRoadList()
        window.addEventListener('scroll', this.handleScroll)
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
                    this.handleFetchRoadList({ page: pageNumber + 1 })
                }
            }, 300)
        }
    }

    constructor(props) {
        super(props)

        this.state = {
            paginationData: INITIAL_PAGINATION_STATE,
            user: props.user || {},
            station: {},
            deleteMode: '',
            selectedIndex: '',
            editMode: '',
            AddmodalOpen: false,
            loadingMode: '',
        }
    }

    // submit road function to check submitted details
    onRoadSubmit = async (values) => {
        const { station } = this.state
        const { name, latitude, longitude, radius } = station
        await this.addRoadData(station)
    }

    // add road function
    addRoadData = async (data) => {
        NProgress.start()
        try {
            await addStation(data)
            this.handleFetchRoadList({ page: 0 })
            this.setState({ station: {} })
            notify(`${string.station.roadAddedSucessfully}`)
            NProgress.done()
            $('#roadModal').modal('hide')
        } catch (err) {
            notify(`${string.station.errorAddingRoad}`)
            NProgress.done()
        }
    }

    // Function to delete entry from popup
    onDeleteEntry = async (event) => {
        event.preventDefault()
        const {
            deleteMode,
            paginationData: { list },
            selectedIndex,
        } = this.state
        if (deleteMode == 'road') {
            // delete road data
            const roads_data = list[selectedIndex]
            this.setState({ loadingMode: LOADER_TYPES.DELETE })
            const deleteResponse = await removeStation({ id: roads_data.id })
            if (deleteResponse.isDeleted) {
                this.handleFetchRoadList({ isFetchAll: true })
                notify(`${string.station.roadDelatedSucessfully}`)
                $('#deleteModal').modal('hide')
            } else {
                notify(`${string.station.station} ${string.alreadyInProject}`)
            }
            this.setState({ loadingMode: '' })
        }
    }

    // update road function
    updateStation = async () => {
        NProgress.start()
        const { station } = this.state
        try {
            this.setState({ loadingMode: LOADER_TYPES.UPDATE })
            await updateStation(station)
            this.handleFetchRoadList({ isFetchAll: true })
            this.setState({ station: {}, loadingMode: '' })
            notify(`${string.station.roadUpdatedSucessfully}`)
            NProgress.done()
        } catch (err) {
            this.setState({ loadingMode: '' })
            notify(`${string.station.errorAddingRoad}`)
            NProgress.done()
        }
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
            if (mode == 'road') {
                let {
                    paginationData: { list },
                } = this.state
                let station = list[i]
                this.setState({ station })
                this.setState({ editRoadModal: true })
            }
        }
    }

    _resetInput = (state) => {
        this.setState({ station: {}, AddmodalOpen: state })
    }

    render() {
        const { paginationData, station, loadingMode } = this.state
        const isFetchingList = LOADER_TYPES.STATIONS === loadingMode

        return (
            <div>
                <div className='container-fluid'>
                    <div className='row d-flex project-listing'>
                        <div className='tab-pane fade show active mt-3 w-100' id='road' role='tabpanel' aria-labelledby='road-listing'>
                            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                                <h4 className='text-dark'>{string.station.stationListing}</h4>
                                <Autocomplete style={{ display: 'none' }} apiKey={process.env.GOOGLE_API_KEY} />
                                <Button className='btn btn-primary large-btn' onClick={() => this._resetInput(!this.state.AddmodalOpen)}>
                                    {string.station.submitStation}
                                </Button>
                            </div>
                            <div className='project-table-listing table-responsive mt-2 w-100'>
                                <table className='table'>
                                    <thead className='thead-dark'>
                                        <tr>
                                            <th scope='col'>#</th>
                                            <th scope='col'> {string.station.station}</th>
                                            <th scope='col'> {string.latitude}</th>
                                            <th scope='col'>{string.longitude}</th>
                                            <th scope='col'>{string.radius}</th>
                                            <th className='text-center' scope='col'>
                                                {string.actions}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginationData.list.map((station, i) => {
                                            return (
                                                <tr key={i}>
                                                    <td>{i + 1}</td>
                                                    <td>{station.name}</td>
                                                    <td>{station.latitude}</td>
                                                    <td>{station.longitude}</td>
                                                    <td>{station.radius}</td>
                                                    <td>
                                                        <i className='fa fa-pencil-alt' onClick={() => this.setEditMode('road', i)} />
                                                        <i className='fa fa-trash' onClick={() => this.setDeleteMode('road', i)} />
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
                {this.state.AddmodalOpen && <AddModal toggle={() => this._resetInput(!this.state.AddmodalOpen)} isOpen={this.state.AddmodalOpen} paginationData={paginationData} station={station} state={this.setState.bind(this)} onRoadSubmit={this.onRoadSubmit.bind(this)} />}
                {this.state.editRoadModal && <EditModal toggle={() => this.setState({ editRoadModal: !this.state.editRoadModal })} isOpen={this.state.editRoadModal} station={station} state={this.setState.bind(this)} updateStation={this.updateStation.bind(this)} paginationData={paginationData} />}
            </div>
        )
    }
}

export default withAuth(RoadPage, { loginRequired: true })
