import { MenuItem, TextField } from '@material-ui/core'
import { useFormik } from 'formik'
import { useContext, useRef, useEffect } from 'react'
import * as Yup from 'yup'
import OnBoardContext from '../../store/onBoard/onBordContext'
import notify from '../../lib/notifier'
import string from '../../utils/LanguageTranslation.js'
import AlphabetSelect from '../common/form-elements/select/AlphabetSelect'

const AddUserInfoSchema = Yup.object().shape({
    firstName: Yup.string()
        .trim()
        .required(`${string.onboarding.firstName} ${string.errors.required}`)
        .matches(/^[aA-zZ -]*[aA-zZ][aA-zZ -]+$/, string.onboarding.validations.onlyAlphaField),
    lastName: Yup.string()
        .trim()
        .required(`${string.onboarding.lastName} ${string.errors.required}`)
        .matches(/^[aA-zZ -]*[aA-zZ][aA-zZ -]+$/, string.onboarding.validations.onlyAlphaField),
    localFirstName: Yup.string().when('user_country_id', {
        is: (user_country_id) => user_country_id == '146',
        then: Yup.string()
            .trim()
            .required(`${string.onboarding.localFirstName} ${string.errors.required}`)
            .matches(/^[\u0400-\u04FF -]*[\u0400-\u04FF][\u0400-\u04FF -]+$/, `${string.onboarding.localFirstName} ${string.onboarding.validations.onlyCyrillicAlphabet}`),
    }),
    localLastName: Yup.string().when('user_country_id', {
        is: (user_country_id) => user_country_id == '146',
        then: Yup.string()
            .trim()
            .required(`${string.onboarding.localLastName} ${string.errors.required}`)
            .matches(/^[\u0400-\u04FF -]*[\u0400-\u04FF][\u0400-\u04FF -]+$/, `${string.onboarding.localLastName} ${string.onboarding.validations.onlyCyrillicAlphabet}`),
    }),
    title: Yup.string().required(`${string.onboarding.title} ${string.errors.required}`),
    user_country_id: Yup.string().required(`${string.onboarding.country} ${string.errors.required}`),
    user_state_id: Yup.string().required(`${string.onboarding.state} ${string.errors.required}`),
    // Some states are not having cities so this can't be required one
    // user_city_id: Yup.string().required(`${string.onboarding.city} ${string.errors.required}`),
    userRegNumber: Yup.string().when('user_country_id', {
        is: (user_country_id) => user_country_id == '146',
        then: Yup.string().trim().required(`${string.onboarding.regNumber} ${string.errors.required}`),
    }),
})

