import sendRequestWithFile from './sendRequestWithFile'
import sendRequest,{ sendNetworkRequestNFT, sendNetworkRequest } from './sendRequest'
const BASE_PATH = '/api/v1/nfts'
import { getQuery } from '../helpers'

export const addNftImage = (data) =>
    sendRequestWithFile(`${BASE_PATH}/create-nft-image`, {
        body: data,
    })

export const createNft = (data, authToken) => {
    return (
        sendNetworkRequestNFT(
            `${BASE_PATH}/create`,
            {
                body: data,
            },
            'IPFS',
            authToken,
            'POST',
        )
    )
}

export const getNftByOwners = (data, authToken) =>
    sendNetworkRequest(
        `${BASE_PATH}/get-nft-by-owner`,
        {
            body: JSON.stringify(data)
        },
        'IPFS',
        authToken,
        'POST',
    )

// export const getAllNfts = (data, authToken) =>
//     sendNetworkRequest(
//         `${BASE_PATH}/get-all-nfts`,
//         {
//             body: JSON.stringify(data),
//         },
//         'IPFS',
//         authToken,
//         'POST',
//     )

export const getAllNfts = (payload) =>
    sendRequest(`${BASE_PATH}${getQuery(payload)}`, {
        method: 'GET',
    })
