import sendRequest from './sendRequest';

const BASE_PATH = '/api/v1/roles';

export const getAllRolesApi = () =>
    sendRequest(`${BASE_PATH}`, {
        method: 'GET',
    }
)
