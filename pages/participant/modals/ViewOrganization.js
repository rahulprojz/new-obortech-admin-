import React, { useState } from 'react'
import classnames from 'classnames'
import { Modal, ModalBody, ModalHeader, FormGroup, Label, Col, TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap'
import { withCookies, useCookies } from 'react-cookie'
import string from '../../../utils/LanguageTranslation'
import { getIpfsImage } from '../../../utils/getIpfsImage'
import { otherLanguage } from '../../../utils/selectedLanguage'
const mimetypes = {
    jpeg: 'image/jpeg',
    JPEG: 'image/jpeg',
    jpg: 'image/jpeg',
    JPG: 'image/jpeg',
    png: 'image/png',
    PNG: 'image/png',
}

const ViewOrganization = ({ isOpen, selectedOrg, onToggle, user }) => {
    const [cookies, setCookie, removeToken] = useCookies(['authToken'])
    const [activeTab, setActiveTab] = useState('1')
    const toggle = (tab) => {
        if (activeTab !== tab) {
            setActiveTab(tab)
        }
    }

    const { name, country, state, city, streetAddress, participant_category, user_type, users, documents, local_name, state_registration_id, unique_id } = selectedOrg
    const orgData = [
        { title: string.organization.engOrgName, value: name || '' },
        { title: string.organization.orgUniqueId, value: unique_id || '' },
        { title: string.onboarding.stateRegId, value: state_registration_id || '' },
        { title: string.userType, value: user_type?.name || '' },
        { title: string.onboarding.streetAddress, value: streetAddress || '' },
        { title: string.onboarding.city, value: city?.name || '' },
        { title: string.onboarding.state, value: state?.name || '' },
        { title: string.onboarding.country, value: country?.name || '' },
    ]

    if (otherLanguage && local_name) orgData.splice(1, 0, { title: string.organization.orgLocalName, value: local_name })
    const adminUser = users ? users[0] : {}
    const userData = [
        { title: string.onboarding.engFirstName, value: adminUser?.first_name || '' },
        { title: string.onboarding.engLastName, value: adminUser?.last_name || '' },
        { title: string.onboarding.email, value: adminUser?.email || '' },
        { title: string.cellNo, value: `${adminUser?.country_code ? adminUser?.country_code + ' ' : ''}${adminUser?.mobile}` || '' },
        { title: string.role, value: adminUser?.role?.name || '' },
        { title: string.onboarding.title, value: adminUser?.user_title?.name || '' },
        { title: string.onboarding.city, value: adminUser?.city?.name || '' },
        { title: string.onboarding.state, value: adminUser?.state?.name || '' },
        { title: string.onboarding.country, value: adminUser?.country?.name || '' },
    ]

    if (adminUser?.registration_number) userData.splice(2, 0, { title: string.onboarding.regNumber, value: adminUser?.registration_number })
    if (otherLanguage && adminUser?.local_last_name) userData.splice(2, 0, { title: string.onboarding.localLastName, value: adminUser?.local_last_name })
    if (otherLanguage && adminUser?.local_first_name) userData.splice(1, 0, { title: string.onboarding.localFirstName, value: adminUser?.local_first_name })
    return (
        <Modal isOpen={isOpen} toggle={onToggle} size={'lg'} className='customModal'>
            <ModalHeader cssModule={{ 'modal-title': 'modal-title text-uppercase text-dark font-weight-bold' }} toggle={onToggle}>
                {string.participant.viewOrg}
            </ModalHeader>
            <ModalBody style={{ userSelect: 'none' }}>
                <Nav tabs className='col-md-12 p-0'>
                    <NavItem className='col-md-6 p-0 text-center'>
                        <NavLink
                            className={classnames({ active: activeTab === '1' })}
                            onClick={() => {
                                toggle('1')
                            }}
                        >
                            {string.onboarding.organization}
                        </NavLink>
                    </NavItem>
                    <NavItem className='col-md-6 p-0 text-center'>
                        <NavLink
                            className={classnames({ active: activeTab === '2' })}
                            onClick={() => {
                                toggle('2')
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
                                                <Label style={{ cursor: 'pointer', color: 'red', fontWeight: 'bold' }} onClick={() => getIpfsImage(user.unique_id, selectedOrg.blockchain_name, document.hash, null, fileType)}>
                                                    {document.name}
                                                </Label>
                                            </Col>
                                        </FormGroup>
                                    </React.Fragment>
                                )
                            })}
                    </TabPane>
                    <TabPane tabId='2' className='mt-4'>
                        {userData.map((item, i) => (
                            <React.Fragment key={i}>
                                <FormGroup row>
                                    <Label for={item.title} style={{ fontWeight: 'bold' }}>
                                        {item.title}:{' '}
                                    </Label>
                                    <Col>
                                        <Label>{item.value}</Label>
                                    </Col>
                                </FormGroup>
                            </React.Fragment>
                        ))}
                    </TabPane>
                </TabContent>
            </ModalBody>
        </Modal>
    )
}

export default withCookies(ViewOrganization)
