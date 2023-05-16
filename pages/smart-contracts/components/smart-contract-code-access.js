import string from '../../../utils/LanguageTranslation.js'
import Button from '../../../components/common/form-elements/button/Button'
import Loader from '../../../components/common/Loader'
import NoDataView from '../../../components/common/NoDataView'
import { Collapse } from 'reactstrap'
import React, { useState, useMemo } from 'react'
import moment from 'moment'
import NProgress from 'nprogress'

const SmartContractCodeAccess = ({ proposalId, isLoading, codeAccessData, onSetEditMode, onSetDeleteMode, user, smartContractStatus, smartContractDetails, toggleGitAccessModal, gitHubRepoDetails }) => {
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
        <div className='tab-pane fade show active mt-3 w-100' id='smart_contract_code_access' role='tabpanel' aria-labelledby='device-listing'>
            {!isLoading && (
                <React.Fragment>
                    <div className='project-table-listing ob-access-listing table-responsive mt-2 w-100 code-access-table'>
                        <table className='table'>
                            <thead className='thead-dark'>
                                <tr>
                                    <th scope='col'>#</th>
                                    <th scope='col'>{string.smartContract.org}</th>
                                    <th scope='col'>{string.smartContract.gitUsername}</th>
                                    <th scope='col'>{string.smartContract.membershipStatus}</th>
                                    <th scope='col' className='text-center'>
                                        {string.smartContract.gitAction}
                                    </th>
                                </tr>
                            </thead>
                            <colgroup>
                                <col style={{ width: '5%' }} />
                                <col style={{ width: '35%' }} />
                                <col style={{ width: '25%' }} />
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '20%' }} />
                            </colgroup>

                            <tbody>
                                {codeAccessData.map(function (codeAccess, i) {
                                    let orgNameMSP = codeAccess.organization.blockchain_name.toLowerCase()
                                    if (orgNameMSP == 'obortech') {
                                        orgNameMSP = 'ObortechMSP'
                                    }
                                    let gitNotLinked = false
                                    const gitUserName = codeAccess.organization.users[0].user_github_detail ? codeAccess.organization.users[0].user_github_detail.username : (gitNotLinked = true)
                                    return (
                                        <>
                                            <tr key={i}>
                                                <td>{i + 1}</td>
                                                <td>{orgNameMSP}</td>
                                                <td>{!gitNotLinked ? gitUserName : <span className='ob-branding-color'>GitHub not linked</span>}</td>
                                                <td>{!gitNotLinked ? codeAccess.status : '-'}</td>
                                                <td className='text-center'>
                                                    {!gitNotLinked && codeAccess.organization_id == user.organization_id ? (
                                                        codeAccess.status == 'REJECTED' ? (
                                                            <Button className='btn btn-primary btn-sm ml-2 text-uppercase' onClick={() => toggleGitAccessModal(true, codeAccess, 'REQUEST')}>
                                                                {string.smartContract.gitActionRequest}
                                                            </Button>
                                                        ) : codeAccess.status == 'PENDING' ? (
                                                            <>
                                                                <Button className='btn btn-primary btn-sm text-uppercase' onClick={() => toggleGitAccessModal(true, codeAccess, 'ACCEPT')}>
                                                                    {string.smartContract.gitActionAccept}
                                                                </Button>
                                                                <Button className='btn ob-negative-button btn-sm ml-2 text-uppercase' onClick={() => toggleGitAccessModal(true, codeAccess, 'REJECT')}>
                                                                    {string.smartContract.gitActionReject}
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            ''
                                                        )
                                                    ) : (
                                                        ''
                                                    )}
                                                    {!gitNotLinked && codeAccess.status == 'REQUESTED' && gitHubRepoDetails.host_organization == user.organization_id ? (
                                                        <>
                                                            <Button className='btn btn-primary btn-sm text-uppercase' onClick={() => toggleGitAccessModal(true, codeAccess, 'ACCEPT')}>
                                                                {string.smartContract.gitActionAccept}
                                                            </Button>
                                                            <Button className='btn ob-negative-button btn-sm ml-2 text-uppercase' onClick={() => toggleGitAccessModal(true, codeAccess, 'REJECT')}>
                                                                {string.smartContract.gitActionReject}
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        ''
                                                    )}
                                                </td>
                                            </tr>
                                        </>
                                    )
                                })}
                                <NoDataView list={codeAccessData} isLoading={isLoading} />
                            </tbody>
                        </table>
                    </div>
                </React.Fragment>
            )}
            {isLoading && <Loader className='pagination-loader' />}
        </div>
    )
}

export default SmartContractCodeAccess
