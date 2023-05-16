import { useContext, useState, useRef } from 'react'
import OnBoardContext from '../../store/onBoard/onBordContext'
import { useRouter } from 'next/router'
import notify from '../../lib/notifier'
import string from '../../utils/LanguageTranslation.js'

const PrintElem = (elem) => {
    var mywindow = window.open('', 'PRINT', 'height=400,width=600')

    mywindow.document.write('<html><head><title>' + 'User Agreement' + '</title>')
    mywindow.document.write('</head><body >')
    mywindow.document.write('<h1>' + 'User Agreement' + '</h1>')
    mywindow.document.write(document.getElementById('agreementDoc').innerHTML)
    mywindow.document.write('</body></html>')

    mywindow.document.close() // necessary for IE >= 10
    mywindow.focus() // necessary for IE >= 10*/

    mywindow.print()
    mywindow.close()

    return true
}

const UserAgreement = () => {
    const { setSelectedStep, setOnboarding, onboarding, privacyPolicy } = useContext(OnBoardContext)
    const [isAgreed, setIsAgreed] = useState(onboarding.isAgreed ?? false)
    const [isAgreementReaded, setIsAgreementReaded] = useState(onboarding.isRead ?? false)
    const router = useRouter()
    const agreementInnerRef = useRef()

    const handleNext = () => {
        if (isAgreed) {
            setOnboarding({ type: 'updateOrgInfo', payload: { isAgreed, isRead: isAgreementReaded } })
            setSelectedStep('step2')
        } else {
            notify(`${string.onboarding.validations.acceptTerms}`)
        }
    }

    const onScroll = () => {
        if (agreementInnerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = agreementInnerRef.current
            if (parseInt(scrollTop + clientHeight + 10) >= scrollHeight) {
                setIsAgreementReaded(true)
            } else {
                setIsAgreementReaded(false)
            }
        }
    }

    return (
        <>
            <div className='angry-grid user-agreement-wrapper'>
                <div className='user-agreement-left-column'>
                    <div className='d-flex align-items-end verify-heading'>
                        <img style={{ width: '70px' }} src='/static/img/onboarding/writing.png' />
                        <h3 className='mb-0'>{`${string.onboarding.userAgreement}`}</h3>
                    </div>
                    <div id='agreementDoc' className='agreement-content' onScroll={() => onScroll()} ref={agreementInnerRef}>
                        <div dangerouslySetInnerHTML={{ __html: privacyPolicy }} />
                    </div>
                    <div>
                        <p style={{ marginTop: '20px', color: 'red', visibility: isAgreementReaded ? 'hidden' : 'visible' }}>{string.onboarding.userAgreementText}</p>
                    </div>
                    <div className='d-flex justify-content-between align-items-center btn-groups'>
                        <div>
                            <button
                                disabled={!isAgreementReaded || isAgreed}
                                onClick={() => {
                                    setIsAgreed(true)
                                }}
                                className='btn red-btn mr-3'
                            >
                                {isAgreed ? string.agreed : string.iAgree}
                            </button>
                            <button disabled={isAgreed} onClick={() => router.replace('/login')} style={{ background: 'transparent', color: '#ff0000', width: '170px' }} className='btn red-outline-btn'>
                                {`${string.cancel}`}
                            </button>
                        </div>
                        <div>
                            <button onClick={PrintElem} className='btn black-outline-btn'>
                                <img className='mr-2' src='/static/img/onboarding/printer.png' />
                                {`${string.print}`}
                            </button>
                        </div>
                    </div>
                </div>
                <div className='d-flex navigation'>
                    <button onClick={handleNext}>
                        <img style={{ width: '60px' }} src='/static/img/onboarding/next.png' />
                    </button>
                </div>
            </div>
            <style jsx>
                {`
                    .navigation button {
                        border: 0;
                        background: transparent;
                    }
                    .btn-color {
                        color: #fff;
                        background-color: #ff0000;
                        border-color: #ff0000;
                        // padding: 0.5rem 5rem !important;
                        margin-top: 25px;
                        font-size: 16px;
                    }
                `}
            </style>
        </>
    )
}

export default UserAgreement
