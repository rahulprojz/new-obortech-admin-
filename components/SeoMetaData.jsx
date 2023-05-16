import Head from "next/head";

export default function SeoMetaData({ meta_data }) {
    return (

        <Head>
            <title>{`${process.env.APP_NAME} - ${meta_data && meta_data.title}`}</title>
            <link rel="icon" href="/static/img/site_icon/cuddlynest.ico"></link>
        </Head>
    )

}