import string from '../../../utils/LanguageTranslation.js'
import Button from '../../../components/common/form-elements/button/Button'
import Loader from '../../../components/common/Loader'
import NoDataView from '../../../components/common/NoDataView'

const DeviceList = ({ isLoading, paginationData, onSetEditMode, onSetDeleteMode, onToggle, state }) => {
    return (
        <div className='tab-pane fade show active mt-3 w-100' id='devices' role='tabpanel' aria-labelledby='device-listing'>
            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                <h4 className='text-dark'>{string.deviceListing}</h4>
                <Button
                    className='btn btn-primary large-btn'
                    onClick={() => {
                        onToggle()
                        state({ deviceExists: false })
                    }}
                >
                    {string.submitDevice}
                </Button>
            </div>
            <div className='project-table-listing table-responsive mt-2 w-100'>
                <table className='table'>
                    <thead className='thead-dark'>
                        <tr>
                            <th scope='col'>#</th>
                            <th scope='col'>{string.deviceId}</th>
                            <th scope='col'>{string.tag}</th>
                            <th scope='col'>{string.vendor}</th>
                            <th scope='col'>{string.project.projectNameTxt}</th>
                            <th scope='col'>{string.available}</th>
                            <th className='text-center' scope='col'>
                                {string.actions}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginationData.list.map((device, i) => {
                            const filterDevice = device.selection_devices.filter((selection_device) => {
                                return selection_device?.project_selection?.project?.is_completed == 0
                            })
                            const project = filterDevice.find((device) => !device.project_selection.project.isDraft)
                            const draft = filterDevice.find((device) => device.project_selection.project.isDraft)
                            const projectName = project ? project.project_selection.project.name : draft?.project_selection?.project?.name
                            return (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>{device.deviceID}</td>
                                    <td>{device.tag || '-'}</td>
                                    <td>{device.device_vendor.name}</td>
                                    <td>{`${projectName || ''} ${!project && draft ? string.template : ''}`}</td>
                                    <td>
                                        <i class={`fa fa-circle text-${device.is_available ? 'success' : 'danger'}`}></i>
                                    </td>
                                    <td>
                                        <i className='fa fa-pencil-alt' onClick={() => onSetEditMode('device', i)} />
                                        <i className='fa fa-trash' onClick={() => onSetDeleteMode('device', i)} />
                                    </td>
                                </tr>
                            )
                        })}
                        <NoDataView list={paginationData.list} isLoading={isLoading} />
                    </tbody>
                </table>
            </div>
            {isLoading && <Loader className='pagination-loader' />}
        </div>
    )
}

export default DeviceList
