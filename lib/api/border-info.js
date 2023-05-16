import { useQuery } from 'react-query'
import sendRequest from './sendRequest'
import { getQuery } from '../helpers'

const BASE_PATH = '/api/v1/project-station'

const FETCHBORDERINFO = 'project-border.info'

export const fetchBorderInfo = (data) =>
    sendRequest(`${BASE_PATH}${getQuery(data)}`, {
        method: 'GET',
    })

export const useQueryBorderInfo = (props) =>
    useQuery([FETCHBORDERINFO, props.item_id, props.project_id], () => fetchBorderInfo(props), {
        initialData: [],
        enabled: !!props.project_id,
        meta: {
            ...props,
        },
    })
