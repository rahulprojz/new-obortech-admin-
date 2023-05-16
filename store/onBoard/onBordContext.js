import { createContext, useEffect, useReducer, useState } from 'react'
import jwt_decode from 'jwt-decode'
import ShortUniqueId from 'short-unique-id'
import { useRouter } from 'next/router'
import axios from 'axios'
import { getMVSToken } from '../../lib/api/sendRequest'
import { getAllTypesApi } from '../../lib/api/user_type'
import { fetchPrivacyPolicy } from '../../lib/api/privacyPolicy'
import { addUserAgreement } from '../../lib/api/user-agreement'
import { getAllCountriesApi } from '../../lib/api/country'
import reducerOnboardingFields from './reducerOnboardingFields'
import { getAllStatesApi } from '../../lib/api/state'
import { getAllCitiesApi } from '../../lib/api/city'
import { getAllDocumentTypesById } from '../../lib/api/document-type'
import { getAllTitlesApi } from '../../lib/api/user_title'
import { fetchSecurityQuestions } from '../../lib/api/security-questions'
import { addUserSecurityAnswers } from '../../lib/api/user-security-answers'
import notify from '../../lib/notifier'
import { addOrganization, getOrg } from '../../lib/api/organization'
import { callNetworkApi, getAccess, uploadDocument } from '../../lib/api/network-api'
import { addUser, userVerification, organizationVerification, checkUserVerification, checkOrganizationVerification, checkUniqueId, createOnboardingRequest } from '../../lib/api/onboarding'
import string from '../../utils/LanguageTranslation.js'
import { getLanguage } from '../../lib/api/language'
import { sanitize } from '../../utils/globalFunc'

const OnBoardContext = createContext({
    selectedStep: '',
    setSelectedStep: () => {},
    onboarding: {},
    setOnboarding: () => {},
    orgTypes: [],
    countries: [],
    userStates: [],
    orgStates: [],
    userCities: [],
    orgCities: [],
    securityQuestions: [],
    handleCountryChange: () => {},
})

export default OnBoardContext

