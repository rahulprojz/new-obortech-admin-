import { useContext } from 'react'
import Welcome from './Welcome'
import AddOrganization from './AddOrganization'
import UploadOrganizationDocument from './UploadOrganizationDocument'
import VerifyEmail from './VerifyEmail'
import VerifyMobile from './VerifyMobile'
import CreatePassword from './CreatePassword'
import OnBoardContext from '../../store/onBoard/onBordContext'
import AddUserInfo from './AddUserInfo'
import AddGithubDetails from './AddGithubDetails'
import SecurityQuestion from './SecurityQuestion'
import UserAgreement from './UserAgreement'
import ConfirmSubmit from './ConfirmSubmit'
import ThankYouPage from './ThankYouPage'

const OnBoardingSteps = () => {
    const { selectedStep } = useContext(OnBoardContext)
    switch (selectedStep) {
        case 'step0':
            return <Welcome />
        case 'step1':
            return <UserAgreement />
        case 'step2':
            return <VerifyEmail />
        case 'step3':
            return <VerifyMobile />
        case 'step4':
            return <CreatePassword />
        case 'step5':
            return <SecurityQuestion />
        case 'step6':
            return <AddUserInfo />
        case 'step7':
            return <AddGithubDetails />
        case 'step8':
            return <AddOrganization />
        case 'step9':
            return <UploadOrganizationDocument />
        case 'step10':
            return <ConfirmSubmit />
        case 'step11':
            return <ThankYouPage />
        default:
            return <Welcome />
    }
}

export default OnBoardingSteps
