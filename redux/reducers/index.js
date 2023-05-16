import { combineReducers } from 'redux'
import { countryReducer } from './countryReducer'
import { cityReducer } from './cityReducer'
import { siginupReducer } from './signupReducer'
import { roleReducer } from './roleReducer'
import { userTypeReducer } from './userTypeReducer'
import { userTitleReducer } from './userTitleReducer'
import { mobileVerificationReducer } from './mobileVerificationReducer'
import { emailVerificationReducer } from './emailVerificationReducer'
import { userCheckReducer } from './userCheckReducer'
import { usersReducer } from './usersReducer'
import { signupVerifiedUser } from './signupVerifiedUserReducer'
import { formReducer } from './formReducer'
import { gdprReducer } from './gdprReducer'
import { watchAllReducer } from './watchAllReducer'
import { sidebarReducer } from './sidebarReducer'
import { EventReducer } from './eventReducer'
import { organizationReducer } from './organizationReducer'
import { publicUserReducer } from './publicUserReducer'
import { customLabelReducer } from './customLabelReducer'
import { IntegrityCheckReducer } from './integrityReducer'
import { deviceReducer } from './deviceReducer'
import { unSeenCountReducer } from './unSeenCountReducer'

const rootReducer = combineReducers({
    countries: countryReducer,
    cities: cityReducer,
    types: userTypeReducer,
    title: userTitleReducer,
    roles: roleReducer,
    signup: siginupReducer,
    mobile: mobileVerificationReducer,
    email: emailVerificationReducer,
    user: userCheckReducer,
    users: usersReducer,
    signupVerified: signupVerifiedUser,
    form: formReducer,
    gdpr: gdprReducer,
    watchAll: watchAllReducer,
    sidebar: sidebarReducer,
    event: EventReducer,
    organization: organizationReducer,
    unseenEvents: unSeenCountReducer,
    publicUser: publicUserReducer,
    customLabels: customLabelReducer,
    integrityChecker: IntegrityCheckReducer,
    device: deviceReducer,
})

export default rootReducer
