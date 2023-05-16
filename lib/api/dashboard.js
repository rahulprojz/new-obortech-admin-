import sendRequest from './sendRequest';
import sendRequestWithFile from './sendRequestWithFile';

const BASE_PATH = '/api/v1/dashboard';

export const fetchStats = ({ user_id }) =>
  sendRequest(`${BASE_PATH}/stats/${user_id}`, {
    method: 'GET',
  });