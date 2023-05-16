import string from '../../../utils/LanguageTranslation.js'
import Button from '../../../components/common/form-elements/button/Button'
import Loader from '../../../components/common/Loader'
import NoDataView from '../../../components/common/NoDataView'

const VendorList = ({ isLoading, paginationData, onSetEditMode, onSetDeleteMode, onToggle }) => {
    return (
        <div className='tab-pane  mt-3 w-100' id='device_vendors' role='tabpanel' aria-labelledby='device-listing'>
            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                <h4 className='text-dark'>{string.deviceVendor}</h4>
                {/* <Button className='btn btn-primary large-btn' onClick={onToggle}>
                    {string.submitVendor}
                </Button> */}
            </div>
            <div className='project-table-listing table-responsive mt-2 w-100'>
                <table className='table'>
                    <thead className='thead-dark'>
                        <tr>
                            <th scope='col'>#</th>
                            <th scope='col'>{string.vendorName}</th>
                            <th scope='col'>{string.key}</th>
                            <th className='text-center' scope='col'>
                                {/* {string.actions} */}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginationData.list.map((vendor, j) => {
                            return (
                                <tr key={j}>
                                    <td>{j + 1}</td>
                                    <td>{vendor.name}</td>
                                    <td>{vendor.api_key}</td>
                                    <td>
                                        {/* <i className='fa fa-pencil-alt' onClick={() => onSetEditMode('devicevendor', j)}></i>
                                        <i className='fa fa-trash' onClick={() => onSetDeleteMode('devicevendor', j)}></i> */}
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

export default VendorList
