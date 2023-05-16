import string from '../../../utils/LanguageTranslation.js'
import Loader from '../../../components/common/Loader'
import NoDataView from '../../../components/common/NoDataView'
import moment from 'moment'

const SmartContractList = ({ isLoading, paginationData, viewSmartContractDetails, editSmartContractDetails, user, viewCancelModal }) => {
    let orgName = user.organization.blockchain_name.toLowerCase()
    if (orgName == 'obortech') {
        orgName = 'ObortechMSP'
    }
    return (
        <div className='tab-pane fade show active mt-3 w-100' id='smart_contracts' role='tabpanel' aria-labelledby='contract-listing'>
            <div className='project-table-listing table-responsive mt-2 w-100'>
                <table className='table'>
                    <thead className='thead-dark'>
                        <tr>
                            <th scope='col'>#</th>
                            <th scope='col'>{string.smartContract.name}</th>
                            <th scope='col'>{string.smartContract.description}</th>
                            <th scope='col'>{string.smartContract.version}</th>
                            <th scope='col'>{string.smartContract.createdBy}</th>
                            <th scope='col'>{string.smartContract.dateCreated}</th>
                            <th scope='col'>{string.smartContract.lastUpdated}</th>
                            <th scope='col'>{string.smartContract.status}</th>
                            <th scope='col' className='text-center'>
                                {string.smartContract.action}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginationData.map(function (smartContract, i) {
                            let shortDescription = smartContract.data.description
                            if (smartContract.data.description.length > 10) {
                                shortDescription = smartContract.data.description.substring(0, 10) + '...'
                            }
                            return (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>{smartContract.data.name}</td>
                                    <td title={smartContract.data.description}>{shortDescription}</td>
                                    <td>v{smartContract.data.version}.0</td>
                                    <td>{smartContract.data.added_by}</td>
                                    <td>{moment.unix(smartContract.data.created_at).format('DD-MM-YYYY  HH:mm:ss')}</td>
                                    <td>{moment.unix(smartContract.data.updated_at).format('DD-MM-YYYY  HH:mm:ss')}</td>
                                    <td className='text-uppercase'>{smartContract.data.status}</td>
                                    <td>
                                        {smartContract.data.is_committed && smartContract.data.is_latest ? (
                                            <i className='fa fa-plus' title={string.smartContract.addNewProposal} onClick={() => editSmartContractDetails(smartContract.data.name, smartContract.data.version)} />
                                        ) : (
                                            <i className='fa fa-plus text-muted ob-ban-pointer invisible' title={string.smartContract.notAllowed} />
                                        )}
                                        <i className='fa fa-eye' title={string.smartContract.viewDetails} onClick={() => viewSmartContractDetails(smartContract.data.name, smartContract.data.version, smartContract.id, true)} />
                                        {smartContract.data.added_by == orgName && smartContract.data.status == 'pending' ? (
                                            <i className='fa fa-ban' title={string.smartContract.cancelProposal} onClick={() => viewCancelModal(smartContract.id)} />
                                        ) : (
                                            <i className='fa fa-ban text-muted ob-ban-pointer invisible' title={smartContract.data.status == 'cancelled' ? string.smartContract.cancelled : string.smartContract.notAllowed} />
                                        )}
                                    </td>
                                </tr>
                            )
                        })}

                        <NoDataView list={paginationData} isLoading={isLoading} />
                    </tbody>
                </table>
            </div>
            {isLoading && <Loader className='pagination-loader' />}
        </div>
    )
}

export default SmartContractList
