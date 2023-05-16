//NextJs Config here

const withCSS = require('@zeit/next-css')
const dotenv = require('dotenv')

module.exports = withCSS({
    cssLoaderOptions: {
        url: false,
    },
    onDemandEntries: {
        // period (in ms) where the server will keep pages in the buffer
        maxInactiveAge: 1000 * 60 * 60 * 24 * 30, // 1 month
        // number of pages that should be kept simultaneously without being disposed
        pagesBufferLength: 100,
    },
    env: dotenv.config().parsed,
})
