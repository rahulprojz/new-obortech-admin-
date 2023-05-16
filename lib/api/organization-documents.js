import sendRequest from "./sendRequest";
const BASE_PATH = "/api/v1/organization-documents";

export const addDocument = data =>
    sendRequest(`${BASE_PATH}/add`, {
        body: JSON.stringify(data)
    });

export const fetchDocument = data =>
    sendRequest(`${BASE_PATH}/fetch`, {
        body: JSON.stringify(data)
    });