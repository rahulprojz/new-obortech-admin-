import sendRequest from './sendRequest';
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/road';

export const addRoad = data =>
  sendRequest(`${BASE_PATH}/add`, {
    body: JSON.stringify(data),
  });

export const fetchRoads = (payload) =>
  sendRequest(`${BASE_PATH}/fetch${getQuery(payload)}`, {
    method: 'GET',
  });

export const removeRoad = data =>
  sendRequest(`${BASE_PATH}/remove`, {
    body: JSON.stringify(data),
  });

export const updateRoad = data =>
  sendRequest(`${BASE_PATH}/update`, {
    body: JSON.stringify(data),
  });