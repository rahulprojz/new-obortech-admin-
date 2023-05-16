import { useEffect, useState } from 'react'
import NProgress from 'nprogress'
import { Formik } from 'formik'
import { Modal, ModalHeader, ModalBody, ModalFooter, Spinner } from 'reactstrap'
import { withCookies } from 'react-cookie'
import string from '../../../utils/LanguageTranslation'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'
import { callNetworkApi } from '../../../lib/api/network-api'
import notify from '../../../lib/notifier'

function ViewUser({ isOpen, request, toggle, isLoading, accessToken }) {
    const [isFetchingData, setIsFetchingData] = useState(false)
    const [permissions, setPermissions] = useState([])
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
    })

    useEffect(() => {
        if (request) {
            _fetchUserData(request)
        }
    }, [request])

    const _fetchUserData = async (request) => {
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

            setPermissions(policyResponse.data.access)

            //Get shared user data
            const getUserObj = {
                userId: user_Uniq_id,
                orgName,
            }
            const userResponse = await callNetworkApi(accessToken, '', getUserObj)
            if (!userResponse.success) {
                throw userResponse.error
            }

            setUserData(userResponse.data)
        } catch (err) {
            notify(err.message || err.toString())
        }
        NProgress.done()
        setIsFetchingData(false)
    }

    let isEdit = false
    if (permissions && permissions.includes('write')) {
        // isEdit = true;
    }

    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <Modal isOpen={isOpen} toggle={toggle} className='customModal'>
                <ModalHeader toggle={toggle}>
                    <h5 className='modal-title text-dark font-weight-bold' id='viewDataRequest'>
                        {' '}
                        {string.userDataRequest.viewDataRequest}{' '}
                    </h5>
                </ModalHeader>
                <ModalBody>
                    {isFetchingData && (
                        <div className='text-center col-md-12'>
                            <Spinner size={'sm'} />
                        </div>
                    )}
                    {!isFetchingData && (
                        <>
                            <Formik>
                                {() => (
                                    <form className='form-container'>
                                        <div className='form-group use-data-view-block'>
                                            <div className='form-group col-md-12 p-0'>
                                                <label htmlFor='user_email' className='col-md-12 col-form-label pl-0'>
                                                    {string.onboarding.firstName}
                                                </label>
                                                {!isEdit && <text className='user-data-view'>{userData.firstName}</text>}
                                                {isEdit && <input type='text' name='user_email' className='form-control' value={userData.firstName} />}
                                            </div>
                                            <div className='form-group col-md-12 p-0'>
                                                <label htmlFor='user_email' className='col-md-12 col-form-label pl-0'>
                                                    {string.onboarding.lastName}
                                                </label>
                                                {!isEdit && <text className='user-data-view'>{userData.lastName}</text>}
                                                {isEdit && <input type='text' name='user_email' className='form-control' value={userData.lastName} />}
                                            </div>
                                            <div className='form-group col-md-12 p-0'>
                                                <label htmlFor='user_email' className='col-md-12 col-form-label pl-0'>
                                                    {string.onboarding.validations.emailId}
                                                </label>
                                                {!isEdit && <text className='user-data-view'>{userData.email}</text>}
                                                {isEdit && <input type='text' name='user_email' className='form-control' value={userData.email} />}
                                            </div>
                                            <div className='form-group col-md-12 p-0'>
                                                <label for='user_mobile' className='col-md-12 col-form-label pl-0'>
                                                    {string.onboarding.validations.mobileNo}
                                                </label>
                                                {!isEdit && <text className='user-data-view'>{userData.phoneNumber}</text>}
                                                {isEdit && <input type='text' name='user_mobile' className='form-control' value={userData.phoneNumber} />}
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </Formik>
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    {isEdit && (
                        <div className='form-group col-md-12 p-0 text-center'>
                            <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={isLoading} text={string.submitBtnTxt} />
                        </div>
                    )}
                </ModalFooter>
            </Modal>
        )
    }
}

ViewUser.propTypes = {}
ViewUser.defaultProps = {}

export default withCookies(ViewUser)
