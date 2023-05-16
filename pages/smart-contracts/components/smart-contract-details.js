import string from '../../../utils/LanguageTranslation.js'
import Loader from '../../../components/common/Loader'
import { SMART_CONTRACT_PAGE_TAB } from '../../../shared/constants'
import SmartContractComments from './smart-contract-comments'
import SmartContractApprovals from './smart-contract-approvals'
import SmartContractCodeAccess from './smart-contract-code-access'
import CustomSelect from '../../../components/common/form-elements/select/CustomSelect'
import moment from 'moment'
import { useEffect, useState } from 'react'
import Button from '../../../components/common/form-elements/button/Button'
import Link from 'next/link.js'

const SmartContractDetails = ({
    isLoading,
    isLoadingComments,
    isLoadingApprovals,
    isLoadingCodeAccess,
    smartContractDetails,
    approvalsData,
    commentsData,
    codeAccessData,
    onSetEditMode,
    onSetDeleteMode,
    onSetAddMode,
    version,
    name,
    user,
    viewDetails,
    viewDetailsTab,
    getUserData,
    handleFetchSubTab,
    toggleGitAccessModal,
    gitHubRepoDetails,
    selectedSubTab,
}) => {
    //const [selectedSubTab, setSelectedSubTab] = useState(SMART_CONTRACT_PAGE_TAB.COMMENTS);
    const smartContract = smartContractDetails.proposal
    const latest_version = smartContractDetails.latest_version
    var available_versions = []
    for (var i = 0; i < latest_version; i++) {
        available_versions.push(i + 1)
    }

    let git_link = ''
    if (!isLoading) {
        const git_address_full = smartContract.github_commit_address
        var git_link_short = git_address_full.split('/')
        git_link = git_link_short[git_link_short.length - 1]
    }

    return (
        <div className='tab-pane fade show active mt-3 w-100' id='smart_contract_details' role='tabpanel' aria-labelledby='device-listing'>
            {isLoading && <Loader className='pagination-loader' />}
            {!isLoading && (
                <div>
                    <div className='row ml-0 mr-0'>
                        <div className='col-md-4 p-1'>
                            <label htmlFor='smartContractName' className='col-md-3 col-form-label pr-1 pl-0'>
                                {string.smartContract.name} :
                            </label>
                            <label htmlFor='smartContractName' className='col-md-9 col-form-label pr-1'>
                                {smartContract.name}
                            </label>
                        </div>
                        <div className='col-md-3 p-1'>
                            <label htmlFor='tag' className='col-md-4 col-form-label pr-1 pl-0'>
                                {string.smartContract.createdBy} :
                            </label>
                            <label htmlFor='smartContractName' className='col-md-8 col-form-label pr-1'>
                                {smartContract.user_id}
                            </label>
                        </div>
                        <div className='col-md-5 p-1'>
                            <label htmlFor='tag' className='col-md-5 col-form-label pr-1 pl-0'>
                                {string.smartContract.status} :
                            </label>
                            <label htmlFor='smartContractName' className='col-md-7 col-form-label pr-1 text-uppercase'>
                                {smartContract.status}
                            </label>
                        </div>
                    </div>
                    <div className='row ml-0 mr-0'>
                        <div className='col-md-4 p-1'>
                            <div className='row'>
                                <label htmlFor='tag' className='col-md-3 col-form-label pr-1 pl-0'>
                                    {string.smartContract.version} :
                                </label>
                                <CustomSelect
                                    className='form-control col-md-4 pr-1 col-form-label'
                                    onChange={(event) => {
                                        if (event.target.value && event.target.value !== '0') {
                                            viewDetails(event.target.value, smartContract.name)
                                        }
                                    }}
                                    value={`${smartContract.version}`}
                                    name='template_id'
                                >
                                    <option value={0}>{string.smartContract.selectVersion}</option>
                                    {available_versions.map(function (version, i) {
                                        return (
                                            <option value={version} key={i}>
                                                v{version}.0
                                            </option>
                                        )
                                    })}
                                </CustomSelect>
                            </div>
                        </div>
                        <div className='col-md-3 p-1'>
                            <label htmlFor='tag' className='col-md-4 col-form-label pr-1 pl-0'>
                                {string.smartContract.organization} :
                            </label>
                            <label htmlFor='smartContractName' className='col-md-8 col-form-label pr-1'>
                                {smartContract.added_by}
                            </label>
                        </div>
                        <div className='col-md-5 p-1'>
                            <label htmlFor='tag' className='col-md-5 col-form-label pr-1 pl-0 ob-vertical-top'>
                                {string.smartContract.gitAddress} :
                            </label>
                            <label htmlFor='smartContractName' className='col-md-7 col-form-label pr-1 ob-word-wrap-only'>
                                <a href={smartContract.github_commit_address} title={smartContract.github_commit_address} target='_blank'>
                                    {git_link}
                                </a>
                            </label>
                        </div>
                    </div>
                    <div className='row ml-0 mr-0'>
                        <div className='col-md-4 p-1'>
                            <label htmlFor='smartContractName' className='col-md-3 col-form-label pr-1 pl-0 ob-vertical-top'>
                                {string.smartContract.description} :
                            </label>
                            <label htmlFor='smartContractName' className='col-md-8 col-form-label pl-0'>
                                <textarea className='form-control ob-textarea-vertical' maxlength='255' disabled value={smartContract.description} />
                            </label>
                        </div>

                        <div className='col-md-3 p-1'>
                            <label htmlFor='tag' className='col-md-4 col-form-label pr-1 pl-0'>
                                {string.smartContract.dateCreated} :
                            </label>
                            <label htmlFor='smartContractName' className='col-md-8 col-form-label pr-1'>
                                {moment.unix(smartContract.created_at).format('DD-MM-YYYY  HH:mm:ss')}
                            </label>
                            <label htmlFor='tag' className='col-md-4 col-form-label pr-1 pl-0'>
                                {string.smartContract.lastUpdated} :
                            </label>
                            <label htmlFor='smartContractName' className='col-md-8 col-form-label pr-1'>
                                {moment.unix(smartContract.updated_at).format('DD-MM-YYYY  HH:mm:ss')}
                            </label>
                        </div>
                        <div className='col-md-5 p-1'>
                            <label htmlFor='tag' className='col-md-5 col-form-label pr-1 pl-0 ob-vertical-top'>
                                {string.smartContract.packageId} :
                            </label>
                            <label htmlFor='smartContractName' className='col-md-7 col-form-label pr-1 ob-word-wrap-only'>
                                {smartContract.package_id}
                            </label>
                        </div>
                    </div>
                    {/* Comments and Approvals tabs */}
                    <div className='row d-flex project-listing'>
                        <ul className='nav nav-tabs w-100' id='myTab' role='tablist'>
                            <li className='nav-item' onClick={() => handleFetchSubTab(SMART_CONTRACT_PAGE_TAB.COMMENTS, smartContract.name, smartContract.version)}>
                                <a className={selectedSubTab === SMART_CONTRACT_PAGE_TAB.COMMENTS ? 'nav-link active' : 'nav-link'} id='smartcontractcomments' data-toggle='tab' href='#smart_contract_comments' role='tab' aria-controls='smartcontractcomments' aria-selected='true'>
                                    {string.smartContract.comments}
                                </a>
                            </li>
                            <li className='nav-item' onClick={() => handleFetchSubTab(SMART_CONTRACT_PAGE_TAB.APPROVALS, smartContract.name, smartContract.version)}>
                                <a className={selectedSubTab === SMART_CONTRACT_PAGE_TAB.APPROVALS ? 'nav-link active' : 'nav-link'} id='smartcontractapprovals' data-toggle='tab' href='#smart_contract_approvals' role='tab' aria-controls='smartcontractapprovals'>
                                    {string.smartContract.approvals}
                                </a>
                            </li>
                            <li className='nav-item' onClick={() => handleFetchSubTab(SMART_CONTRACT_PAGE_TAB.CODE_ACCESS, smartContract.name, smartContract.version)}>
                                <a className={selectedSubTab === SMART_CONTRACT_PAGE_TAB.CODE_ACCESS ? 'nav-link active' : 'nav-link'} id='smartcontractcodeaccess' data-toggle='tab' href='#smart_contract_code_access' role='tab' aria-controls='smartcontractcodeaccess'>
                                    {string.smartContract.codeAccess}
                                </a>
                            </li>
                        </ul>

                        <div className='tab-content w-100' id='myTabContent'>
                            {selectedSubTab === SMART_CONTRACT_PAGE_TAB.COMMENTS ? (
                                <SmartContractComments
                                    proposalId={smartContractDetails.proposalId}
                                    isLoading={isLoadingComments}
                                    commentsData={commentsData}
                                    onSetEditMode={onSetEditMode}
                                    onSetDeleteMode={onSetDeleteMode}
                                    onSetAddMode={onSetAddMode}
                                    smartContractStatus={smartContract.status}
                                    smartContractDetails={smartContractDetails}
                                    user={user}
                                />
                            ) : (
                                ''
                            )}
                            {selectedSubTab === SMART_CONTRACT_PAGE_TAB.APPROVALS ? (
                                <SmartContractApprovals
                                    proposalId={smartContractDetails.proposalId}
                                    isLoading={isLoadingApprovals}
                                    approvalsData={approvalsData}
                                    onSetEditMode={onSetEditMode}
                                    onSetDeleteMode={onSetDeleteMode}
                                    user={user}
                                    smartContractStatus={smartContract.status}
                                    smartContractDetails={smartContractDetails}
                                />
                            ) : (
                                ''
                            )}
                            {selectedSubTab === SMART_CONTRACT_PAGE_TAB.CODE_ACCESS ? (
                                <SmartContractCodeAccess
                                    proposalId={smartContractDetails.proposalId}
                                    isLoading={isLoadingCodeAccess}
                                    codeAccessData={codeAccessData}
                                    onSetEditMode={onSetEditMode}
                                    onSetDeleteMode={onSetDeleteMode}
                                    user={user}
                                    smartContractStatus={smartContract.status}
                                    smartContractDetails={smartContractDetails}
                                    toggleGitAccessModal={toggleGitAccessModal}
                                    gitHubRepoDetails={gitHubRepoDetails}
                                />
                            ) : (
                                ''
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SmartContractDetails
