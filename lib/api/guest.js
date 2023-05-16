import sendRequest from './sendRequest'
import sendRequestWithFile from './sendRequestWithFile'

const BASE_PATH = '/api/v1/guest'
export const splitPdf = (data) =>
    sendRequestWithFile(`${BASE_PATH}/split-pdf`, {
        body: data,
    })

export const convertDocument = (data) =>
    sendRequestWithFile(`${BASE_PATH}/convert-document`, {
        body: data,
    })

export const saveImages = (data) =>
    sendRequestWithFile(`${BASE_PATH}/save-images`, {
        body: data,
    })

export const savePdf = (data) =>
    sendRequestWithFile(`${BASE_PATH}/save-pdf`, {
        body: data,
    })

export const getPdf = (data) =>
    sendRequest(`${BASE_PATH}/getPdf`, {
        body: JSON.stringify(data),
    })

export const saveEditedFile = (data) =>
    sendRequest(`${BASE_PATH}/save-editedImage`, {
        body: JSON.stringify(data),
    })

export const deleteFile = (data) =>
    sendRequest(`${BASE_PATH}/deleteFile`, {
        body: JSON.stringify(data),
    })
export const onSortImages = (data) =>
    sendRequest(`${BASE_PATH}/onsortend-image`, {
        body: JSON.stringify(data),
    })
