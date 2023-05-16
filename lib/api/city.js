import sendRequest from './sendRequest';

const BASE_PATH = '/api/v1/cities';

export const getAllCitiesApi = code =>
  sendRequest(`${BASE_PATH}?code=${code}`, {
    method: 'GET',
  }
);

export const getCityByIdApi = (id) =>
  sendRequest(`${BASE_PATH}/${id}`, {
    method: 'GET',
  }
);

