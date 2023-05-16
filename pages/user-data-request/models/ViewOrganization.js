import { useEffect, useState } from 'react'
import { withCookies } from 'react-cookie'
import { Modal, ModalBody, ModalHeader, FormGroup, Label, Col, TabContent, TabPane, Nav, NavItem, NavLink, Spinner } from 'reactstrap'
import NProgress from 'nprogress'
import classnames from 'classnames'
import string from '../../../utils/LanguageTranslation'
import { fetchDocument } from '../../../lib/api/organization-documents'
import { getOrg } from '../../../lib/api/organization'
import { callNetworkApi } from '../../../lib/api/network-api'
import { getIpfsImage } from '../../../utils/getIpfsImage'
import notify from '../../../lib/notifier'

const mimetypes = {
    jpeg: 'image/jpeg',
    JPEG: 'image/jpeg',
    jpg: 'image/jpeg',
    JPG: 'image/jpeg',
    png: 'image/png',
    PNG: 'image/png',
}

function ViewOrganization({ isOpen, request, toggle, user, accessToken }) {
    const [isFetchingData, setIsFetchingData] = useState(false)
    const [organizationData, setOrganizationData] = useState({})
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
    })
    const [activeTab, setActiveTab] = useState('1')
    const [documents, setDocuments] = useState([])

    const toggleTabs = (tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab)
        }
    }

    useEffect(() => {
        if (request) {
            _fetchOrganizationData(request)
        }
    }, [request])

    const _fetchOrganizationData = async (request) => {
        NProgress.start()
        setIsFetchingData(true)
        try {
            const user_Uniq_id = request.user.unique_id.toLowerCase()
            const orgName = request.user.organization.blockchain_name.toLowerCase()

            //Get policy by purpose
            const policyReqObj = {
                purpose: request.request_purpose.purpose_key,
            }
            const policyResponse = await callNetworkApi(accessToken, 'get-policy', policyReqObj, false, {}, 'GET')
            if (!policyResponse.success) {
                throw policyResponse.error
            }

            //Get shared user data
            const getUserObj = {
                userId: user_Uniq_id,
                orgName,
            }
            const userResponse = await callNetworkApi(accessToken, '', getUserObj)
            if (!userResponse.success) {
                throw userResponse.error
            }

            //Fetch organization document
            const documentsList = await fetchDocument({ organization_id: request.user.organization_id })
            setDocuments(documentsList)

            //Get organization
            const organization = await getOrg({
                id: request.user.organization_id,
            })
            setOrganizationData(organization)
            setUserData(userResponse.data)
        } catch (err) {
            notify(err.message || err.toString())
        }
        NProgress.done()
        setIsFetchingData(false)
    }

    const { name, country, state, city, streetAddress, user_type } = organizationData
    const orgData = [
        { title: string.organization.orgName, value: name || '' },
        { title: string.userType, value: user_type?.name || '' },
        { title: string.onboarding.streetAddress, value: streetAddress || '' },
        { title: string.onboarding.city, value: city?.name || '' },
        { title: string.onboarding.state, value: state?.name || '' },
        { title: string.onboarding.country, value: country?.name || '' },
    ]

    return (
        <Modal isOpen={isOpen} toggle={toggle} size={'lg'} className='customModal'>
            <ModalHeader cssModule={{ 'modal-title': 'modal-title text-uppercase text-dark font-weight-bold' }} toggle={toggle}>
                {string.participant.viewOrg}
            </ModalHeader>
            <ModalBody>
                {isFetchingData && (
                    <div className='text-center col-md-12'>
                        <Spinner size={'sm'} />
                    </div>
                )}
                {!isFetchingData && (
                    <>
                        <Nav tabs className='col-md-12 p-0'>
                            <NavItem className='col-md-6 p-0 text-center'>
                                <NavLink
                                    className={classnames({ active: activeTab === '1' })}
                                    onClick={() => {
                                        toggleTabs('1')
                                    }}
                                >
                                    {string.onboarding.organization}
                                </NavLink>
                            </NavItem>
                            <NavItem className='col-md-6 p-0 text-center'>
                                <NavLink
                                    className={classnames({ active: activeTab === '2' })}
                                    onClick={() => {
                                        toggleTabs('2')
                                    }}
                                >
                                    {string.userDataRequest.user}
                                </NavLink>
                            </NavItem>
                        </Nav>
                        <TabContent activeTab={activeTab}>
                            <TabPane tabId='1' className='mt-4'>
                                {orgData &&
                                    orgData.map((item, i) => (
                                        <React.Fragment key={i}>
                                            <FormGroup key={i} row>
                                                <Label for={item.title} style={{ fontWeight: 'bold' }}>
                                                    {item.title}:{' '}
                                                </Label>
                                                <Col>
                                                    <Label>{item.value}</Label>
                                                </Col>
                                            </FormGroup>
                                        </React.Fragment>
                                    ))}
                                {documents &&
                                    documents.map((document, i) => {
                                        const nameArray = document.name.split('.')
                                        const type = nameArray[nameArray.length - 1]
                                        const fileType = mimetypes[type]
                                        return (
                                            <React.Fragment key={i}>
                                                <FormGroup key={i} row>
                                                    <Label for={string.Document} style={{ fontWeight: 'bold' }}>
                                                        {string.Document} ({document.document_type.type}):{' '}
                                                    </Label>
                                                    <Col>
                                                        <Label style={{ cursor: 'pointer', color: 'red', fontWeight: 'bold' }} onClick={() => getIpfsImage(user.unique_id, organizationData.blockchain_name, document.hash, null, fileType)}>
                                                            {document.name}
                                                        </Label>
                                                    </Col>
                                                </FormGroup>
                                            </React.Fragment>
                                        )
                                    })}
                            </TabPane>
                            <TabPane tabId='2' className='mt-4'>
                                <div className='form-group use-data-view-block'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='user_email' className='col-md-12 col-form-label pl-0'>
                                            {string.onboarding.firstName}
                                        </label>
                                        <text className='user-data-view'>{userData.firstName}</text>
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='user_email' className='col-md-12 col-form-label pl-0'>
                                            {string.onboarding.lastName}
                                        </label>
                                        <text className='user-data-view'>{userData.lastName}</text>
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='user_email' className='col-md-12 col-form-label pl-0'>
                                            {string.onboarding.validations.emailId}
                                        </label>
                                        <text className='user-data-view'>{userData.email}</text>
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label for='user_mobile' className='col-md-12 col-form-label pl-0'>
                                            {string.onboarding.validations.mobileNo}
                                        </label>
                                        <text className='user-data-view'>{userData.phoneNumber}</text>
                                    </div>
                                </div>
                            </TabPane>
                        </TabContent>
                    </>
                )}
            </ModalBody>
        </Modal>
    )
}

ViewOrganization.propTypes = {}
ViewOrganization.defaultProps = {}

export default withCookies(ViewOrganization)
