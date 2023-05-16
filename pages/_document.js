/* eslint-disable react/no-danger */
import React from 'react'
import Document, { Html, Head, Main, NextScript } from 'next/document'
import { ServerStyleSheets } from '@material-ui/styles'
import htmlescape from 'htmlescape'

const { GA_TRACKING_ID, StripePublishableKey } = process.env
const env = { GA_TRACKING_ID, StripePublishableKey }

class MyDocument extends Document {
    render() {
        return (
            <Html lang='en'>
                <Head>
                    <meta charSet='utf-8' />
                    <meta httpEquiv='X-UA-Compatible' content='IE=edge' />
                    <meta name='description' content='' />
                    <meta name='author' content='' />

                    {/* Favicon */}
                    <link rel='icon' href='/static/img/favicon.png' sizes='32x32' />

                    {/* Custom fonts for this template */}
                    <link href='/static/css/all.css' rel='stylesheet' type='text/css' />
                    <link href='https://fonts.googleapis.com/css?family=Roboto+Condensed:400|Roboto:400&amp;subset=cyrillic' rel='stylesheet' />

                    {/* Custom styles for this template */}
                    <link href='/static/css/sb-admin-2.css' rel='stylesheet' />
                    <link href='/static/css/common.css' rel='stylesheet' />

                    {/* NPProgress CSS */}
                    <link rel='stylesheet' href='/static/css/nprogress.css' />

                    {/*Font awesome  latest version*/}
                    <link rel='stylesheet' href='https://pro.fontawesome.com/releases/v5.11.1/css/all.css' />
                </Head>
                <body>
                    <Main />
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `__ENV__ = ${htmlescape(env)}`,
                        }}
                    />
                    <NextScript />
                </body>
                {/* Bootstrap core JavaScript */}
                <script src='/static/js/jquery.min.js'></script>
                <script src='/static/js/bootstrap.bundle.js'></script>

                {/* Custom scripts for all pages */}
                <script src='/static/js/sb-admin-2.js'></script>
                <script src='https://cdn.scaleflex.it/plugins/filerobot-image-editor/3.12.17/filerobot-image-editor.min.js' />
            </Html>
        )
    }
}

const paths = ['/login', '/onboarding', '/reset-password']

MyDocument.getInitialProps = async (ctx) => {
    // Render app and page and get the context of the page with collected side effects.
    const sheets = new ServerStyleSheets()
    const originalRenderPage = ctx.renderPage
    const { res } = ctx

    ctx.renderPage = () =>
        originalRenderPage({
            enhanceApp: (App) => (props) => {
                if (!paths.includes(props.router.pathname) && !props.pageProps.user) {
                    res.redirect('/login')
                }
                return sheets.collect(<App {...props} />)
            },
        })

    const initialProps = await Document.getInitialProps(ctx)
    return {
        ...initialProps,
        // Styles fragment is rendered after the app and page rendering finish.
        styles: (
            <React.Fragment>
                {initialProps.styles}
                {sheets.getStyleElement()}
            </React.Fragment>
        ),
    }
}

export default MyDocument
