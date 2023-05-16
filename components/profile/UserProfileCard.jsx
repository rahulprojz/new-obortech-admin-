import React from 'react'
import { useRouter } from 'next/router'
import { Button } from 'react-bootstrap'
import CustomSelect from '../common/form-elements/select/CustomSelect'
import string from '../../utils/LanguageTranslation.js'
import notify from '../../lib/notifier'
import { getMVSToken } from '../../lib/api/sendRequest'
import { userVerification, organizationVerification, checkUserVerification, checkOrganizationVerification } from '../../lib/api/onboarding'
import { updateUser } from '../../lib/api/user'
import { updateOrganization } from '../../lib/api/organization'

function UserProfileCard(props) {
    const router = useRouter()
    const { icon, heading, stateRegId, caption, idData, regData, user, showVerified, approverOrgs, userData, from = 'orgApprovalModal' } = props
    const mvsVerifiedUser = userData?.is_mvs_verified
    const mvsVerifiedOrg = userData?.organization?.is_mvs_verified
    const isNotCEOUser = userData?.role_id != process.env.ROLE_CEO

    const MVSVerified = (
        <>
            <img className='mx-1' src='/static/img/verified.png' alt='verified' /> {string.mvsVerified}
        </>
    )
    const MVSNotVerified = (
        <>
            <img className='mx-1' src='/static/img/not-verify.png' alt='not-verified' /> {string.mvsNotVerified}
        </>
    )
    const verifyWithMVS = async () => {
        const { unique_id, local_first_name, local_last_name, registration_number, organization } = userData
        const verificationToken = await getMVSToken()
        let verificationData = {}
        const headers = {
            Authorization: verificationToken.token,
        }
        if (showVerified == '1') {
            verificationData = await organizationVerification(
                {
                    firstName: local_first_name,
                    lastName: local_last_name,
                    memberId: unique_id,
                    registerNumber: registration_number,
                    organizationId: organization.unique_id,
                    organizationName: organization.local_name,
                    organizationRegister: organization.state_registration_id,
                },
                { headers },
            )
            await updateOrganization({ ...organization, is_mvs_verified: 0 })
        } else {
            verificationData = await userVerification(
                {
                    firstName: local_first_name,
                    lastName: local_last_name,
                    memberId: unique_id,
                    registerNumber: registration_number,
                },
                { headers },
            )
            await updateUser({ ...userData, is_mvs_verified: 0 })
        }
        if (verificationData?.id) {
            const queryKeyStr = showVerified == '1' ? 'orgStatus' : 'userStatus'
            const queryObject = {
                s_url: `${window.location.href}?${queryKeyStr}=success`,
                e_url: `${window.location.href}?${queryKeyStr}=failed`,
                id: verificationData.id,
                type: showVerified == '1' ? 'organization' : 'user',
            }
            router.push({
                pathname: process.env.MVS_AUTH_URL,
                query: queryObject,
            })
        } else {
            notify(string.onboarding.validations.verificationReject)
        }
    }

    return (
        <>
            <div className={`profile-card d-flex justify-content-between${from != 'profile' && showVerified == '0' ? ' p-0' : ''}`}>
                <div>
                    <div className='d-flex'>
                        <div className={icon} />
                        <div className='text-wrap'>
                            <h3>{heading}</h3>
                            {!!stateRegId && <h3>{`${string.onboarding.stateRegId}: ${stateRegId}`}</h3>}
                            <span>{caption}</span>
                        </div>
                    </div>
                    {!!idData && (
                        <>
                            <hr className='m-1' />
                            <div className='userOrgId'>
                                <span>
                                    {idData.label}: {idData.id}
                                    <i
                                        style={{ fontSize: '15px' }}
                                        className='far fa-clone ml-2 cursor-pointer'
                                        title='Copy'
                                        onClick={() => {
                                            navigator.clipboard.writeText(idData.id)
                                            notify(`${string.event.documentHashCopied} ${idData.id}`)
                                        }}
                                    />
                                </span>
                                <br />
                            </div>
                        </>
                    )}
                    {!!regData && (
                        <div className='userOrgId'>
                            <span>
                                {regData.label}: {regData.id}
                            </span>
                            <br />
                        </div>
                    )}
                </div>
                {showVerified == '1' && (
                    <div className='label-wrap verified-users-dropdown'>
                        <label className='font-weight-bold'>{string.orgVerifiedBy}</label>
                        <CustomSelect className='form-control'>
                            {approverOrgs?.length > 0 &&
                                approverOrgs?.map(
                                    (item) =>
                                        item.approver && (
                                            <option key={item.approver?.name} value={item.approver?.name}>
                                                {item.approver?.name}
                                            </option>
                                        ),
                                )}
                        </CustomSelect>
                    </div>
                )}
            </div>
            {userData && !mvsVerifiedUser ? (
                <Button
                    variant={showVerified == '1' ? (mvsVerifiedOrg ? 'outline-success' : 'outline-secondary') : mvsVerifiedUser ? 'outline-success' : 'outline-secondary'}
                    className='px-2 py-1'
                    style={{ margin: '0 0 20px 35px' }}
                    disabled={(showVerified == '1' ? (mvsVerifiedUser ? mvsVerifiedOrg || isNotCEOUser : true) : mvsVerifiedUser) || from != 'profile'}
                    onClick={() => verifyWithMVS()}
                >
                    {showVerified == '1' ? (mvsVerifiedOrg ? MVSVerified : MVSNotVerified) : mvsVerifiedUser ? MVSVerified : MVSNotVerified}
                </Button>
            ) : (
                <div className='ml-4 mb-3'>{user.contry_id === 146 ? MVSVerified : null}</div>
            )}
        </>
    )
}
export default UserProfileCard
