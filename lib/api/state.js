import sendRequest from './sendRequest';

const BASE_PATH = '/api/v1/states';

export const getAllStatesApi = code =>
  sendRequest(`${BASE_PATH}?code=${code}`, {
    method: 'GET',
  }
);