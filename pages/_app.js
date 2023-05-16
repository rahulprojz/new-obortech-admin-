import Head from 'next/head'
import React, { useEffect } from 'react'
import Router from 'next/router'
import NProgress from 'nprogress'
import { Provider } from 'react-redux'
import Notifier from '../components/Notifier'
import { useStore } from '../redux/store'
import { CookiesProvider, useCookies } from 'react-cookie'
import { useRouter } from 'next/router'
import '../static/css/card.css'
import '../static/css/table.css'
import '../static/css/modal.css'
import '@pdftron/webviewer-react-toolkit/dist/css/style.css'
import { LanguageProvider } from '../intl/LanguageProvider'
import 'suneditor/dist/css/suneditor.min.css'
import 'react-quill/dist/quill.snow.css'
import PageWrapper from '../components/page-wrapper'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import axios from 'axios'

import { getchGeoLocation } from '../lib/api/auth'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity,
            keepPreviousData: false,
            cacheTime: Infinity,
            suspense: true,
            retry: 0,
        },
    },
})

const isPublicRoute = (route) => {
    switch (route) {
        case '/login':
            return true
        case '/onboarding':
            return true
        case '/reset-password':
            return true
        default:
            return false
    }
}

Router.onRouteChangeStart = (url) => {
    if (typeof window !== 'undefined' && window.location.pathname == url) {
        window.location.reload()
    } else {
        NProgress.start()
    }
}

const MyApp = ({ Component, pageProps, router }) => {
    const store = useStore(pageProps.initialReduxState)
    const [cookies, setCookie] = useCookies(['authToken'])

    const getUserCountry = async () => {
        // From here we can switch maintenance mode true/false
        const data = await axios.get('http://ip-api.com/json')
        if (data.data.countryCode == 'IN' || data.data.countryCode == 'UK') {
            if (router.route == '/maintenance') {
                window.location.href = '/'
            }
        } else if ((data.country_code != 'IN' || data.country_code != 'UK') && router.route != '/maintenance') {
            window.location.href = '/maintenance'
        }
    }

    useEffect(() => {
        const jssStyles = document.querySelector('#jss-server-side')
        if (jssStyles && jssStyles.parentNode) {
            jssStyles.parentNode.removeChild(jssStyles)
        }
        // Check if user is public user
        const isPublicUser = pageProps.user && pageProps.user?.role_id == process.env.ROLE_PUBLIC_USER
        if (window.location.pathname != '/track-item' && isPublicUser) {
            window.location.href = '/track-item'
        }
        if (window.location.pathname === '/track-item' && !isPublicUser) {
            window.location.href = '/project'
        }

        // Country based condition for maintenance
        getUserCountry()
    }, [])

    /* const getUserCountry = async () => {
        // From here we can switch maintenance mode true/false

        const res = await axios.get('https://geolocation-db.com/json/')
        const response = await fetch(`https://geolocation-db.com/json/`, { method: 'GET' })
        const data = await response.json()
        if (data.countryCode == 'IN') {
            setMaintenanceMode(false)
        }
    } */

    const childComponent = () => {
        const [cookies, setCookie] = useCookies(['authToken'])
        return (
            <div className={`body-wrapper ${router.route === '/onboarding' ? 'pt-0' : ''}`}>
                <Head>
                    <meta name='viewport' content='width=device-width, initial-scale=1, shrink-to-fit=no' />
                </Head>
                <Component {...pageProps} key={router.route} />
                <Notifier />
            </div>
        )
    }
    return (
        <LanguageProvider>
            <QueryClientProvider contextSharing client={queryClient}>
                <Provider store={store}>
                    {(router.route == '/maintenance') === true ? (
                        <Component {...pageProps} key={router.route} />
                    ) : isPublicRoute(router.route) ? (
                        childComponent()
                    ) : (
                        <PageWrapper route={router.route} user={pageProps.user} router={router}>
                            {childComponent()}
                        </PageWrapper>
                    )}
                </Provider>
                <ReactQueryDevtools />
            </QueryClientProvider>
        </LanguageProvider>
    )
}

MyApp.getInitialProps = async ({ Component, ctx }) => {
    const pageProps = {}

    if (Component.getInitialProps) {
        Object.assign(pageProps, await Component.getInitialProps(ctx))
    }

    return { pageProps }
}

export default MyApp
