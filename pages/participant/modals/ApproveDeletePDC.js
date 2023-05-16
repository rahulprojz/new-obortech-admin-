import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Modal, ModalBody, ModalHeader } from 'reactstrap'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'
import { approveDeletePDC, approvePDC } from '../../../lib/api/pdc-category'
import string from '../../../utils/LanguageTranslation.js'
import { useCookies } from 'react-cookie'

const ApproveDeletePDC = ({ role_id, organization_id }) => {
    const router = useRouter()
    const queryParams = new URLSearchParams(window.location.search)
    const org = queryParams.get('org')
    const pdc = queryParams.get('pdc')
    const approval = queryParams.get('approval')
    const [isOpen, setIsOpen] = useState(org && pdc)
    const [title, setTitle] = useState('')
    const isAuthorized = org == organization_id && role_id == process.env.ROLE_CEO
    const isSeniorManager = org == organization_id && role_id == process.env.ROLE_SENIOR_MANAGER
    const [cookies, setCookie, removeToken] = useCookies(['authToken'])
    const approveDeletePdcAPI = async () => {
        await approveDeletePDC(org, pdc)
    }
    const approvePdcAPI = async () => {
        const response = await approvePDC(org, pdc, cookies.authToken)
    }
    useEffect(() => {
        if (isAuthorized || isSeniorManager) {
            if (approval) {
                approvePdcAPI()
            } else {
                approveDeletePdcAPI()
            }
        }
    }, [])

    useEffect(() => {
        setTitle(isAuthorized || isSeniorManager ? string.emailContent.PDCRequestApproved : string.emailContent.unAuthorized)
    }, [])
    return (
        <Modal isOpen={isOpen} className='customModal'>
            <ModalHeader></ModalHeader>
            <ModalBody className='text-center mb-5'>
                <p>
                    <strong style={{ textTransform: 'uppercase' }}>{title}</strong>
                </p>
                <LoaderButton
                    cssClass='btn btn-primary large-btn'
                    type='button'
                    onClick={() => {
                        isAuthorized || isSeniorManager
                            ? router.replace({
                                  pathname: '/participant',
                                  query: {
                                      approved: true,
                                  },
                              })
                            : window.history.replaceState(null, '', '/participant')
                        setIsOpen(false)
                    }}
                    text={string.back}
                />
            </ModalBody>
        </Modal>
    )
}

export default ApproveDeletePDC
