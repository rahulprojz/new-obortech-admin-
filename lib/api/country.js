import sendRequest from './sendRequest';

const BASE_PATH = '/api/v1/countries';

export const getAllCountriesApi = () =>
  sendRequest(`${BASE_PATH}`, {
    method: 'GET',
  }
);

export const getCountryByIdApi = (id) =>
  sendRequest(`${BASE_PATH}/${id}`, {
    method: 'GET',
  }
);
