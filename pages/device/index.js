import PropTypes from 'prop-types'
import DeleteModal from './DeleteModal'
import AddModal from './AddModal'
import AddVendorModal from './AddVendorModal'
import EditModal from './EditModal'
import EditVendorModal from './EditVendorModal'
import NProgress from 'nprogress'
import notify from '../../lib/notifier'
import string from '../../utils/LanguageTranslation.js'
import withAuth from '../../lib/withAuth'
import { fetchDevices, addDevice, removeDevice, updateDevice } from '../../lib/api/device'
import { dynamicLanguageStringChange } from '../../utils/globalFunc'
import { fetchDeviceVendors, addDeviceVendor, removeDeviceVendor, updateDeviceVendor } from '../../lib/api/device-vendor'
import { INITIAL_PAGINATION_STATE, DEVICE_PAGE_TAB, LOADER_TYPES } from '../../shared/constants'
import DeviceList from './components/device-list'
import VendorList from './components/vendor-list'
import { getPaginationQuery, getPaginationState } from '../../utils/InfinitePagination'

let timeout
class DevicePage extends React.Component {
    static getInitialProps() {
        const devicePage = true
        return { devicePage }
    }

    static propTypes = {
        user: PropTypes.shape({
            id: PropTypes.string,
        }),
    }

    static defaultProps = {
        user: null,
    }

    handleFetchList = async (params = {}) => {
        NProgress.start()
        try {
            const { paginationDeviceData, paginationVendorData } = this.state
            const data = { loadingMode: '' }
            this.setState({ loadingMode: LOADER_TYPES.FETCHING })
            if (params.selectedTab === DEVICE_PAGE_TAB.VENDOR) {
                const query = { ...params, ...paginationVendorData }
                const response = await fetchDeviceVendors(getPaginationQuery(query))
                query.response = response
                data.paginationVendorData = getPaginationState(query)
            } else {
                const query = { ...params, ...paginationDeviceData }
                const response = await fetchDevices(getPaginationQuery(query))
                query.response = response
                data.paginationDeviceData = getPaginationState(query)
            }
            this.setState(data)
            NProgress.done()
        } catch (err) {
            this.setState({ loadingMode: '', error: err.message || err.toString() }) // eslint-disable-line
            NProgress.done()
        }
    }

