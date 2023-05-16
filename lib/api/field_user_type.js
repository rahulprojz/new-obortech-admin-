import sendRequest from './sendRequest';

const BASE_PATH = '/api/v1/field-user-types';

export const getAllFieldUserTypesApi = () =>
    sendRequest(`${BASE_PATH}/`, {
        method: 'GET'
    }
)