const AddUserInfo = () => {
    const { setSelectedStep, userTitle, setOnboarding, handleStateChange, handleCountryChange, verifyWithMVS, onboarding, decodedToken, countries, userStates, userCities, userId, stateValues, router, createUserUniqId } = useContext(OnBoardContext)
    const refSubmitForm = useRef()
    const { token, step } = router.query
    const language = decodedToken?.language
    const idVerify = decodedToken?.idVerify

    const formik = useFormik({
        initialValues: {
            userName: onboarding.userName ?? '',
            firstName: onboarding.firstName ?? '',
            localFirstName: onboarding.localFirstName ?? '',
            lastName: onboarding.lastName ?? '',
            localLastName: onboarding.localLastName ?? '',
            title: onboarding.title ?? '',
            // userID: decodedToken?.type == 'user' ? userId : onboarding.userID || createUserUniqId('usr'),
            userID: decodedToken?.type == 'user' ? userId : onboarding.userID,
            firstAlphabet: onboarding.firstAlphabet ?? 'А',
            secondAlphabet: onboarding.secondAlphabet ?? 'А',
            userRegNumber: onboarding.registrationNumber ?? onboarding.userRegNumber,
            searchAlphabet: '',
            user_country_id: language == 'mn' ? 146 : onboarding.user_country_id || '',
            user_state_id: onboarding.user_state_id ?? '',
            user_city_id: onboarding.user_city_id ?? '',
        },
        validationSchema: AddUserInfoSchema,
        onSubmit: async (values) => {
            setOnboarding({ type: 'updateOrgInfo', payload: values })
            if (language == 'mn' && idVerify) {
                const verificationData = await verifyWithMVS('user', values)
                if (verificationData?.id) {
                    stateValues.onboarding = { ...stateValues.onboarding, ...values }
                    window.localStorage.setItem('onBoardData', JSON.stringify(stateValues))
                    router.push({
                        pathname: process.env.MVS_AUTH_URL,
                        query: {
                            s_url: `${window.location.origin}${router.pathname}?token=${token}&step=${decodedToken?.type == 'organization' ? 'step7' : 'step10'}`,
                            e_url: `${window.location.origin}${router.pathname}?token=${token}&step=step6&status=failed`,
                            id: verificationData.id,
                            type: 'user',
                        },
                    })
                } else {
                    notify(string.onboarding.validations.verificationReject)
                }
            } else {
                setSelectedStep(decodedToken?.type == 'organization' ? 'step7' : 'step10')
            }
        },
    })

    useEffect(() => {
        if (decodedToken?.type != 'user' && !onboarding.userID) {
            createUserUniqId('usr').then((res) => {
                formik.setFieldValue('userID', res)
            })
        }
    }, [])

    const handleNext = () => {
        refSubmitForm.current.click()
    }

    const handlePrevious = () => {
        setSelectedStep('step4')
    }

    useEffect(() => {
        if (language == 'mn') {
            if (!step && !onboarding.user_country_id) handleCountryChange(146, 'user')
            if (idVerify) {
                const { status } = router.query
                if (status && status == 'failed') {
                    notify(string.onboarding.validations.verificationReject)
                }
            }
        }
    }, [])

    return (
        <>
            <div className='angry-grid add-user-info-wrapper'>
                <div className='add-user-info-left-column'>
                    <div className='d-flex align-items-end verify-heading'>
                        <img style={{ width: '70px' }} src='/static/img/onboarding/user.png' />
                        <h3 className='mb-0'>{`${string.onboarding.addUserInfo}`}</h3>
                    </div>
                    <div>
                        <form id='addUserForm' onSubmit={formik.handleSubmit}>
                            <div className='d-flex username-field margin-bottom-50'>
                                <TextField
                                    className='add-user-info-input w-100'
                                    label={language == 'mn' ? `${string.onboarding.engFirstName}` : `${string.onboarding.firstName}`}
                                    id='firstName'
                                    name='firstName'
                                    variant='standard'
                                    value={formik.values.firstName}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={!!(formik.errors.firstName && formik.touched.firstName)}
                                    helperText={formik.errors.firstName && formik.touched.firstName ? formik.errors.firstName : null}
                                />
                                <TextField
                                    className='add-user-info-input w-100'
                                    label={language == 'mn' ? `${string.onboarding.engLastName}` : `${string.onboarding.lastName}`}
                                    id='lastName'
                                    name='lastName'
                                    variant='standard'
                                    value={formik.values.lastName}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={!!(formik.errors.lastName && formik.touched.lastName)}
                                    helperText={formik.errors.lastName && formik.touched.lastName ? formik.errors.lastName : null}
                                />
                            </div>
                            {(language == 'mn' || parseInt(formik.values?.user_country_id) == 146) && (
                                <div className='d-flex username-field margin-bottom-50'>
                                    <TextField
                                        className='add-user-info-input w-100'
                                        label={`${string.onboarding.localFirstName}`}
                                        id='localFirstName'
                                        name='localFirstName'
                                        variant='standard'
                                        value={formik.values.localFirstName}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={!!(formik.errors.localFirstName && formik.touched.localFirstName)}
                                        helperText={formik.errors.localFirstName && formik.touched.localFirstName ? formik.errors.localFirstName : null}
                                    />
                                    <TextField
                                        className='add-user-info-input w-100'
                                        label={`${string.onboarding.localLastName}`}
                                        id='localLastName'
                                        name='localLastName'
                                        variant='standard'
                                        value={formik.values.localLastName}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={!!(formik.errors.localLastName && formik.touched.localLastName)}
                                        helperText={formik.errors.localLastName && formik.touched.localLastName ? formik.errors.localLastName : null}
                                    />
                                </div>
                            )}
                            <div className='d-flex w-100 align-items-end username-field margin-bottom-50'>
                                <TextField
                                    id='title'
                                    name='title'
                                    select
                                    label={`${string.onboarding.type}`}
                                    value={formik.values.title}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    variant='standard'
                                    className='add-user-info-input w-50'
                                    error={!!(formik.errors.title && formik.touched.title)}
                                    helperText={formik.errors.title && formik.touched.title ? formik.errors.title : null}
                                >
                                    {userTitle.map((title) => (
                                        <MenuItem key={title.id} value={title.id}>
                                            {title.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <div style={{ color: '#979797', paddingTop: '10px' }} className='w-50 unique-id'>
                                    {`${string.onboarding.userId}:`} <span>{formik.values.userID}</span>
                                    <p className='mb-0'>{string.onboarding.uIdGenerated}</p>
                                </div>
                            </div>
                            {(language == 'mn' || parseInt(formik.values?.user_country_id) == 146) && (
                                <div className='d-flex username-field'>
                                    <AlphabetSelect name='firstAlphabet' from='onboarding' value={formik.values.firstAlphabet} onSelect={(text) => formik.setFieldValue('firstAlphabet', text)} />
                                    <AlphabetSelect name='secondAlphabet' from='onboarding' value={formik.values.secondAlphabet} onSelect={(text) => formik.setFieldValue('secondAlphabet', text)} />
                                    <TextField
                                        className='add-user-info-input w-100'
                                        label={`${string.onboarding.regNumber}`}
                                        id='userRegNumber'
                                        name='userRegNumber'
                                        variant='standard'
                                        value={formik.values.userRegNumber}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={!!(formik.errors.userRegNumber && formik.touched.userRegNumber)}
                                        helperText={formik.errors.userRegNumber && formik.touched.userRegNumber ? formik.errors.userRegNumber : null}
                                    />
                                </div>
                            )}
                            {/* Country and State */}
                            <div className='d-flex justify-content-between margin-bottom-50'>
                                <TextField
                                    id='user_country_id'
                                    name='user_country_id'
                                    select
                                    disabled={language == 'mn'}
                                    label={string.onboarding.country}
                                    value={formik.values.user_country_id}
                                    onChange={(event) => {
                                        handleCountryChange(event.target.value, 'user')
                                        formik.setFieldValue('user_state_id', '')
                                        formik.setFieldValue('user_city_id', '')
                                        formik.handleChange(event)
                                    }}
                                    onBlur={formik.handleBlur}
                                    variant='standard'
                                    className='mr-5 org-input-min-width w-50'
                                    error={!!(formik.errors.user_country_id && formik.touched.user_country_id)}
                                    helperText={formik.errors.user_country_id && formik.touched.user_country_id ? formik.errors.user_country_id : null}
                                >
                                    {countries.map((country) => (
                                        <MenuItem key={country.id} value={country.id}>
                                            {country.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    id='user_state_id'
                                    name='user_state_id'
                                    select
                                    label={string.onboarding.state}
                                    value={formik.values.user_state_id}
                                    onChange={(event) => {
                                        handleStateChange(event.target.value, 'user')
                                        formik.setFieldValue('user_city_id', '')
                                        formik.handleChange(event)
                                    }}
                                    onBlur={formik.handleBlur}
                                    variant='standard'
                                    className='org-input-min-width w-50'
                                    error={!!(formik.errors.user_state_id && formik.touched.user_state_id)}
                                    helperText={formik.errors.user_state_id && formik.touched.user_state_id ? formik.errors.user_state_id : null}
                                >
                                    {userStates.map((state) => (
                                        <MenuItem key={state.id} value={state.id}>
                                            {state.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </div>
                            {/* City */}
                            <div className='d-flex justify-content-between'>
                                <TextField
                                    id='user_city_id'
                                    name='user_city_id'
                                    select
                                    label={string.onboarding.city}
                                    value={formik.values.user_city_id}
                                    onChange={formik.handleChange}
                                    variant='standard'
                                    className='mr-5 org-input-min-width'
                                    error={!!(formik.errors.user_city_id && formik.touched.user_city_id)}
                                    helperText={formik.errors.user_city_id && formik.touched.user_city_id ? formik.errors.user_city_id : null}
                                >
                                    {userCities?.map((city) => (
                                        <MenuItem key={city.id} value={city.id}>
                                            {city.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </div>
                            <button ref={refSubmitForm} style={{ visibility: 'hidden' }} type='submit'>
                                Submit
                            </button>
                        </form>
                    </div>
                </div>
                <div className='d-flex navigation'>
                    <button onClick={handlePrevious}>
                        <img style={{ transform: 'scaleX(-1)', width: '60px' }} src='/static/img/onboarding/next.png' />
                    </button>
                    <button onClick={handleNext}>
                        <img style={{ width: '60px' }} src='/static/img/onboarding/next.png' />
                    </button>
                </div>
            </div>
            <style jsx>
                {`
                    .customFontSize {
                        font-size: 30px;
                    }
                    .navigation button {
                        border: 0;
                        background: transparent;
                    }
                `}
            </style>
        </>
    )
}

export default AddUserInfo
