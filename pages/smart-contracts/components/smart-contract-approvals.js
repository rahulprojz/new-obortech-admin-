import string from '../../../utils/LanguageTranslation.js'
import Button from '../../../components/common/form-elements/button/Button'
import Loader from '../../../components/common/Loader'
import NoDataView from '../../../components/common/NoDataView'
import { Collapse } from 'reactstrap'
import React, { useState, useMemo } from 'react'
import moment from 'moment'
import NProgress from 'nprogress'
import { sanitizeOrgName } from '../../../utils/commonHelper.js'

const SmartContractApprovals = ({ proposalId, isLoading, approvalsData, onSetEditMode, onSetDeleteMode, user, smartContractStatus, smartContractDetails }) => {
    let orgName = user.organization.blockchain_name.toLowerCase()
    if (orgName == 'obortech') {
        orgName = 'ObortechMSP'
    }
    const [openAcc, setOpenAcc] = useState(null)
    const _toggleAcc = (idx) => {
        if (idx === openAcc) {
            setOpenAcc(null)
        } else {
            setOpenAcc(idx)
        }
    }

    return (
        <div className='tab-pane fade show active mt-3 w-100' id='smart_contract_approvals' role='tabpanel' aria-labelledby='device-listing'>
            {!isLoading && (
                <React.Fragment>
                    <div className='project-table-listing table-responsive mt-2 w-100 approvals-table'>
                        <table className='table'>
                            <thead className='thead-dark'>
                                <tr>
                                    <th scope='col'></th>
                                    <th scope='col'>#</th>
                                    <th scope='col'>{string.smartContract.org}</th>
                                    <th scope='col'>{string.smartContract.name}</th>
                                    <th scope='col'>{string.smartContract.memo}</th>
                                    <th scope='col'>{string.smartContract.approvedBy}</th>
                                    <th scope='col'>{string.smartContract.dateCreated}</th>
                                    <th scope='col'>{string.smartContract.approveDate}</th>
                                    <th scope='col'>{string.smartContract.status}</th>
                                </tr>
                            </thead>
                            <colgroup>
                                <col style={{ width: '1%' }} />
                                <col style={{ width: '4%' }} />
                                <col style={{ width: '5%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '20%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '10%' }} />
                            </colgroup>

                            <tbody>
                                {approvalsData.map(function (approval, i) {
                                    let shortDescription = approval.data.description
                                    if (approval.data.description.length > 40) {
                                        shortDescription = approval.data.description.substring(0, 40) + '...'
                                    }
                                    return (
                                        <>
                                            <tr>
                                                <td>
                                                    <i className={openAcc == i + 1 ? 'fa fa-caret-up float-left pr-3' : 'fa fa-caret-down float-left pr-3'} onClick={() => _toggleAcc(i + 1)} />
                                                </td>
                                                <td>{i + 1}</td>
                                                <td>{approval.data.added_by}</td>
                                                <td>{approval.data.name}</td>
                                                <td>{shortDescription}</td>
                                                <td>{approval.data.user_id}</td>
                                                <td>{moment.unix(approval.data.created_at).format('DD-MM-YYYY  HH:mm:ss')}</td>
                                                <td>{approval.data.status === 'approved' ? moment.unix(approval.data.approved_at).format('DD-MM-YYYY  HH:mm:ss') : '-'}</td>
                                                <td className='text-uppercase'>
                                                    {approval.data.status}
                                                    {(approval.data.status == 'pending' && sanitizeOrgName(approval.data.added_by) == sanitizeOrgName(orgName) && smartContractStatus.toLowerCase() == 'pending') ||
                                                    (approval.data.status == 'pending' && sanitizeOrgName(approval.data.added_by) == sanitizeOrgName(orgName) && smartContractStatus.toLowerCase() == 'approved') ? (
                                                        <i className='fa fa-check-square' title={string.smartContract.approve} data-toggle='modal' data-target='#approveModal' />
                                                    ) : (
                                                        <i className='fa fa-check-square invisible' />
                                                    )}
                                                </td>
                                            </tr>
                                            <tr className='eventCat'>
                                                <td colSpan='10' className='p-0 eventCatExpand collapsedUser'>
                                                    <Collapse isOpen={openAcc === i + 1}>
                                                        <div className='row'>
                                                            <div className='col-md-6 text-left'>
                                                                <div className='row'>
                                                                    <div className='col-md-4'>{string.smartContract.name}</div>
                                                                    <div className='col-md-8'>{approval.data.name}</div>
                                                                </div>
                                                            </div>
                                                            <div className='col-md-6 text-left'>
                                                                <div className='row'>
                                                                    <div className='col-md-4'>{string.smartContract.approvedBy}</div>
                                                                    <div className='col-md-8'>{approval.data.user_id}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className='row'>
                                                            <div className='col-md-6 text-left'>
                                                                <div className='row pt-3'>
                                                                    <div className='col-md-4'>
                                                                        <p>{string.smartContract.memo}</p>
                                                                    </div>
                                                                    <div className='col-md-8'>
                                                                        <textarea className='form-control ob-textarea-vertical' maxlength='255' disabled value={approval.data.description} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className='col-md-6 text-left'>
                                                                <div className='row pt-3'>
                                                                    <div className='col-md-4'>{string.smartContract.organization}</div>
                                                                    <div className='col-md-8'>{approval.data.added_by}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className='row'>
                                                            <div className='col-md-6 text-left'>
                                                                <div className='row pt-3'>
                                                                    <div className='col-md-4'>{string.smartContract.dateCreated}</div>
                                                                    <div className='col-md-8'>{moment.unix(approval.data.created_at).format('DD-MM-YYYY  HH:mm:ss')}</div>
                                                                </div>
                                                            </div>
                                                            <div className='col-md-6 text-left'>
                                                                <div className='row pt-3'>
                                                                    <div className='col-md-4'>{string.smartContract.approveDate}</div>
                                                                    <div className='col-md-8'>{approval.data.status === 'approved' ? moment.unix(approval.data.approved_at).format('DD-MM-YYYY  HH:mm:ss') : '-'}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {(approval.data.status == 'pending' && sanitizeOrgName(approval.data.added_by) == sanitizeOrgName(orgName) && smartContractStatus.toLowerCase() == 'pending') ||
                                                        (approval.data.status == 'pending' && sanitizeOrgName(approval.data.added_by) == sanitizeOrgName(orgName) && smartContractStatus.toLowerCase() == 'approved') ? (
                                                            <div className='row'>
                                                                <div className='col-md-12 float-right'>
                                                                    <Button className='default-css btn btn-primary btn-md  float-right' data-toggle='modal' data-target='#approveModal'>
                                                                        {string.smartContract.approve}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            ''
                                                        )}
                                                    </Collapse>
                                                </td>
                                            </tr>
                                        </>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className='row ml-0 mr-0'>
                        <div className='col-md-6 p-1 offset-md-6 float-right'>
                            {smartContractStatus.toLowerCase() == 'installed' && (
                                <Button className='btn btn-primary large-btn float-right text-uppercase' data-toggle='modal' data-target='#commitModal'>
                                    {string.smartContract.commit}
                                </Button>
                            )}
                            {smartContractStatus.toLowerCase() == 'pending' && smartContractDetails.proposal.added_by == orgName ? (
                                <Button className='btn ob-negative-button large-btn float-right mr-3 text-uppercase' data-toggle='modal' data-proposalId={proposalId} data-target='#cancelModal'>
                                    {string.smartContract.cancelProposal}
                                </Button>
                            ) : (
                                ''
                            )}
                        </div>
                    </div>
                </React.Fragment>
            )}
            {isLoading && <Loader className='pagination-loader' />}
        </div>
    )
}

export default SmartContractApprovals