    componentDidMount() {
        this.handleFetchList({ selectedTab: DEVICE_PAGE_TAB.DEVICE })
        this.handleFetchList({ selectedTab: DEVICE_PAGE_TAB.VENDOR })
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
                const { selectedTab, paginationDeviceData, paginationVendorData } = this.state
                const { list, totalCount, pageNumber } = selectedTab === DEVICE_PAGE_TAB.DEVICE ? paginationDeviceData : paginationVendorData
                if (list.length < totalCount) {
                    this.handleFetchList({ selectedTab, page: pageNumber + 1 })
                }
            }, 300)
        }
    }

    constructor(props) {
        super(props)
        this.state = {
            paginationDeviceData: INITIAL_PAGINATION_STATE,
            user: props.user || {},
            paginationVendorData: INITIAL_PAGINATION_STATE,
            device: {},
            values: {},
            vendor: {},
            deleteMode: '',
            deviceProject: '',
            selectedIndex: '',
            editMode: '',
            deviceExists: false,
            selectedTab: DEVICE_PAGE_TAB.DEVICE,
            loadingMode: '',
            addVendorModal: false,
            editVendorModal: false,
            addDeviceModal: false,
            editDeviceModal: false,
        }
    }

    toggleAddDevice = () => {
        this.setState((prev) => ({ addDeviceModal: !prev.addDeviceModal }))
    }

    toggleEditDevice = () => {
        this.setState((prev) => ({ editDeviceModal: !prev.editDeviceModal }))
    }

    toggleAddVendor = () => {
        this.setState((prev) => ({ addVendorModal: !prev.addVendorModal }))
    }

    toggleEditVendor = () => {
        this.setState((prev) => ({ editVendorModal: !prev.editVendorModal }))
    }
    // submit device function to check submitted details
    onDeviceSubmit = async (values) => {
        const { deviceID, vendor_id, tag } = values
        return this.addDeviceData({ deviceID, vendor_id, tag })
    }

    // submit device vendor function to check submitted details
    onVendorSubmit = (event) => {
        const { vendor } = this.state
        const { name, api_key } = vendor
        this.addDeviceVendor({ name: name, api_key: api_key })
    }

    // add device function
    addDeviceData = async (data) => {
        NProgress.start()
        try {
            this.setState({ loadingMode: LOADER_TYPES.ADD })
            const device = await addDevice(data)
            if (device.deviceAlreadyExists) {
                this.setState({ deviceExists: true, loadingMode: '' })
                NProgress.done()
                return false
            }
            this.setState({ deviceExists: false, values: {}, loadingMode: '' })
            this.handleFetchList({ page: 0, selectedTab: DEVICE_PAGE_TAB.DEVICE })
            notify(string.deviceAddSuccess)
            NProgress.done()
            return true
        } catch (err) {
            this.setState({ loadingMode: '' })
            notify(string.deviceAddErr)
            NProgress.done()
            return false
        }
    }

    // add device vendor function
    addDeviceVendor = async (data) => {
        NProgress.start()
        try {
            this.setState({ loadingMode: LOADER_TYPES.ADD })
            const devicevendor = await addDeviceVendor(data)
            if (devicevendor.deviceAlreadyExists) {
                this.setState({ deviceExists: true, loadingMode: '' })
                NProgress.done()
                return false
            }
            this.setState({ deviceExists: false, loadingMode: '' })
            this.handleFetchList({ page: 0, selectedTab: DEVICE_PAGE_TAB.VENDOR })
            notify(string.vendorAddedSuccess)
            NProgress.done()
        } catch (err) {
            this.setState({ loadingMode: '' })
            console.error(err)
            notify(string.deviceAddErr)
            NProgress.done()
        }
    }

    // Function to delete entry from popup
    onDeleteEntry = async (event) => {
        event.preventDefault()
        let { deleteMode, deviceProject, paginationDeviceData, paginationVendorData, selectedIndex } = this.state
        if (deleteMode == 'device') {
            // delete device data
            let devices_data = paginationDeviceData.list[selectedIndex]
            this.setState({ loadingMode: LOADER_TYPES.DELETE })
            if (devices_data.is_available) {
                await removeDevice({ id: devices_data.id })
                this.handleFetchList({ isFetchAll: true, selectedTab: DEVICE_PAGE_TAB.DEVICE })
                notify(string.deviceDelSuccess)
                $('#deleteModal').modal('hide')
            } else {
                if (deviceProject != 'undefined') {
                    notify(`${string.project.device} ${dynamicLanguageStringChange(string.alreadyInUse, { project: deviceProject })}`)
                } else {
                    await removeDevice({ id: devices_data.id })
                    this.handleFetchList({ isFetchAll: true, selectedTab: DEVICE_PAGE_TAB.DEVICE })
                    notify(string.deviceDelSuccess)
                }
                $('#deleteModal').modal('hide')
            }
            this.setState({ loadingMode: '' })
        }
        if (deleteMode == 'devicevendor') {
            // delete device vendor data
            let device_vendor = paginationVendorData.list[selectedIndex]
            this.setState({ loadingMode: LOADER_TYPES.DELETE })
            const deleteResponse = await removeDeviceVendor({ id: device_vendor.id })
            if (deleteResponse.isDeleted) {
                this.handleFetchList({ isFetchAll: true, selectedTab: DEVICE_PAGE_TAB.VENDOR })
                notify(string.deviceVendorAddedSuccess)
                $('#deleteModal').modal('hide')
            } else {
                notify(string.deviceVendorExistingInDevice)
            }
            this.setState({ loadingMode: '' })
        }
    }

    // update device function
    updateDevice = async () => {
        NProgress.start()
        let { device } = this.state
        try {
            this.setState({ loadingMode: LOADER_TYPES.UPDATE })
            const devicedata = await updateDevice(device)
            if (devicedata.deviceAlreadyExists) {
                this.setState({ deviceExists: true, loadingMode: '' })
                NProgress.done()
                return false
            }
            this.handleFetchList({ isFetchAll: true, selectedTab: DEVICE_PAGE_TAB.DEVICE })
            this.setState({ loadingMode: '' })
            this.toggleEditDevice()
            notify(string.deviceUpdateSuccess)
            NProgress.done()
            return true
        } catch (err) {
            this.setState({ loadingMode: '' })
            console.error(err)
            notify(string.deviceAddErr)
            NProgress.done()
            return false
        }
    }

    //Update device vendor
    updateVendor = async () => {
        NProgress.start()
        let { vendor } = this.state
        try {
            this.setState({ loadingMode: LOADER_TYPES.UPDATE })
            const updated_vendor = await updateDeviceVendor(vendor)
            if (updated_vendor.error != undefined) {
                notify(updated_vendor.error)
                NProgress.done()
                return false
            }
            this.handleFetchList({ isFetchAll: true, selectedTab: DEVICE_PAGE_TAB.VENDOR })
            this.setState({ loadingMode: '' })
            this.toggleEditVendor()
            notify(string.deviceVendorUpdatedSuccess)
            NProgress.done()
        } catch (err) {
            this.setState({ loadingMode: '' })
            console.error(err)
            notify(string.deviceAddErr)
            NProgress.done()
        }
    }

    // set delete mode upon selecting delete icon
    setDeleteMode = async (mode, i) => {
        if (mode) {
            const {
                paginationDeviceData: { list },
            } = this.state
            const pojectData = list[i].selection_devices[0]?.project_selection?.project
            this.setState({ deleteMode: mode, selectedIndex: i, deviceProject: `${pojectData?.name}${pojectData?.isDraft ? ` ${string.template}` : ''}` })
            $('#deleteModal').modal('show')
        }
    }

    setEditMode = (mode, i) => {
        if (mode) {
            this.setState({ editMode: mode })
            this.setState({ selectedIndex: i })
            if (mode == 'device') {
                this.setState({ deviceExists: false })
                const {
                    paginationDeviceData: { list },
                } = this.state
                let device = list[i]
                this.setState({ device })
                this.toggleEditDevice()
            }
            if (mode == 'devicevendor') {
                const {
                    paginationVendorData: { list },
                } = this.state
                let vendor = list[i]
                this.setState({ vendor })
                this.toggleEditVendor()
            }
        }
    }

    render() {
        // if (window) console.log('window.innerHeight', window.innerHeight)
        const { device, paginationDeviceData, paginationVendorData, vendor, deviceExists, values, loadingMode } = this.state
        const isFetchingList = LOADER_TYPES.FETCHING === loadingMode

        return (
            <div>
                <div className='container-fluid'>
                    <div className='row d-flex project-listing'>
                        <ul className='nav nav-tabs w-100' id='myTab' role='tablist'>
                            <li className='nav-item' onClick={() => this.setState({ selectedTab: DEVICE_PAGE_TAB.DEVICE })}>
                                <a className='nav-link active' id='devicelisting' data-toggle='tab' href='#devices' role='tab' aria-controls='devices' aria-selected='true'>
                                    {string.allDevice}
                                </a>
                            </li>
                            <li className='nav-item' onClick={() => this.setState({ selectedTab: DEVICE_PAGE_TAB.VENDOR })}>
                                <a className='nav-link' id='devicevendorlisting' data-toggle='tab' href='#device_vendors' role='tab' aria-controls='devicevendors'>
                                    {string.deviceVendor}
                                </a>
                            </li>
                        </ul>

                        <div className='tab-content w-100' id='myTabContent'>
                            <DeviceList isLoading={isFetchingList} paginationData={paginationDeviceData} onSetEditMode={this.setEditMode} onSetDeleteMode={this.setDeleteMode} onToggle={this.toggleAddDevice} state={this.setState.bind(this)} />
                            <VendorList isLoading={isFetchingList} paginationData={paginationVendorData} onSetEditMode={this.setEditMode} onSetDeleteMode={this.setDeleteMode} onToggle={this.toggleAddVendor} />
                        </div>
                    </div>
                </div>

                <div className='modal fade customModal document' id='deleteModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                    <DeleteModal isLoading={loadingMode === LOADER_TYPES.DELETE} onDeleteEntry={this.onDeleteEntry} />
                </div>
                {this.state.addDeviceModal && (
                    <AddModal
                        isOpen={this.state.addDeviceModal}
                        toggle={this.toggleAddDevice}
                        isLoading={loadingMode === LOADER_TYPES.ADD}
                        state={this.setState.bind(this)}
                        values={values}
                        device={device}
                        devicevendors={paginationVendorData.list}
                        deviceExists={deviceExists}
                        onDeviceSubmit={this.onDeviceSubmit.bind(this)}
                    />
                )}
                <AddVendorModal isOpen={this.state.addVendorModal} toggle={this.toggleAddVendor} isLoading={loadingMode === LOADER_TYPES.ADD} state={this.setState.bind(this)} onVendorSubmit={this.onVendorSubmit.bind(this)} />
                <EditModal
                    isOpen={this.state.editDeviceModal}
                    toggle={this.toggleEditDevice}
                    isLoading={loadingMode === LOADER_TYPES.UPDATE}
                    device={device}
                    deviceExists={deviceExists}
                    state={this.setState.bind(this)}
                    devicevendors={paginationVendorData.list}
                    updateDevice={this.updateDevice.bind(this)}
                />
                <EditVendorModal isOpen={this.state.editVendorModal} toggle={this.toggleEditVendor} isLoading={loadingMode === LOADER_TYPES.UPDATE} vendor={vendor} state={this.setState.bind(this)} updateVendor={this.updateVendor.bind(this)} />
            </div>
        )
    }
}

export default withAuth(DevicePage, { loginRequired: true })
