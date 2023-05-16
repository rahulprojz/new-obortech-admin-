import { TextField } from '@material-ui/core'
import { useFormik } from 'formik'
import { useContext, useRef, useState, useEffect } from 'react'
import OnBoardContext from '../../store/onBoard/onBordContext'
import string from '../../utils/LanguageTranslation.js'
import GenerateGithubTokenStepsModal from '../../pages/smart-contracts/modal/GenerateGithubTokenSteps'
import { checkIfUserExists } from '../../lib/api/github'
import { checkGithubUsername } from '../../lib/api/user'
import { Spinner } from 'reactstrap'
import notify from '../../lib/notifier'

const validate = (values) => {
    const errors = {}
    if (values.githubUsername || values.githubToken) {
        if (!values.githubUsername) {
            errors.githubUsername = `${string.onboarding.username} ${string.errors.required}`
        }
        if (!values.githubToken) {
            errors.githubToken = `${string.onboarding.token} ${string.errors.required}`
        }
    }
    return errors
}

const AddGithubInfo = () => {
    const { setSelectedStep, setOnboarding, onboarding, checkMVSVerification, decodedToken } = useContext(OnBoardContext)
    const refSubmitForm = useRef()
    const refVerifyGit = useRef()
    const refGithubUserName = useRef()
    const refGithubToken = useRef()
    const [isOpenInfo, setIsOpenInfo] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [githubVerified, setGithubVerified] = useState(onboarding.githubVerified ?? true)
    const language = decodedToken?.language
    const idVerify = decodedToken?.idVerify

    const handleOnToggleInfoModal = () => {
        setIsOpenInfo((isOpen) => !isOpen)
    }

    const formik = useFormik({
        initialValues: {
            githubUsername: onboarding.githubUsername ?? '',
            githubToken: onboarding.githubToken ?? '',
        },
        onSubmit: async (values) => {
            setVerifying(true)
            if (!githubVerified && values.githubUsername.trim() != '' && values.githubToken.trim() != '') {
                const data = {
                    username: values.githubUsername.trim(),
                    token: values.githubToken.trim()
                }
                const isUserNametaken = await checkGithubUsername(data)
                if (!isUserNametaken.status) {
                    const response = await checkIfUserExists(data)
                    const githubErrors = {}
                    if (response && ((response.login != data.username) || (response.status === 401))) {
                        githubErrors.githubUsername = ``
                        githubErrors.githubToken = `${string.smartContract.invalidGitCredentials}`
                        formik.setErrors(githubErrors)
                    } else {
                        const data = {
                            githubUsername: values.githubUsername.trim(),
                            githubToken: values.githubToken.trim()
                        }
                        setOnboarding({ type: 'updateOrgInfo', payload: data })
                        notify(`${string.smartContract.gitHubCredsVerified}`)
                        setGithubVerified(true)
                    }
                } else {
                    const githubErrors = {}
                    githubErrors.githubUsername = string.smartContract.uniqueGitUserName
                    formik.setErrors(githubErrors)
                }

            } else {

                setOnboarding({ type: 'updateOrgInfo', payload: values })
                setSelectedStep('step8')
            }
            setVerifying(false)
        },
        validate,
    })

    const verifyGitCredentials = () => {
        refSubmitForm.current.click()
    }
    const handleNext = () => {
        refSubmitForm.current.click()
    }

    const handlePrevious = () => {
        setSelectedStep('step6')
    }

    const handleOnChange = async (event, data) => {

        formik.handleChange(event)
        setGithubVerified(false)

    }

    const checkVerification = async () => {
        if (language == 'mn') {
            if (idVerify) {
                const verificationData = await checkMVSVerification('user')
                if (!verificationData.approved) {
                    notify(string.onboarding.validations.verificationReject)
                    setSelectedStep('step6')
                }
            }
        }
    }

    useEffect(() => {
        checkVerification()
    }, [language, idVerify])


    return (
        <>
            <div className='angry-grid add-user-info-wrapper'>
                <div className='add-user-info-left-column'>
                    <div className='d-flex align-items-end verify-heading'>
                        <img style={{ width: '70px' }} src='/static/img/onboarding/github.png' />
                        <h3 className='mb-0'>{`${string.onboarding.addGithubInfoOptional}`} <span style={{ marginLeft: '10px', marginBottom: '5px', cursor: 'pointer' }} onClick={handleOnToggleInfoModal}>
                            &#9432;
                        </span></h3>
                    </div>
                    <div>
                        <p className='ob-font-light font-italic'>{string.onboarding.gitHubDetailsInfo}</p>
                    </div>
                    <div>
                        <form id='addUserForm' onSubmit={formik.handleSubmit}>
                            <div className='d-flex username-field margin-bottom-50'>
                                <TextField
                                    className='add-user-info-input w-100'
                                    label={string.onboarding.username}
                                    id='githubUsername'
                                    name='githubUsername'
                                    variant='standard'
                                    defaultValue=''
                                    ref={refGithubUserName}
                                    value={formik.values.githubUsername}
                                    onChange={handleOnChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.githubUsername && formik.errors.githubUsername ? (
                                        formik.errors.githubUsername
                                    ) : null}
                                    helperText={formik.touched.githubUsername && formik.errors.githubUsername ? formik.errors.githubUsername : null}
                                />

                            </div>
                            <div className='d-flex w-100 align-items-end username-field margin-bottom-50'>
                                <TextField
                                    className='add-user-info-input w-100'
                                    label={string.onboarding.token}
                                    id='githubToken'
                                    name='githubToken'
                                    variant='standard'
                                    defaultValue=''
                                    ref={refGithubToken}
                                    value={formik.values.githubToken}
                                    onChange={handleOnChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.githubToken && formik.errors.githubToken ? (
                                        formik.errors.githubToken
                                    ) : null}
                                    helperText={formik.touched.githubToken && formik.errors.githubToken ? formik.errors.githubToken : null}
                                />

                            </div>

                            <button type='submit' ref={refVerifyGit} onClick={() => verifyGitCredentials} className='btn red-btn' disabled={githubVerified}>
                                {verifying ? <Spinner size='sm' /> : `${string.smartContract.verify}`}
                            </button>

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
                    <button onClick={handleNext} disabled={Object.keys(formik.errors).length}>
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
            <GenerateGithubTokenStepsModal isOpen={isOpenInfo} onToggle={handleOnToggleInfoModal} />
        </>
    )
}

export default AddGithubInfo
