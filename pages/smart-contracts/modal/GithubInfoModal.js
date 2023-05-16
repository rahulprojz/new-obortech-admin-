import { Formik } from 'formik'
import NProgress from 'nprogress'
import { useCallback, useState } from 'react'
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import * as Yup from 'yup'
import Router from 'next/router'

import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import { addGithubDetails } from '../../../lib/api/user'
import { checkIfUserExists } from '../../../lib/api/github'
import notify from '../../../lib/notifier'
import string from '../../../utils/LanguageTranslation.js'
import GenerateGithubTokenStepsModal from './GenerateGithubTokenSteps'
import Button from '../../../components/common/form-elements/button/Button'

const GithubInfoSchema = Yup.object().shape({
    username: Yup.string().required(`${string.onboarding.username} ${string.errors.required}`),
    token: Yup.string().required(`${string.onboarding.token} ${string.errors.required}`),
})

const GithubInfoModal = ({ isOpen, onToggle }) => {
    const [isLoading, setIsLoading] = useState(false)
    const [isOpenInfo, setIsOpenInfo] = useState(false)

    const handleOnToggleInfoModal = () => {
        setIsOpenInfo((isOpen) => !isOpen)
    }

    const handleOnSubmit = useCallback(
        async (values, setErrors) => {
            try {
                NProgress.start()
                setIsLoading(true)
                const response = await checkIfUserExists(values)
                const githubErrors = {}
                if (response && ((response.login != values.username) || (response.status === 401))) {
                    githubErrors.username = ``
                    githubErrors.token = `${string.smartContract.invalidGitCredentials}`
                    setErrors(githubErrors)
                } else {
                    const result = await addGithubDetails(values)
                    if (result.status) {
                        notify(string.githubInfoAddSuccess)
                        onToggle()
                    } else {
                        if (result.error == "Validation error") {
                            notify(string.smartContract.uniqueGitUserName)
                        } else {
                            notify(string.githubInfoAError)
                        }
                    }
                }

                setIsLoading(false)
                NProgress.done()
            } catch (err) {
                setIsLoading(false)
                notify(err.message || err.toString())
                NProgress.done()
            }
        },
        [onToggle],
    )

    if (typeof window === 'undefined') {
        return null
    }
    return (
        <>
            <Modal isOpen={isOpen} onToggle={onToggle} className='customModal document'>
                <div className='w-full text-right w-auto pt-3 pr-3'>
                    <Button
                        className="close"
                        type="button"
                        aria-label="Close"
                        onClick={() => Router.push('/')}
                    >
                        <span aria-hidden="true">×</span>
                    </Button>
                </div>
                <ModalHeader onToggle={onToggle}>
                    <span className='modal-title text-dark text-uppercase font-weight-bold' id='exampleModalLabel'>
                        {string.onboarding.addGithubInfo}
                    </span>{' '}
                    <span style={{ marginLeft: '10px', marginBottom: '5px', cursor: 'pointer' }} onClick={handleOnToggleInfoModal}>
                        &#9432;
                    </span>
                </ModalHeader>
                <ModalBody>
                    <Formik

                        initialValues={{
                            username: '',
                            token: '',
                        }}
                        validationSchema={GithubInfoSchema}
                        onSubmit={(values, { setErrors }) => {
                            handleOnSubmit(values, setErrors)
                        }}
                    >
                        {({ errors, touched, handleChange, handleBlur, handleSubmit, values, setErrors }) => (
                            <form onSubmit={handleSubmit}>
                                <div className='row ml-0 mr-0 content-block'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.onboarding.username}
                                        </label>
                                        <input
                                            type='text'
                                            name='username'
                                            className='form-control'
                                            defaultValue=''
                                            placeholder={string.onboarding.username}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {errors.username && touched.username ? <FormHelperMessage message={errors.username} className='error' /> : null}
                                    </div>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.onboarding.token}
                                        </label>
                                        <input
                                            type='text'
                                            name='token'
                                            className='form-control'
                                            placeholder={string.onboarding.token}
                                            defaultValue=''
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                        />
                                        {errors.token && touched.token ? <FormHelperMessage message={errors.token} className='error' /> : null}
                                    </div>
                                </div>
                                <ModalFooter>
                                    <div className='row text-center ob-justify-center p-3'>
                                        <LoaderButton type='submit' cssClass='btn btn-large btn-primary ob-min-w140 text-uppercase' isLoading={isLoading} text={string.submitBtnTxt} />
                                    </div>
                                </ModalFooter>
                            </form>
                        )}
                    </Formik>
                </ModalBody>
            </Modal>
            <GenerateGithubTokenStepsModal isOpen={isOpenInfo} onToggle={handleOnToggleInfoModal} />
        </>
    )
}

GithubInfoModal.propTypes = {}
GithubInfoModal.defaultProps = {}

export default GithubInfoModal
