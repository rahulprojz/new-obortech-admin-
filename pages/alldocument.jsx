import withAuth from '../lib/withAuth'
import { EventContextProvider } from '../store/event/eventContext'
import DocumentPage from './document'

const AllDocument = (props) => {
    return (
        <EventContextProvider>
            <DocumentPage {...props} />
        </EventContextProvider>
    )
}

export default withAuth(AllDocument, { loginRequired: true })
