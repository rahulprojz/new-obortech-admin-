import { useContext, useEffect, useState } from 'react'
import OnBoardContext from '../../store/onBoard/onBordContext'
import string from '../../utils/LanguageTranslation.js'

const Welcome = () => {
    const { setSelectedStep, decodedToken, isLoading: isLoadingContext } = useContext(OnBoardContext)
    const [isLinkExpired, setIsLinkExpired] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const handleClickOk = () => {
        setSelectedStep('step1')
    }
    useEffect(() => {
        if (!decodedToken) return
        ;(async () => {
            setIsLoading(true)
            try {
                const currentTime = Math.round(Date.now() / 1000)
                if (currentTime > decodedToken.exp) {
                    setIsLinkExpired(true)
                }
            } catch (error) {
                console.error(error)
            }
            setIsLoading(false)
        })().catch((err) => {
            console.error(err)
        })
    }, [decodedToken])
    if (isLoading) {
        return <></>
    }
    if (isLoadingContext) {
        return <></>
    }
    if (isLinkExpired) {
        return <div className='container1'>{`${string.onboarding.linkexpired}`}</div>
    }
    return (
        <>
            <div className='container1 welcome-wrapper'>
                <div className='welcome-page-img'>
                    <img style={{ height: '382px', width: '353px' }} src='/static/img/onboarding/smartHub.png' />
                </div>
                <div className='welcome-page-content'>
                    <div>
                        <h4>
                            {`${string.onboarding.welcome}`}
                            <br />
                            {`${string.onboarding.joinmsg}`}
                        </h4>
                        <button onClick={handleClickOk} className='btn btn-color red-btn text-capitalize'>
                            {`${string.onboarding.btn.go}`}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Welcome
