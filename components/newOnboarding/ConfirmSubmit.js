import { useContext, useEffect } from 'react'
import { Spinner } from 'reactstrap'
import OnBoardContext from '../../store/onBoard/onBordContext'
import string from '../../utils/LanguageTranslation.js'
import notify from '../../lib/notifier'

const ConfirmSubmit = () => {
    const { setSelectedStep, handleSubmitOnBoardingData, decodedToken, isSubmittingData, checkMVSVerification } = useContext(OnBoardContext)
    const language = decodedToken?.language
    const idVerify = decodedToken?.idVerify

    const handlePrevious = () => {
        setSelectedStep(decodedToken?.type == 'organization' ? 'step9' : 'step6')
    }

    const checkVerification = async () => {
        if (language == 'mn') {
            if (idVerify) {
                const verificationData = await checkMVSVerification('user')
                if (!verificationData.approved) {
                    notify(string.onboarding.validations.verificationReject)
                    setSelectedStep('step6')
                }
            }
        }
    }

    useEffect(() => {
        checkVerification()
    }, [language, idVerify])

    return (
        <>
            <div className='angry-grid confirm-submit-wrapper'>
                <div className='confirm-submit-left-column'>
                    <div className='d-flex align-items-center verify-heading'>
                        <img style={{ width: '70px' }} src='/static/img/onboarding/flag.png' />
                        <h3 className='mb-0'>
                            {`${string.onboarding.youAreDone}`}
                            <br />
                            {`${string.onboarding.submitInfo}`}
                        </h3>
                    </div>
                    <div className='btn-groups'>
                        <button disabled={isSubmittingData ? 'disabled' : ''} onClick={handleSubmitOnBoardingData} className='btn red-btn'>
                            {isSubmittingData ? <Spinner size='sm' /> : `${string.onboarding.btn.submit}`}
                        </button>
                    </div>
                </div>
                <div className='d-flex navigation'>
                    <button onClick={handlePrevious}>
                        <img style={{ transform: 'scaleX(-1)', width: '60px' }} src='/static/img/onboarding/next.png' />
                    </button>
                    <button style={{ visibility: 'hidden', width: '72px' }} />
                </div>
            </div>
            <style jsx>
                {`
                    .navigation button {
                        border: 0;
                        background: transparent;
                    }
                `}
            </style>
        </>
    )
}

export default ConfirmSubmit
