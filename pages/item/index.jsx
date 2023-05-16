import PropTypes from 'prop-types'
import DeleteModal from './DeleteModal'
import AddModal from './AddModal'
import EditModal from './EditModal'
import NProgress from 'nprogress'
import notify from '../../lib/notifier'
import withAuth from '../../lib/withAuth'
import string from '../../utils/LanguageTranslation.js'
import { dynamicLanguageStringChange } from '../../utils/globalFunc'
import { fetchItems, addItem, removeItem, updateItem, fetchItemsProject } from '../../lib/api/item'
import Button from '../../components/common/form-elements/button/Button'
import { INITIAL_PAGINATION_STATE, LOADER_TYPES } from '../../shared/constants'
import Loader from '../../components/common/Loader'
import { getPaginationQuery, getPaginationState } from '../../utils/InfinitePagination'
import NoDataView from '../../components/common/NoDataView'

let timeout
class ItemPage extends React.Component {
    static getInitialProps() {
        const itemPage = true
        return { itemPage }
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
            item: {},
            deleteMode: '',
            selectedIndex: '',
            itemProject: '',
            editMode: '',
            itemExists: false,
            AddmodalOpen: false,
            editModalOpen: false,
            loadingMode: '',
        }
    }

    async componentDidMount() {
        this.handleFetchItemList()
        window.addEventListener('scroll', this.handleScroll)
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll)
    }

    handleFetchItemList = async (params = {}) => {
        NProgress.start()
        try {
            this.setState({ loadingMode: LOADER_TYPES.ITEMS })
            const query = { ...params, ...this.state.paginationData }
            const response = await fetchItems(getPaginationQuery(query))
            query.response = response
            this.setState({ loadingMode: '', paginationData: getPaginationState(query) })
            NProgress.done()
        } catch (err) {
            this.setState({ loadingMode: '', error: err.message || err.toString() }) // eslint-disable-line
            NProgress.done()
        }
    }

    async componentDidMount() {
        this.handleFetchItemList()
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
                    this.handleFetchItemList({ page: pageNumber + 1 })
                }
            }, 300)
        }
    }

    _resetInput = async () => {
        return this.setState({ item: {}, itemExists: false, AddmodalOpen: true })
    }

    // submit item function to check submitted details
    onItemSubmit = (event) => {
        const { item } = this.state
        return this.addItemData({ itemID: item.itemID, manualCode: item.manualCode || '' })
    }

    // add item function
    addItemData = async (data) => {
        NProgress.start()
        this.setState({ itemExists: false })
        try {
            const item = await addItem(data)
            if (item?.error) {
                notify(`${item?.error}`)
                return NProgress.done()
            }
            if (item.itemAlreadyExists) {
                this.setState({ itemExists: true })
                NProgress.done()
                return false
            } else {
                this.setState({ itemExists: false, item: {} })
                this.handleFetchItemList({ page: 0 })
                $('#itemModal').modal('hide')
                notify(`${string.item.itemAddedSucessfully}`)
                NProgress.done()
                return true
            }
        } catch (err) {
            console.log(err)
            notify(`${string.item.errorAddingItem}`)
            NProgress.done()
        }
    }

    // Function to delete entry from popup
    onDeleteEntry = async (event) => {
        event.preventDefault()
        let {
            deleteMode,
            itemProject,
            paginationData: { list },
            selectedIndex,
        } = this.state
        if (deleteMode == 'item') {
            // delete item data
            let items_data = list[selectedIndex]
            this.setState({ loadingMode: LOADER_TYPES.DELETE })
            if (items_data.is_available) {
                await removeItem({ id: items_data.id })
                this.handleFetchItemList({ isFetchAll: true })
                notify(`${string.item.itemDelatedSucessfully}`)
                $('#deleteModal').modal('hide')
            } else {
                if (itemProject != 'undefined') {
                    notify(`${string.project.item} ${dynamicLanguageStringChange(string.alreadyInUse, { project: itemProject })}`)
                } else {
                    await removeItem({ id: items_data.id })
                    this.handleFetchItemList({ isFetchAll: true })
                    notify(`${string.item.itemDelatedSucessfully}`)
                }
                $('#deleteModal').modal('hide')
            }
            this.setState({ loadingMode: '' })
        }
    }

    // update item function
    updateItem = async () => {
        NProgress.start()
        this.setState({ itemExists: false })
        let { item } = this.state
        try {
            this.setState({ loadingMode: LOADER_TYPES.UPDATE })
            const itemUpdateResponse = await updateItem(item)
            if (itemUpdateResponse.itemAlreadyExists) {
                this.setState({ itemExists: true, loadingMode: '' })
                NProgress.done()
                return false
            } else {
                this.setState({ itemExists: false, item: {}, loadingMode: '' })
                this.handleFetchItemList({ isFetchAll: true })
                notify(`${string.item.itemUpdatedSucessfully}`)
                NProgress.done()
                return true
            }
        } catch (err) {
            notify(`${string.item.errorAddingItem}`)
            NProgress.done()
        }
    }

    // set delete mode upon selecting delete icon
    setDeleteMode = async (mode, i) => {
        if (mode) {
            const {
                paginationData: { list },
            } = this.state
            const pojectData = await fetchItemsProject({ item_id: list[i]?.id })
            this.setState({ selectedIndex: i, itemProject: `${pojectData?.project_selection?.project?.name}${pojectData?.project_selection?.project?.isDraft ? ' (Draft)' : ''}`, deleteMode: mode })
            $('#deleteModal').modal('show')
        }
    }

    setEditMode = (mode, i) => {
        if (mode) {
            this.setState({ selectedIndex: i, editMode: mode, itemExists: false })
            if (mode == 'item') {
                const {
                    paginationData: { list },
                } = this.state
                let item = list[i]
                this.setState({ item: item, editModalOpen: true })
            }
        }
    }

    editToggle = (state) => {
        this.setState({ editModalOpen: state })
    }

    togglePage = (state) => {
        this.setState({ AddmodalOpen: state, item: {}, itemExists: false })
    }

    render() {
        const { paginationData, item, itemExists, loadingMode, editModalOpen } = this.state
        const isFetchingList = LOADER_TYPES.ITEMS === loadingMode

        return (
            <div>
                <div className='container-fluid'>
                    <div className='row d-flex project-listing'>
                        <div className='tab-pane fade show active mt-3 w-100' id='item' role='tabpanel' aria-labelledby='item-listing'>
                            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                                <h4 className='text-dark'>{string.item.itemsListing}</h4>
                                <Button onClick={this._resetInput} className='btn btn-primary large-btn'>
                                    {string.item.submitItem}
                                </Button>
                            </div>
                            <div className='project-table-listing table-responsive mt-2 w-100'>
                                <table className='table'>
                                    <thead className='thead-dark'>
                                        <tr>
                                            <th scope='col'>#</th>
                                            <th scope='col'> {string.item.itemID}</th>
                                            <th className='text-center' scope='col'>
                                                {string.actions}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginationData.list.map((item, i) => {
                                            return (
                                                <tr key={i}>
                                                    <td>{i + 1}</td>
                                                    <td>{item.itemID}</td>
                                                    <td>
                                                        <i className='fa fa-pencil-alt' onClick={() => this.setEditMode('item', i)}></i>
                                                        <i className='fa fa-trash' onClick={() => this.setDeleteMode('item', i)}></i>
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

                <AddModal toggle={() => this.togglePage(!this.state.AddmodalOpen)} isOpen={this.state.AddmodalOpen} state={this.setState.bind(this)} onItemSubmit={this.onItemSubmit.bind(this)} itemExists={itemExists} />
                {editModalOpen && (
                    <EditModal toggle={() => this.editToggle(!editModalOpen)} isOpen={editModalOpen} item={item} isLoading={LOADER_TYPES.UPDATE === loadingMode} state={this.setState.bind(this)} updateItem={this.updateItem.bind(this)} itemExists={itemExists} />
                )}
            </div>
        )
    }
}

export default withAuth(ItemPage, { loginRequired: true })