export const OnBoardContextProvider = (props) => {
    if (typeof window === 'undefined') {
        return null
    }

    let localStorageData = {}
    const router = useRouter()
    const { token, step } = router.query

    if (step) {
        localStorageData = JSON.parse(window.localStorage.getItem('onBoardData')) || {}
    }
    const [selectedStep, setSelectedStep] = useState(step || 'step0')
    const [isLoading, setIsLoading] = useState(true)
    const [orgTypes, setOrgTypes] = useState(localStorageData.orgTypes || [])
    const [countries, setCountries] = useState(localStorageData.countries || [])
    const [userStates, setUserStates] = useState(localStorageData.userStates || [])
    const [orgStates, setOrgStates] = useState(localStorageData.orgStates || [])
    const [userCities, setUserCities] = useState(localStorageData.userCities || [])
    const [orgCities, setOrgCities] = useState(localStorageData.orgCities || [])
    const [documentTypes, setDocumentTypes] = useState(localStorageData.documentTypes || [])
    const [userTitle, setUserTitle] = useState(localStorageData.userTitle || [])
    const [securityQuestions, setSecurityQuestions] = useState(localStorageData.securityQuestions || [])
    const [isError, setIsError] = useState(localStorageData.isError || false)
    const [onboarding, setOnboarding] = useReducer(reducerOnboardingFields, localStorageData.onboarding || {})
    const [decodedToken, setDecodedToken] = useState(localStorageData.decodedToken || null)
    const [isSubmittingData, setIsSubmittingData] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [privacyPolicy, setPrivacyPolicy] = useState(localStorageData.privacyPolicy || '')
    const [userId, setUserId] = useState(localStorageData.userId || '')
    const [orgId, setOrgId] = useState(localStorageData.orgId || '')
    const [MVSToken, setMVSToken] = useState(localStorageData.MVSToken || '')

    let orgID = ''
    let orgName = ''

    const getDefaultData = async () => {
        setIsLoading(true)
        if (token) {
            const jwtToken = jwt_decode(token)
            setDecodedToken(jwtToken)
            const language = jwtToken.language == 'en' ? 'us' : jwtToken.language
            window.localStorage.setItem('onboardingLanguage', language)

            if (language != 'us') {
                const languageJson = await getLanguage(language)
                if (languageJson && !window.localStorage.getItem('reloaded')) {
                    window.localStorage.setItem('languageJson', JSON.stringify(languageJson.json))
                    window.localStorage.setItem('reloaded', 'yes')
                    window.location.reload()
                    return
                }
            }
            setIsLoading(false)

            if (jwtToken.type == 'user' && !localStorageData?.userId) {
                const organization = await getOrg({
                    id: jwtToken.orgId,
                })
                createUserUniqId(organization.name)
            }
            if (jwtToken.language == 'mn' && jwtToken.idVerify) {
                const verificationToken = await getMVSToken()
                setMVSToken(verificationToken.token)
            }
            const securityQuestion = await fetchSecurityQuestions()
            setSecurityQuestions(securityQuestion)
            const privacyPolicy = await fetchPrivacyPolicy()
            setPrivacyPolicy(language.toLowerCase() == 'us' ? privacyPolicy?.en_html : privacyPolicy?.mn_html)
        }
        try {
            const { data: org_types } = await getAllTypesApi()
            setOrgTypes(org_types)
            const { data: user_titles } = await getAllTitlesApi()
            setUserTitle(user_titles)
            const { data: allCountries } = await getAllCountriesApi()
            setCountries(allCountries)
        } catch (err) {
            console.log(err)
            setIsError(true)
        }
    }

    const createUserUniqId = async (orgName) => {
        if (!orgName) return false
        let uniqueId = ''
        let isAlreadyExist = false
        const sanitized_orgName = orgName.replace(/[^A-Za-z0-9]/g, '').toLowerCase()
        do {
            const randomNumber = `${Math.random()}`.substr(2, 4)
            uniqueId = sanitized_orgName.substring(0, 3) + randomNumber
            const { code } = await checkUniqueId({ unique_id: uniqueId })
            isAlreadyExist = code == 400
        } while (isAlreadyExist)
        setUserId(uniqueId)

        return uniqueId
    }

    // Generate unique id for organization
    const createOrgUniqId = (orgName) => {
        const randomCode = new ShortUniqueId({ length: 6, dictionary: 'alpha_lower' })
        const unique_id = `${orgName.substring(0, 3)}${randomCode()}`
        setOrgId(unique_id)
        return unique_id
    }

    const handleCountryChange = async (countryId, type) => {
        try {
            const userType = type === 'user'
            const { data: allStates } = await getAllStatesApi(countryId)
            if (allStates) {
                userType ? setUserStates(allStates) : setOrgStates(allStates)
            } else {
                userType ? setUserStates([]) : setOrgStates([])
            }
            if (countryId !== 146) {
                userType ? setUserCities([]) : setOrgCities([])
            }
        } catch (error) {
            setIsError(true)
        }
    }

    const handleStateChange = async (state_id, type) => {
        try {
            const userType = type === 'user'
            const { data: allCities } = await getAllCitiesApi(state_id)
            if (allCities) {
                userType ? setUserCities(allCities) : setOrgCities(allCities)
            } else {
                userType ? setUserCities([]) : setOrgCities([])
            }
        } catch (error) {
            setIsError(true)
        }
    }

    const handleOrgTypeChange = async (orgTypeID) => {
        try {
            const document_types = await getAllDocumentTypesById(orgTypeID)
            document_types ? setDocumentTypes(document_types) : setDocumentTypes([])
        } catch (error) {
            setIsError(true)
        }
    }

    const verifyWithMVS = async (type, values = {}) => {
        try {
            const { localFirstName, localLastName, userID, firstAlphabet, secondAlphabet, userRegNumber } = values
            let verificationData = {}
            const headers = {
                Authorization: MVSToken,
            }
            if (type == 'user') {
                verificationData = await userVerification(
                    {
                        firstName: localFirstName,
                        lastName: localLastName,
                        memberId: userID,
                        registerNumber: `${firstAlphabet}${secondAlphabet}${userRegNumber}`,
                    },
                    { headers },
                )
            } else {
                const { localFirstName, localLastName, userID, firstAlphabet, secondAlphabet, userRegNumber } = onboarding
                const { orgId, local_name, state_reg_id } = values
                verificationData = await organizationVerification(
                    {
                        firstName: localFirstName,
                        lastName: localLastName,
                        memberId: userID,
                        registerNumber: `${firstAlphabet}${secondAlphabet}${userRegNumber}`,
                        organizationId: orgId,
                        organizationName: local_name,
                        organizationRegister: state_reg_id,
                    },
                    { headers },
                )
            }

            return verificationData
        } catch (error) {
            setIsError(true)
        }
    }

    const checkMVSVerification = async (type) => {
        try {
            let verificationData = {}
            const headers = {
                Authorization: MVSToken,
            }
            if (type == 'user') {
                verificationData = await checkUserVerification(onboarding.userID, { headers })
            } else {
                verificationData = await checkOrganizationVerification(onboarding.orgId, { headers })
            }

            return verificationData
        } catch (error) {
            setIsError(true)
        }
    }

    const submitOrganization = async () => {
        try {
            const ipfsFormData = new FormData()
            ipfsFormData.append('document_name', onboarding.file.name)
            ipfsFormData.append('file', onboarding.file)

            const accessToken = await getAccess(decodedToken.uniqueId, decodedToken.blockchainName)
            if (accessToken.error) {
                throw accessToken.error
            }
            const ipfsHash = await uploadDocument(accessToken, ipfsFormData)

            const form_data_ob = new FormData()
            form_data_ob.append('name', onboarding.orgName)
            form_data_ob.append('unique_id', orgId)
            form_data_ob.append('local_name', onboarding.local_name)
            form_data_ob.append('state_registration_id', onboarding.state_reg_id)
            form_data_ob.append('street_address', onboarding.street_address.trim())
            form_data_ob.append('state_id', onboarding.state_id)
            form_data_ob.append('country_id', onboarding.country_id)
            form_data_ob.append('city_id', onboarding.city_id)
            form_data_ob.append('type_id', onboarding.type_id)
            form_data_ob.append('document_type', onboarding.document_type)
            form_data_ob.append('document_name', onboarding.file.name)
            form_data_ob.append('verification', token)
            form_data_ob.append('hash', ipfsHash.data)

            const orgnizationName = sanitize(onboarding.orgName)
            let blockchainName = orgnizationName + orgId
            if (orgnizationName.length > 10) {
                blockchainName = orgnizationName.substring(0, 10) + orgId
            }
            form_data_ob.append('blockchain_name', blockchainName.toLowerCase())

            const addResponse = await addOrganization(form_data_ob)
            if (addResponse.error) {
                notify(addResponse.error)
                return
            }

            const { organization, host, hostOrg, organization_type, msp_type } = addResponse
            orgID = organization.id
            orgName = organization.name
            const ipfsDataObj = {
                onboardingRequestID: `${organization.name}-${organization.id}`,
                hostOrgID: `${hostOrg.id}`,
                hostOrgName: hostOrg.name,
                hostOrgAdmin: 'oboadmin',
                hostOrgLoc: `${hostOrg.state_id}`,
                newOrgID: `${organization.id}`,
                newOrgName: organization.name,
                newOrgStatus: 'NEW',
                newOrgLoc: `${organization.state_id}`,
                requestType: 'Onboarding',
                newOrgDocHash: addResponse.document,
                newOrgType: organization_type.name,
                newOrgMspType: msp_type,
            }

            const ipfsResponse = await createOnboardingRequest(ipfsDataObj)
            if (!ipfsResponse.success) {
                throw ipfsResponse.error
            }
            await submitUserData(organization.id)
        } catch (err) {
            console.log(err)
            notify(string.organization.organizationAddErr)
        }
    }

    const submitUserData = async (organizationId) => {
        try {
            const {
                firstName,
                localFirstName,
                lastName,
                localLastName,
                userName,
                password,
                userID,
                title,
                email,
                country_code,
                mobile,
                firstAlphabet,
                secondAlphabet,
                userRegNumber,
                user_country_id,
                user_state_id,
                user_city_id,
                firstQuestionAnswer,
                secondQuestionAnswer,
                thirdQuestionAnswer,
                firstQuestion,
                secondQuestion,
                thirdQuestion,
                githubUsername,
                githubToken,
            } = onboarding
            const { invitedBy, language, idVerify } = decodedToken
            const payload = {
                first_name: firstName,
                last_name: lastName,
                local_first_name: localFirstName,
                local_last_name: localLastName,
                username: userName,
                org_id: organizationId,
                uniq_id: userID,
                password,
                title_id: parseInt(title),
                invitedBy,
                language,
                email,
                country_code,
                mobile,
                country_id: user_country_id,
                state_id: user_state_id,
                city_id: user_city_id,
                githubUsername,
                githubToken,
            }
            if (language == 'mn') {
                payload.registration_number = `${firstAlphabet}${secondAlphabet}${userRegNumber}`

                if (idVerify) payload.is_mvs_verified = 1
            }
            const response = await addUser(payload)
            setIsSubmitted(true)
            if (response.code == 200) {
                const user_id = response.data.userData.id
                const payload = [
                    { user_id, answer: firstQuestionAnswer, question_id: firstQuestion },
                    { user_id, answer: secondQuestionAnswer, question_id: secondQuestion },
                    { user_id, answer: thirdQuestionAnswer, question_id: thirdQuestion },
                ]

                let fileName = 'user-agreement-en.pdf'
                if (language == 'mn') {
                    fileName = 'user-agreement-mn.pdf'
                }

                const userAgreement = await axios(`/server/upload/user-agreement/${fileName}`, {
                    method: 'GET',
                    responseType: 'blob',
                    headers: { 'Access-Control-Allow-Origin': true },
                })
                    .then((response) => {
                        const file = new Blob([response.data], { type: 'application/pdf' })
                        return file
                    })
                    .catch((error) => {
                        console.log(error)
                        return error.response
                    })

                // Upload user agreement to IPFS
                const ipfsFormData = new FormData()
                ipfsFormData.append('document_name', `user-agreement-${userID}`)
                ipfsFormData.append('file', userAgreement)

                const accessToken = await getAccess(decodedToken.uniqueId, decodedToken.blockchainName)
                if (accessToken.error) {
                    throw accessToken.error
                }

                const ipfsHash = await uploadDocument(accessToken, ipfsFormData)

                await addUserAgreement({ agreement: privacyPolicy, file_hash: ipfsHash.data, user_id })
                await addUserSecurityAnswers(payload)
                setOnboarding({ type: 'updateOrgInfo', payload: {} })
                setSelectedStep('step11')
            } else {
                notify(`${string.onboarding.validations.errorOccurred}`)
            }
            setIsSubmittingData(false)
        } catch (err) {
            console.log(err)
            notify(err.message || err.toString())
        }
    }

    const handleSubmitOnBoardingData = async () => {
        setIsSubmittingData(true)
        window.localStorage.removeItem('onBoardData')
        if (decodedToken.type === 'user') {
            submitUserData(decodedToken.orgId)
        } else if (decodedToken.type === 'organization') {
            submitOrganization()
        }
    }

    const stateValues = {
        selectedStep,
        orgTypes,
        documentTypes,
        userTitle,
        isError,
        onboarding,
        decodedToken,
        isSubmittingData,
        isSubmitted,
        privacyPolicy,
        countries,
        userStates,
        orgStates,
        userCities,
        orgCities,
        userId,
        orgId,
        MVSToken,
    }

    useEffect(() => {
        getDefaultData()
    }, [])

    const context = {
        stateValues,
        router,
        selectedStep,
        setSelectedStep,
        onboarding,
        setOnboarding,
        orgTypes,
        countries,
        userStates,
        orgStates,
        userCities,
        orgCities,
        handleCountryChange,
        handleStateChange,
        handleOrgTypeChange,
        documentTypes,
        verifyWithMVS,
        checkMVSVerification,
        userTitle,
        decodedToken,
        securityQuestions,
        handleSubmitOnBoardingData,
        isSubmittingData,
        isSubmitted,
        privacyPolicy,
        userId,
        createUserUniqId,
        createOrgUniqId,
        isLoading,
    }

    return <OnBoardContext.Provider value={context}>{props.children}</OnBoardContext.Provider>
}
