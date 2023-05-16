import Router from 'next/router'
import { useEffect, useState } from 'react'
import NProgress from 'nprogress'
import string from '../../utils/LanguageTranslation.js'
import withAuth from '../../lib/withAuth'
import { fetchLanguages, updateLanguage } from '../../lib/api/language'
import notify from '../../lib/notifier'
import NotifyModal from './NotifyModal'
import { Spinner } from 'reactstrap'

function LanguagePage(props) {
    if (typeof window === 'undefined') {
        return null
    }

    const [languages, setLanguages] = useState([])
    const [user, setUser] = useState(props.user || {})
    const [index, setIndex] = useState(0)
    const [isOpen, setOpen] = useState(false)
    const [ isloader, setIsloader] = useState(false)

    useEffect(() => {
        fetchIntialData()
    }, [])

    const fetchIntialData = async () => {
        NProgress.start()
        try {
            const languages = await fetchLanguages()
            setLanguages(languages)
        } catch (err) {
            notify(err.message || err.toString())
        }
        NProgress.done()
    }

    // set new updated language json file
    const onUpdateLanguage = async (language, index) => {
        setIsloader(true)
        NProgress.start()
        try {
            const response = await updateLanguage(language.id)
            if (response.json) {
                window.localStorage.setItem('languageJson', JSON.stringify(response.json))
            }
            if (response.json) {
                setOpen(true)
                setIndex(index)
            } else {
                notify(string.languageRequest.reloadError)
            }
            NProgress.done()
        } catch (err) {
            notify(string.languageRequest.reloadError)
            NProgress.done()
        }
        setIsloader(false)
    }

    const getLatestLanguage = () => {
        // To get latest selected language
        const selectedLanguage = window.localStorage.getItem('language') || 'US'
        if (selectedLanguage.toLowerCase() === languages[index].code.toLowerCase()) {
            Router.reload(window.location.pathname)
        }
        setOpen(!isOpen)
    }

    return (
        <div className='container-fluid'>
            <div className='row d-flex project-listing'>
                <div className='tab-pane fade show active mt-3 w-100' id='truck' role='tabpanel' aria-labelledby='truck-listing'>
                    <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                        <h4 className='text-dark'>{string.languageRequest.languageListing}</h4>
                    </div>
                    <div className='project-table-listing table-responsive mt-2 w-100'>
                        <table className='table'>
                            <thead className='thead-dark'>
                                <tr>
                                    <th scope='col'>#</th>
                                    <th scope='col'>{string.languageRequest.language}</th>
                                    <th className='text-center' scope='col'>
                                        {string.actions}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {languages.map((language, index) => {
                                    const { id, name } = language
                                    return (
                                        <tr key={id}>
                                            <td>{index + 1}</td>
                                            <td>{name}</td>
                                            <td>
                                                <i title={string.upadtelang} className='fa fa-sync' onClick={() => onUpdateLanguage(language, index)}></i>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                   {isloader && <center><Spinner style={{marginTop:50}}/></center>}
                <NotifyModal toggle={() => setOpen(!isOpen)} isOpen={isOpen} getLatestLanguage={getLatestLanguage} />
                </div>
            </div>
        </div>
    )
}

export default withAuth(LanguagePage, { loginRequired: true })
