import { useEffect, useState } from 'react'
import NProgress from 'nprogress'
import { fetchUserAgreement } from '../lib/api/user-agreement'
import string from '../utils/LanguageTranslation'
import withAuth from '../lib/withAuth'

// const mCustomScrollbar = require('malihu-custom-scrollbar-plugin')

const UserAgreement = () => {
    const [userAgreement, setUserAgreement] = useState('')

    useEffect(() => {
        async function getUserAgreement() {
            const userAgreementData = await fetchUserAgreement()
            setUserAgreement(userAgreementData.agreement)
            NProgress.done()
        }
        getUserAgreement()
    }, [])

    return (
        <>
            <div className='container-fluid'>
                <div className='d-flex align-items-end verify-heading mb-4'>
                    <h4 className='mb-0'>{string.onboarding.userAgreement}</h4>
                </div>
                <div className='user-agreement-content'>
                    <div dangerouslySetInnerHTML={{ __html: userAgreement }} />
                </div>
            </div>
        </>
    )
}

export default withAuth(UserAgreement, { loginRequired: true })
