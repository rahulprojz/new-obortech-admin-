import dynamic from 'next/dynamic'
const Footer = dynamic(() => import('../footer/Footer'), { ssr: false })
const SeoMetaData = dynamic(() => import('../SeoMetaData'), { ssr: false })
import Sidebar from '../Sidebar'
import string from '../../utils/LanguageTranslation.js'
import { useDispatch, useSelector } from 'react-redux'
import Button from '../../components/common/form-elements/button/Button'
import { useEffect } from 'react'

const getTitle = (route) => {
    switch (route) {
        case '/allevent':
            return string.eventPageTitle
        case '/category':
            return string.categoriesPageTitle
        case '/device':
            return string.manageDevice
        case '/form-builder':
            return string.formBuilder.formBuilder
        case '/group-1':
            return string.container.manageGroup1
        case '/group-2':
            return string.truck.manageGroup2
        case '/group-3':
            return string.group3Manage
        case '/item':
            return string.item.manageItems
        case '/languages':
            return string.languageRequest.languageListing
        case '/participant':
            return string.organization.manageOrganization
        case '/data-usage-policy':
            return string.policyListing
        case '/privacy-policy':
            return string.privacyPolicy.privacyPolicy
        case '/station':
            return string.station.manageStation
        case '/project':
            return string.project.projectListing
        case '/submission-request':
            return string.submissionRequest.submissionRequest
        case '/track-item':
            return string.trackItem.trackItem
        case '/type-title':
            return string.userTypeTitle.manageUserTypeTitle
        case '/user-data-request':
            return string.userDataRequest.userDataRequestListing
        case '/workers':
            return string.worker.manageWorker
        case '/document-category':
            return string.categoriesPageTitle
        case '/alldocument':
            return string.documentPageTitle
        case '/allanalytics':
            return string.analyticsPageTitle
        case '/iot':
            return string.containerPageTitle
        case '/onboarding':
            return string.onboardingPageTitle
        case '/invitations':
            return string.invitation.invitations
        case '/user-agreement':
            return string.onboarding.userAgreement
        case '/smart-contracts':
            return string.smartContract.title
        case '/smart-contracts/[...proposal]':
            return string.smartContract.title
        case '/nft-management':
            return string.nft.nftPageTitle
        case '/subscription':
            return string.subscription.title
        case '/inventory':
            return string.inventory.inventoryText
        case '/inventory-manager':
            return string.inventory.inventoryManagerText
        default:
            return ''
    }
}

const PageWrapper = ({ route = '', user = {}, children, router }) => {
    const dispatch = useDispatch()
    const ifNotPublicUser = user && user.role_id != process.env.ROLE_PUBLIC_USER ? true : false
    const Header = dynamic(() => import(`../header/${ifNotPublicUser ? 'Header' : 'PublicHeader'}`), { ssr: false })
    return typeof window === 'undefined' ? null : (
        <div id='page-top'>
            <SeoMetaData meta_data={{ title: getTitle(route) }} />
            <div id='wrapper'>
                {ifNotPublicUser && <Sidebar user={user} />}
                <div id='content-wrapper' className={ifNotPublicUser ? 'body-content d-flex flex-column' : 'body-content d-flex flex-column m-0 w-100'}>
                    <div id='content'>
                        <Header user={user} />
                        {children}
                    </div>
                </div>
            </div>
            <Footer user={user} router={router} />
        </div>
    )
}

export default PageWrapper
