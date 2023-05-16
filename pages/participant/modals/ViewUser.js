import React, { useEffect, useState } from 'react'
import classnames from 'classnames'
import { Modal, ModalBody, ModalHeader, FormGroup, Label, Col, TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap'
import { otherLanguage } from '../../../utils/selectedLanguage'
import string from '../../../utils/LanguageTranslation'

const ViewUser = ({ isOpen, selectedUser, onToggle }) => {
    const user = selectedUser || {}
    const userData = [
        { title: string.onboarding.engFirstName, value: user?.first_name || '' },
        { title: string.onboarding.engLastName, value: user?.last_name || '' },
        { title: string.onboarding.email, value: user?.email || '' },
        { title: string.cellNo, value: `${user?.country_code ? user?.country_code + ' ' : ''}${user?.mobile}` || '' },
        { title: string.role, value: user?.role?.name || '' },
        { title: string.onboarding.title, value: user?.user_title?.name || '' },
        { title: string.onboarding.city, value: user?.city?.name || '' },
        { title: string.onboarding.state, value: user?.state?.name || '' },
        { title: string.onboarding.country, value: user?.country?.name || '' },
    ]

    if (user?.registration_number) userData.splice(2, 0, { title: string.onboarding.regNumber, value: user?.registration_number })
    if (otherLanguage && user?.local_last_name) userData.splice(2, 0, { title: string.onboarding.localLastName, value: user?.local_last_name })
    if (otherLanguage && user?.local_first_name) userData.splice(1, 0, { title: string.onboarding.localFirstName, value: user?.local_first_name })

    return (
        <Modal isOpen={isOpen} toggle={onToggle} size={'md'} className='customModal'>
            <ModalHeader cssModule={{ 'modal-title': 'modal-title text-uppercase text-dark font-weight-bold' }} toggle={onToggle}>
                {string.participant.viewOrg}
            </ModalHeader>
            <ModalBody style={{ userSelect: 'none' }}>
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
            </ModalBody>
        </Modal>
    )
}

export default ViewUser
