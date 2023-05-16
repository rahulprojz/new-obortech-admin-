import string from '../../../utils/LanguageTranslation.js'
import Button from '../../../components/common/form-elements/button/Button'
import { Collapse } from 'reactstrap'
import React, { useState } from 'react'
import moment from 'moment'
import Loader from '../../../components/common/Loader'
import NProgress from 'nprogress'

const SmartContractComments = ({ proposalId, isLoading, commentsData, onSetEditMode, onSetDeleteMode, onSetAddMode, smartContractStatus, smartContractDetails, user }) => {
    const [openAcc, setOpenAcc] = useState(null)
    const _toggleAcc = (idx) => {
        if (idx === openAcc) {
            setOpenAcc(null)
        } else {
            setOpenAcc(idx)
        }
    }
    let orgName = user.organization.blockchain_name.toLowerCase()
    if (orgName == 'obortech') {
        orgName = 'ObortechMSP'
    }

    return (
        <div className='tab-pane fade show active mt-3 w-100' id='smart_contract_comments' role='tabpanel' aria-labelledby='device-listing'>
            {!isLoading && (
                <React.Fragment>
                    <div className='project-table-listing table-responsive mt-2 w-100'>
                        <table className='table'>
                            <thead className='thead-dark'>
                                <tr>
                                    <th scope='col'></th>
                                    <th scope='col'>#</th>
                                    <th scope='col'>{string.smartContract.org}</th>
                                    <th scope='col'>{string.smartContract.comment}</th>
                                    <th scope='col'>{string.smartContract.createdBy}</th>
                                    <th scope='col' className='text-center'>
                                        {string.smartContract.dateCreated}
                                    </th>
                                </tr>
                            </thead>
                            <colgroup>
                                <col style={{ width: '1%' }} />
                                <col style={{ width: '4%' }} />
                                <col style={{ width: '5%' }} />
                                <col style={{ width: '25%' }} />
                                <col style={{ width: '5%' }} />
                                <col style={{ width: '5%' }} />
                            </colgroup>

                            <tbody>
                                {commentsData.map(function (comment, i) {
                                    let shortComment = comment.data.comment
                                    if (comment.data.comment.length > 90) {
                                        shortComment = comment.data.comment.substring(0, 90) + '...'
                                    }
                                    return (
                                        <>
                                            <tr>
                                                <td>
                                                    <i className={openAcc == i + 1 ? 'fa fa-caret-up float-left pr-3' : 'fa fa-caret-down float-left pr-3'} onClick={() => _toggleAcc(i + 1)} />
                                                </td>
                                                <td>{i + 1}</td>
                                                <td>{comment.data.added_by}</td>
                                                <td>{shortComment}</td>
                                                <td>{comment.data.user_id}</td>
                                                <td>{moment.unix(comment.data.created_at).format('DD-MM-YYYY  HH:mm:ss')}</td>
                                            </tr>
                                            <tr className='eventCat'>
                                                <td colSpan='10' className='p-0 eventCatExpand collapsedUser'>
                                                    <Collapse isOpen={openAcc === i + 1}>
                                                        <div className='row'>
                                                            <div className='col-md-9 text-left'>
                                                                <p>{string.smartContract.comment}</p>
                                                                <p className='ob-word-wrap'>{comment.data.comment}</p>
                                                            </div>
                                                            <div className='col-md-3 text-left'>
                                                                <div className='row'>
                                                                    <div className='col-md-6'>{string.smartContract.createdBy}</div>
                                                                    <div className='col-md-6'>{comment.data.user_id}</div>
                                                                </div>
                                                                <div className='row pt-3'>
                                                                    <div className='col-md-6'>{string.smartContract.dateCreated}</div>
                                                                    <div className='col-md-6'>{moment.unix(comment.data.created_at).format('DD-MM-YYYY  HH:mm:ss')}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Collapse>
                                                </td>
                                            </tr>
                                        </>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    {smartContractStatus.toLowerCase() == 'pending' || smartContractStatus.toLowerCase() == 'approved' ? (
                        <Button className='btn btn-primary large-btn float-right text-uppercase' data-toggle='modal' data-target='#commentModal'>
                            {string.smartContract.addComment}
                        </Button>
                    ) : (
                        ''
                    )}
                    {smartContractStatus.toLowerCase() == 'pending' && smartContractDetails.proposal.added_by == orgName ? (
                        <Button className='btn ob-negative-button large-btn float-right mr-3 text-uppercase' data-toggle='modal' data-proposalId={proposalId} data-target='#cancelModal'>
                            {string.smartContract.cancelProposal}
                        </Button>
                    ) : (
                        ''
                    )}
                </React.Fragment>
            )}
            {isLoading && <Loader className='pagination-loader' />}
        </div>
    )
}

export default SmartContractComments
