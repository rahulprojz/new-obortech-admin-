import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import dynamic from 'next/dynamic'
import NProgress from 'nprogress'
import { fetchPrivacyPolicy, addPrivacyPolicy } from '../../lib/api/privacyPolicy'
import string from '../../utils/LanguageTranslation.js'
import withAuth from '../../lib/withAuth'
import Button from '../../components/common/form-elements/button/Button'
import ConfirmationModal from './ConfirmationModal'
import notify from '../../lib/notifier'
import { useRouter } from 'next/router'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

const PrivacyPolicy = (props) => {
    if (typeof window === 'undefined') {
        return null
    }

    const { user } = props
    const [id, setId] = useState(null)
    const [privacyPolicy, setPrivacyPolicy] = useState({ html: '' })
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false)
    const [isloading, setIsLoading] = useState(false)
    const router = useRouter()

    const selectedLanguage = window.localStorage.getItem('language') ? window.localStorage.getItem('language') : 'US'

    useEffect(() => {
        try {
            if (user != undefined) {
                if (user.role_id !== 1) {
                    router.push('/404')
                }
            }
            NProgress.start()
            async function privacypolicy() {
                const privacy = await fetchPrivacyPolicy()
                setPrivacyPolicy({ html: selectedLanguage.toLowerCase() == 'us' ? privacy?.en_html : privacy?.mn_html })
                setId(privacy?.id)
            }
            privacypolicy()
            NProgress.done()
        } catch (error) {
            setPrivacyPolicy({ html: '' })
            NProgress.done()
        }
    }, [])

    const _handleChange = (content) => {
        setPrivacyPolicy({ html: content, text: '' })
    }

    const _handleSubmit = async () => {
        if (privacyPolicy.html.replace(/<(.|\n)*?>/g, '').trim().length === 0 && !privacyPolicy.html.includes('<img')) {
            notify(string.privacyPolicy.policyValidationMsg)
            setOpenConfirmationModal(false)
            return false
        }
        NProgress.start()
        setIsLoading(true)
        await addPrivacyPolicy({ id, ...privacyPolicy, lang: selectedLanguage })
        notify(string.privacyPolicy.policyUpdatedSuccessfully)
        NProgress.done()
        setOpenConfirmationModal(false)
        setIsLoading(false)
    }

    return (
        <div>
            <div className='container-fluid'>
                <div className='row d-flex'>
                    <div className='col-md-12 d-flex align-items-center justify-content-between p-0 event-filter '>
                        <h4 className='text-dark'>{string.privacyPolicy.privacyPolicy}</h4>
                    </div>
                    <div className='col-md-12 p-0'>
                        <ReactQuill
                            style={{
                                width: '100%',
                                fontFamily: 'Roboto Condensed',
                                fontSize: '14px',
                            }}
                            onChange={_handleChange}
                            placeholder='Please type here...'
                            defaultValue={privacyPolicy?.html}
                            value={privacyPolicy?.html}
                            modules={{
                                toolbar: {
                                    container: [[{ header: '1' }, { header: '2' }, { header: [3, 4, 5, 6] }, { font: [] }], [{ size: [] }], ['bold', 'italic', 'underline', 'strike', 'blockquote'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean'], ['code-block']],
                                },
                            }}
                        />
                    </div>
                    <div className='col-md-12 p-0 mt-2'>
                        <Button className='btn btn-primary large-btn' onClick={() => setOpenConfirmationModal(true)}>
                            {string.privacyPolicy.submitPrivacyPolicy}
                        </Button>
                    </div>
                </div>
            </div>
            <ConfirmationModal isOpen={openConfirmationModal} toggle={() => setOpenConfirmationModal(false)} handleSubmit={_handleSubmit} isLoading={isloading} />
        </div>
    )
}

PrivacyPolicy.getInitialProps = (ctx) => {
    const privacyPolicy = true
    return { privacyPolicy }
}

PrivacyPolicy.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.string,
    }),
}

PrivacyPolicy.defaultProps = {
    user: null,
}

export default withAuth(PrivacyPolicy, { loginRequired: true })
