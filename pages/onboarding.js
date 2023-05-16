import Head from 'next/head'
import string from '../utils/LanguageTranslation.js'
import { OnBoardContextProvider } from '../store/onBoard/onBordContext'
import OnBoardingSteps from '../components/newOnboarding/OnBoardingSteps'

const onBoarding = () => {
    return (
        <>
            <OnBoardContextProvider>
                <Head>
                    <title>
                        {process.env.APP_NAME} - {string.onboardingPageTitle}
                    </title>
                </Head>
                <OnBoardingSteps />
            </OnBoardContextProvider>
        </>
    )
}

export default onBoarding
