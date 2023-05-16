import { fetchDocument, getAccess } from '../lib/api/network-api'
import NProgress from 'nprogress'

export const getIpfsImage = async (uniqueId, blockchain_name, documentHash, hideOnRefresh = false, fileType = 'application/pdf') => {
    try {
        NProgress.start()
        const accessToken = await getAccess(uniqueId, blockchain_name)
        if (accessToken.error) {
            throw accessToken.error
        }
        const file = await fetchDocument(accessToken, documentHash)
        const fileBlob = new Blob([file.data], { type: fileType })

        const documentURL = URL.createObjectURL(fileBlob)
        const anchor = document.createElement('a')
        anchor.href = documentURL
        anchor.target = '_blank'
        anchor.document = documentHash

        document.body.appendChild(anchor)
        anchor.click()

        URL.revokeObjectURL(documentURL)
        document.body.removeChild(anchor)

        if (hideOnRefresh) {
            URL.revokeObjectURL(documentURL)
        }
    } catch (error) {
        console.error(error)
    } finally {
        NProgress.done()
    }
}

module.exports = { getIpfsImage }
