import { MenuItem, TextField, Button } from '@material-ui/core'
import { useFormik } from 'formik'
import { Spinner } from 'reactstrap'
import { useContext, useRef, useState, useEffect } from 'react'
import * as Yup from 'yup'
import notify from '../../lib/notifier'
import { getMVSToken, verifyMangolianOrg } from '../../lib/api/sendRequest'
import OnBoardContext from '../../store/onBoard/onBordContext'
import string from '../../utils/LanguageTranslation.js'
import { checkOrgNameIsAvailable, checkOrganizationExists } from '../../lib/api/organization'

const AddOrganizationSchema = Yup.object().shape({
    orgName: Yup.string()
        .trim()
        .matches(/^[[aA-zZ -]*[aA-zZ][aA-zZ -]+$/, `${string.onboarding.validations.onlyAlpha}`)
        .required(`${string.organization.orgName} ${string.errors.required}`),
    local_name: Yup.string().when('country_id', {
        is: (country_id) => country_id=='146',
        then: Yup.string()
        .required(`${string.organization.orgLocalName} ${string.errors.required}`)
        .matches(/^[\u0400-\u04FF -]*[\u0400-\u04FF][\u0400-\u04FF -]+$/, `${string.organization.orgLocalName} ${string.onboarding.validations.onlyCyrillicAlphabet}`),
    }),
    state_reg_id: Yup.string()
        .trim()
        .matches(/^[0-9]+$/, `${string.onboarding.validations.onlyNumber} ${string.onboarding.stateRegId}`)
        .required(`${string.onboarding.stateRegId} ${string.errors.required}`),
    street_address: Yup.string().trim().required(`${string.onboarding.address} ${string.errors.required}`),
    country_id: Yup.string().required(`${string.onboarding.country} ${string.errors.required}`),
    state_id: Yup.string().required(`${string.onboarding.state} ${string.errors.required}`),
    type_id: Yup.string().trim().required(`${string.selectTypeNot}`),
})

let orgNameVaildation

const AddOrganization = () => {
    const { setSelectedStep, orgTypes, countries, decodedToken, orgStates, orgCities, handleOrgTypeChange, handleStateChange, handleCountryChange, setOnboarding, verifyWithMVS, createOrgUniqId, onboarding, stateValues, router, checkMVSVerification } = useContext(OnBoardContext)
    const refSubmitForm = useRef()
    const [showTick, setShowTick] = useState(false)
    const [showTickState, setShowTickState] = useState(false)
    const { token, step } = router.query
    const language = decodedToken?.language
    const idVerify = decodedToken?.idVerify
    const [disabled, setDisabled] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const formik = useFormik({
        initialValues: {
            orgName: onboarding.orgName ?? '',
            local_name: onboarding.local_name ?? '',
            state_reg_id: onboarding.state_reg_id ?? '',
            street_address: onboarding.street_address ?? '',
            country_id: language == 'mn' ? 146 : onboarding.country_id || '',
            state_id: onboarding.state_id ?? '',
            city_id: onboarding.city_id ?? '',
            type_id: onboarding.type_id ?? '',
        },
        enableReinitialize: true,
        validationSchema:  AddOrganizationSchema,
        onSubmit: async (values) => {
            if (!orgNameVaildation?.orgName) {
                setOnboarding({ type: 'updateOrgInfo', payload: values })
                const orgId = createOrgUniqId(values.orgName)
                if (language == 'mn' && idVerify) {
                    const verificationData = await verifyWithMVS('organization', { ...values, orgId })
                    if (verificationData?.id) {
                        stateValues.onboarding = { ...stateValues.onboarding, ...values, orgId }
                        window.localStorage.setItem('onBoardData', JSON.stringify(stateValues))
                        router.push({
                            pathname: process.env.MVS_AUTH_URL,
                            query: {
                                s_url: `${window.location.origin}${router.pathname}?token=${token}&step=step8&status=failed`,
                                e_url: `${window.location.origin}${router.pathname}?token=${token}&step=step8&status=failed`,
                                id: verificationData.id,
                                type: 'organization',
                            },
                        })
                    } else {
                        notify(string.onboarding.validations.verificationReject)
                    }
                } else {
                    setSelectedStep('step9')
                }
            }
        },
    })

    const checkOrgName = async () => {
        try {
            formik.setFieldTouched('orgName', true)
            const { isExist } = await checkOrgNameIsAvailable({ name: formik.values.orgName ?? '' })
            if (isExist) {
                formik.setFieldError('orgName', string.onboarding.validations.orgExists)
                orgNameVaildation = { orgName: string.onboarding.validations.orgExists }
            } else {
                orgNameVaildation = {}
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        checkVerification()
    }, [language, idVerify])

    const checkVerification = async () => {
        if (language == 'mn') {
            if (!step) handleCountryChange(146, 'organization')
            if (idVerify) {
                const { status } = router.query
                if (status && status == 'failed') {
                    notify(string.onboarding.validations.verificationReject)
                } else {
                    const verificationData = await checkMVSVerification('user')
                    if (!verificationData.approved) {
                        notify(string.onboarding.validations.verificationReject)
                        setSelectedStep('step6')
                    }
                }
            }
        }
    }

    const checkOrgNameValidation = () => {
        if (!!orgNameVaildation?.orgName) {
            setTimeout(() => {
                formik.setFieldError('orgName', orgNameVaildation.orgName)
            }, 300)
        }
    }

    const customHandleBlur = (e) => {
        formik.handleBlur(e)
        checkOrgNameValidation()
    }

    const customHandleChange = (e) => {
        formik.handleChange(e)
        checkOrgNameValidation()
    }

    const verifyMangolianUser = async () => {
        setIsLoading(true)
        const data = {
            stateId: formik.values.state_reg_id,
        }
        const checkOrganizationExistsStateId = await checkOrganizationExists(data)
        if (checkOrganizationExistsStateId.data.nameExists) {
            formik.setErrors({ state_reg_id: string.onboarding.alreadyRegisteredTxt })
        } else {
            const verificationToken = await getMVSToken()
            const verToken = verificationToken.token
            const opts = {
                register: formik.values.state_reg_id,
                name: formik.values.local_name,
            }
            const orgVerification = await verifyMangolianOrg(opts, verToken)
            if (orgVerification.match) {
                setShowTick(true)
                setShowTickState(true)
            } else if (orgVerification.match === false) {
                formik.setErrors({ local_name: string.onboarding.localnameNotMatched })
                setShowTickState(true)
                setShowTick(false)
            } else {
                formik.setErrors({ local_name: string.onboarding.notRegisterd, state_reg_id: string.onboarding.notRegisterd })
                setShowTick(false)
                setShowTickState(false)
            }
        }
        setIsLoading(false)
    }
    const handleNext = () => {
        refSubmitForm.current.click()
        checkOrgNameValidation()
    }

    const handlePrevious = () => {
        setSelectedStep('step7')
    }

    useEffect(() => {
        if (language == 'mn') {
            handleCountryChange(146, 'organization')
        }
    }, [formik.values.country_id])

    useEffect(() => {
        if (idVerify) {
            setDisabled(true)
            if (showTick) {
                setDisabled(false)
            }
        }
    })

    return (
        <>
            <div className='angry-grid add-org-wrapper'>
                <div className='add-org-left-column'>
                    <div className='d-flex align-items-end verify-heading'>
                        <img style={{ width: '70px' }} src='/static/img/onboarding/office.png' />
                        <h3 className='mb-0'>{`${string.onboarding.addorginfo}`}</h3>
                    </div>
                    <div>
                        <form id='addOrgForm' className='org-info-form' onSubmit={formik.handleSubmit}>
                            {/* Organization Name and Recommendation text */}
                            <div className='d-flex org-input-row align-items-start'>
                                <TextField
                                    className='org-input'
                                    id='name'
                                    name='orgName'
                                    label={language != 'mn' ? string.organization.orgName : string.organization.engOrgName}
                                    variant='standard'
                                    value={formik.values.orgName}
                                    onChange={customHandleChange}
                                    error={!!(formik.errors.orgName && formik.touched.orgName)}
                                    helperText={formik.errors.orgName && formik.touched.orgName ? formik.errors.orgName : null}
                                />
                                <div className='recommonded-text'>{string.onboarding.recommondedText}</div>
                            </div>
                            {/* Organization Name in Mongolian and Recommendation text */}
                            {(language == 'mn' || parseInt(formik.values?.country_id) === 146) && (
                                <div className='d-flex org-input-row'>
                                    <TextField
                                        className='org-input'
                                        id='local_name'
                                        name='local_name'
                                        disabled={showTick ? true : ''}
                                        label={string.organization.orgLocalName}
                                        variant='standard'
                                        value={formik.values.local_name}
                                        onChange={customHandleChange}
                                        error={!!(formik.errors.local_name && formik.touched.local_name)}
                                        helperText={formik.errors.local_name && formik.touched.local_name ? formik.errors.local_name : null}
                                        onBlur={customHandleBlur}
                                    />
                                    <div>{showTick && <img style={{ marginTop: '25px' }} src='/static/img/onboarding/correct.png' />}</div>

                                    <div className='recommonded-text'>{string.onboarding.recommondedTextMongolian}</div>
                                </div>
                            )}
                            {/* State registration ID and Type */}
                            <div className='d-flex org-input-row'>
                                <TextField
                                    className='org-input'
                                    id='state_reg_id'
                                    name='state_reg_id'
                                    disabled={showTick ? true : ''}
                                    label={string.onboarding.stateRegId}
                                    variant='standard'
                                    value={formik.values.state_reg_id}
                                    onChange={customHandleChange}
                                    error={!!(formik.errors.state_reg_id && formik.touched.state_reg_id)}
                                    helperText={formik.errors.state_reg_id && formik.touched.state_reg_id ? formik.errors.state_reg_id : null}
                                    onBlur={customHandleBlur}
                                />
                                {showTickState && <img style={{ width: '32px', height: '32px', marginTop: '15px' }} src='/static/img/onboarding/correct.png' />}

                                {formik.values.local_name && formik.values.state_reg_id && idVerify && (
                                    <div>
                                        <Button variant='contained' style={{ marginLeft: 47, marginTop: 10, width: 220, height: 50, border: '2px solid gray' }} onClick={() => verifyMangolianUser()}>
                                            {isLoading ? <Spinner size='sm' /> : string.onboarding.orgVerifyBtn}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className='d-flex org-input-row'>
                                <TextField
                                    id='type_id'
                                    name='type_id'
                                    disabled={disabled}
                                    select
                                    label={string.onboarding.selectType}
                                    value={formik.values.type_id}
                                    onChange={(event) => {
                                        handleOrgTypeChange(event.target.value)
                                        customHandleChange(event)
                                    }}
                                    variant='standard'
                                    className='org-input-min-width'
                                    error={!!(formik.errors.type_id && formik.touched.type_id)}
                                    helperText={formik.errors.type_id && formik.touched.type_id ? formik.errors.type_id : null}
                                >
                                    {orgTypes.map((option) => (
                                        <MenuItem key={option.id} value={option.id}>
                                            {option.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </div>
                            {/* Street Address */}
                            <div className='org-input-row'>
                                <TextField
                                    className='w-100'
                                    disabled={disabled}
                                    id='street_address'
                                    name='street_address'
                                    label={string.onboarding.streetAddress}
                                    variant='standard'
                                    value={formik.values.street_address}
                                    onChange={customHandleChange}
                                    error={!!(formik.errors.street_address && formik.touched.street_address)}
                                    helperText={formik.errors.street_address && formik.touched.street_address ? formik.errors.street_address : null}
                                    onBlur={customHandleBlur}
                                />
                            </div>
                            {/* Country and State */}
                            <div className='d-flex justify-content-between org-input-row'>
                                <TextField
                                    id='country_id'
                                    name='country_id'
                                    select
                                    disabled={language == 'mn'}
                                    label={string.onboarding.country}
                                    value={formik.values.country_id}
                                    onChange={(event) => {
                                        handleCountryChange(event.target.value, 'organization')
                                        formik.setFieldValue('state_id', '')
                                        formik.setFieldValue('city_id', '')
                                        customHandleChange(event)
                                    }}
                                    variant='standard'
                                    className='mr-5 org-input-min-width'
                                    error={!!(formik.errors.country_id && formik.touched.country_id)}
                                    helperText={formik.errors.country_id && formik.touched.country_id ? formik.errors.country_id : null}
                                >
                                    {countries.map((country) => (
                                        <MenuItem key={country.id} value={country.id}>
                                            {country.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    id='state_id'
                                    name='state_id'
                                    select
                                    disabled={disabled}
                                    label={string.onboarding.state}
                                    value={formik.values.state_id}
                                    onChange={(event) => {
                                        handleStateChange(event.target.value, 'organization')
                                        formik.setFieldValue('city_id', '')
                                        customHandleChange(event)
                                    }}
                                    variant='standard'
                                    className='org-input-min-width'
                                    error={!!(formik.errors.state_id && formik.touched.state_id)}
                                    helperText={formik.errors.state_id && formik.touched.state_id ? formik.errors.state_id : null}
                                >
                                    {orgStates.map((state) => (
                                        <MenuItem key={state.id} value={state.id}>
                                            {state.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </div>
                            {/* City */}
                            <div className='d-flex justify-content-between'>
                                <TextField
                                    id='city_id'
                                    name='city_id'
                                    select
                                    disabled={disabled}
                                    label={string.onboarding.city}
                                    value={formik.values.city_id}
                                    onChange={customHandleChange}
                                    variant='standard'
                                    className='mr-5 org-input-min-width'
                                    error={!!(formik.errors.city_id && formik.touched.city_id)}
                                    helperText={formik.errors.city_id && formik.touched.city_id ? formik.errors.city_id : null}
                                >
                                    {orgCities?.map((city) => (
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
                    button {
                        border: 0;
                        background: transparent;
                    }
                `}
            </style>
        </>
    )
}

export default AddOrganization
