import sendRequest from './sendRequest';
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/group';

export const addGroup = data =>
  sendRequest(`${BASE_PATH}/add`, {
    body: JSON.stringify(data),
  });

export const fetchGroups = (payload) =>
  sendRequest(`${BASE_PATH}/fetch${getQuery(payload)}`, {
    method: 'GET',
  });

export const removeGroup = data =>
  sendRequest(`${BASE_PATH}/remove`, {
    body: JSON.stringify(data),
  });

export const updateGroup = data =>
  sendRequest(`${BASE_PATH}/update`, {
    body: JSON.stringify(data),
  });

export const fetchGroupProject = data =>
  sendRequest(`${BASE_PATH}/fetch-group-project`, {
    body: JSON.stringify(data),
  });
