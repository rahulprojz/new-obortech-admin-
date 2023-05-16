import withAuth from '../lib/withAuth'
import { EventContextProvider } from '../store/event/eventContext'
import AnalyticsPage from './analytics'

const Allanalytics = (props) => {
    return (
        <EventContextProvider>
            <AnalyticsPage {...props} />
        </EventContextProvider>
    )
}

export default withAuth(Allanalytics, { loginRequired: true })
