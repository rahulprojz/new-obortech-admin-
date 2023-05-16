import { useContext } from 'react'
import OnBoardContext from '../../store/onBoard/onBordContext'
import string from '../../utils/LanguageTranslation.js'


const ThankYouPage = () => {
    const { isSubmittingData, isSubmitted } = useContext(OnBoardContext)
    return (
        <>
            <div className='containerThankYou'>
                <img style={{ width: '128px', marginBottom: '30px' }} src='/static/img/onboarding/checkpng.jpg' />
                <div className='verify-heading text-center mb-0'>
                    <h3 style={{ marginBottom: '40px' }} className='ml-0' >{`${string.onboarding.thankSignUp}`}</h3>
                    <h3 className='grey-text ml-0'>{`${string.onboarding.infoUnderReview}`}</h3>
                    <h3 className='grey-text ml-0'>{`${string.onboarding.notifyOnApprove}`}</h3>
                </div>
            </div>
            <style jsx>{`
                .containerThankYou {
                    height: 100vh;
                    width: 100%;
                    flex-direction: column;
                    justify-content: center;
                    display: flex;
                    align-items: center;
                }
            `}</style>
        </>
    )
}

export default ThankYouPage
