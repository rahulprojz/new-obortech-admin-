import React, { useState, useEffect, useRef } from 'react'
import string from '../../utils/LanguageTranslation.js'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import { sanitize } from '../../utils/globalFunc'
import moment from 'moment'
import notify from '../../lib/notifier'
import jwt_decode from 'jwt-decode'
import { refreshAccessToken } from '../../lib/api/auth'

let refreshTimer

const RefreshLoginToken = ({ user,router, handelUserLogout,cookies, setCookie}) => {
    const [isRefreshToken, setIsRefreshToken] = useState(false)
    const [refreshToken, setRefreshToken] = useState('')
    const [refreshModal, setRefreshModal] = useState(false)
    const [tokenRemainingTime, setTokenRemainingTime] = useState('00:00:00')
    const refreshTickerRef = useRef(null)

    useEffect(() => {
        const { authToken } = cookies
        setRefreshToken(authToken)
        if (!authToken && user.role_id != process.env.ROLE_PUBLIC_USER) {
            if (router.route != '/login') {
                handelUserLogout()
            }
        }
    }, [])

    const startRefreshTicker = () => {
        return setInterval(() => {
            if (refreshToken) {
                const decoded = jwt_decode(refreshToken)
                const remaningTime = decoded.exp - moment().unix()
                checkRefresh(decoded, remaningTime)
            }
        }, 10000)
    }

    useEffect(() => {
        if (refreshTickerRef.current) {
            clearTimeout(refreshTickerRef.current)
        }
        refreshTickerRef.current = startRefreshTicker()
        return () => {
            clearTimeout(refreshTickerRef.current)
        }
    }, [refreshToken])

    const checkRefresh = (decoded, remaningTime) => {
        if (decoded.exp < moment().unix()) {
            handelUserLogout()
        } else if (remaningTime < 600) {
            toggleRefreshModal(true, null, remaningTime)
        }
    }

    /** Countdown timer for refresh token starts here * */
    const getDeadTime = (e) => {
        const deadline = new Date()
        deadline.setSeconds(e)
        return deadline
    }

    const getTimeRemaining = (e) => {
        const total = Date.parse(e) - Date.parse(new Date())
        const seconds = Math.floor((total / 1000) % 60)
        const minutes = Math.floor((total / 1000 / 60) % 60)
        const hours = Math.floor((total / 1000 / 60 / 60) % 24)
        return {
            total,
            hours,
            minutes,
            seconds,
        }
    }

    const startTimer = (e) => {
        refreshTimer = setInterval(async () => {
            const { total, hours, minutes, seconds } = getTimeRemaining(e)
            if (total > 0) {
                setTokenRemainingTime(`${hours > 9 ? hours : `0${hours}`}:${minutes > 9 ? minutes : `0${minutes}`}:${seconds > 9 ? seconds : `0${seconds}`}`)
            } else {
                handelUserLogout()
            }
        }, 1000)
    }

    /** Countdown timer for refresh token ends here * */

    const toggleRefreshModal = async (status, token = null, remaningTime) => {
        if (status && !refreshModal) {
            setRefreshModal(true)
            setRefreshToken('')
            startTimer(getDeadTime(remaningTime), true)
        } else {
            clearInterval(refreshTimer)
            setRefreshModal(false)
            setRefreshToken(token)
        }
    }

    const onContinueClick = async () => {
        setIsRefreshToken(true)
        const payload = {
            orgName: sanitize(user.organization.blockchain_name),
            userName: user.unique_id,
        }
        const { success, jwt } = await refreshAccessToken(payload)
        if (success) {
            setCookie('authToken', jwt, { path: '/', maxAge: 1000000 })
        } else {
            notify(string.login.tokenRefreshError)
        }
        await toggleRefreshModal(false, jwt, 0)
        setIsRefreshToken(false)
    }

    const onLogoutClick = () => {
        toggleRefreshModal(false, null, 0)
        handelUserLogout()
    }

    return (
        <>
            <Modal isOpen={refreshModal} className='customModal'>
                <ModalHeader>
                    <div className='p-3'>
                        {string.login.continueModalHeaderTextPrefix}
                        <span className='ob-session-time ob-branding-color'>{tokenRemainingTime}</span>
                        {string.login.continueModalHeaderTextSuffix}
                    </div>
                </ModalHeader>
                <ModalBody>
                    <div className='row text-center ob-justify-center p-3'>
                        <button type='button' className='btn btn-large btn-secondary ob-min-w140 mr-3 text-uppercase' onClick={() => onLogoutClick()}>
                            {string.logout}
                        </button>

                        <LoaderButton type='button' cssClass='btn btn-large btn-primary ob-min-w140 text-uppercase' isLoading={isRefreshToken} text={string.login.continueBtnText} onClick={() => onContinueClick()} />
                    </div>
                </ModalBody>
            </Modal>
        </>
    )
}

export default RefreshLoginToken
