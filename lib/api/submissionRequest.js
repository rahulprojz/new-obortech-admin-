import sendRequest from './sendRequest';
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/submissionrequest';

export const fetchProjects = () =>
    sendRequest(`${BASE_PATH}/projects`, {
        method: 'GET',
    });

export const fetchProject = data =>
    sendRequest(`${BASE_PATH}/projectDetails`, {
        body: JSON.stringify(data),
    });

export const submitRequest = data =>
    sendRequest(`${BASE_PATH}/submitRequest`, {
        body: JSON.stringify(data),
    });

export const fetchSubmissionRequests = (payload) =>
    sendRequest(`${BASE_PATH}/fetchSubmissionRequests${getQuery(payload)}`, {
        method: 'GET',
    });

export const removeSubmissionRequests = data =>
    sendRequest(`${BASE_PATH}/remove`, {
        body: JSON.stringify(data),
    });
