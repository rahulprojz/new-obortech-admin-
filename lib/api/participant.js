import sendRequest from './sendRequest';

const BASE_PATH = '/api/v1/participant';

export const addParticipant = data =>
  sendRequest(`${BASE_PATH}/add`, {
    body: JSON.stringify(data),
  });

export const fetchParticipants = () =>
  sendRequest(`${BASE_PATH}/fetch`, {
    method: 'GET',
  });

export const removeParticipant = data =>
  sendRequest(`${BASE_PATH}/remove`, {
    body: JSON.stringify(data),
  });

export const updateParticipant = data =>
  sendRequest(`${BASE_PATH}/update`, {
    body: JSON.stringify(data),
  });