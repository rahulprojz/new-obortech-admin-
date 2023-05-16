import sendRequest from './sendRequest'

const BASE_PATH = '/api/v1/inventory_assets'

export const createInventoryAssets = (data) =>
    sendRequest(`${BASE_PATH}/create_inventoryassets`, {
        body: JSON.stringify(data),
    })
