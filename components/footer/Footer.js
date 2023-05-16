import React, { useState } from 'react'
import { useCookies } from 'react-cookie'
import Router from 'next/router'
import { removeUserSession } from '../../lib/api/auth'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import string from '../../utils/LanguageTranslation.js'
import Button from '../common/form-elements/button/Button'
import RefreshLoginToken from './RefreshLoginToken'

let refreshTimer

function Footer({ user, router }) {
    if (typeof window === 'undefined') {
        return null
    }

    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [cookies, setCookie, removeToken] = useCookies(['authToken'])

    const handleLogout = () => {
        removeToken(['authToken'])
        window.localStorage.clear()
        Router.push('/logout')
    }

    const handelUserLogout = async () => {
        setIsLoggingOut(true)
        handleLogout()

        if (user.role_id !== process.env.ROLE_PUBLIC_USER && window.localStorage.sessionID)
            await removeUserSession({ session_id: window.localStorage.sessionID })
        }


    return (
        <div>
            <div className='modal fade customModal' id='logoutModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                <div className='modal-dialog' role='document'>
                    <div className='modal-content'>
                        <div className='modal-header'>
                            <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                                {string.readyToleave}
                            </h5>
                            <Button className='close' type='button' data-dismiss='modal' aria-label='Close'>
                                <span aria-hidden='true'>×</span>
                            </Button>
                        </div>
                        <div className='modal-body'>{string.modalBodyp}</div>
                        <div className='modal-footer'>
                            <Button className='btn btn-secondary' type='button' data-dismiss='modal'>
                                {string.cancel}
                            </Button>
                            <LoaderButton
                                onClick={async () => {
                                    await handelUserLogout()
                                }}
                                className='btn btn-primary btn-fix-width'
                                type='button'
                                isLoading={isLoggingOut}
                                text={string.logout}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <RefreshLoginToken user={user} router={router} handelUserLogout={handelUserLogout} setCookie={setCookie} cookies={cookies} />
        </div>
    )
}

export default Footer
