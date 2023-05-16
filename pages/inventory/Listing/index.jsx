import React, { useEffect, useState } from 'react'
import { uniqBy } from 'lodash'

import Listing from './Listing'

import { otherLanguage } from '../../../utils/selectedLanguage'
import { fetchAssets } from '../../../lib/api/inventory-assets'
import { INITIAL_PAGINATION_STATE } from '../../../shared/constants'
import { getPaginationState } from '../../../utils/InfinitePagination'
import NoDataView from '../../../components/common/NoDataView'
import string from '../../../utils/LanguageTranslation'

let timeout
const ListingPage = () => {
    const [eventAssets, setEventAssets] = useState(INITIAL_PAGINATION_STATE)
    const [filterObj, setFilterObj] = useState({ start: '', end: '', name: '', category: '', supplier: '', receiver: '', mode: string.inventory.supplier })
    const [isLoadingMode, SetIsLoadingMode] = useState(false)
    const [options, setOptions] = useState([])

    const changeFilter = (filterValue) => {
        setFilterObj({ ...filterObj, ...filterValue })
    }

    const prepareDropdown = async () => {
        const response = await fetchAssets({ isInventory: true })
        const assetListData = {
            allByAssets: [{ label: string.inventory.allAssets, value: '', name: '' }],
            allByCategory: [{ label: string.inventory.showAllCategory, value: '' }],
            allSuppliers: [{ label: string.inventory.allSuppliers, value: '' }],
            allReceivers: [{ label: string.inventory.allReceivers, value: '' }],
            allFilterOption: [
                { label: string.inventory.supplier, value: string.inventory.supplier },
                { label: string.inventory.receiver, value: string.inventory.receiver },
            ],
        }
        if (response.length > 0) {
            response.map((item) => {
                assetListData.allByAssets.push({ label: otherLanguage ? item.local_name : item.name, name: item.name, value: item.asset_code })
                assetListData.allByCategory.push({ label: otherLanguage ? item.assets_category.local_name : item.assets_category.name, value: item.assets_category.id })
                if (item.supplier.length > 0) {
                    item.supplier.map((supplier) => {
                        if (!assetListData.allSuppliers.some((i) => i.value == supplier.supplier_org?.id)) {
                            assetListData.allSuppliers.push({ label: supplier.supplier_org?.name, value: supplier.supplier_org?.id })
                        }
                    })
                }
                if (item.receiver.length > 0) {
                    item.receiver.map((receiver) => {
                        if (!assetListData.allReceivers.some((i) => i.value == receiver.receiver_org?.id)) {
                            assetListData.allReceivers.push({ label: receiver.receiver_org?.name, value: receiver.receiver_org?.id })
                        }
                    })
                }
            })
        }
        assetListData.allByAssets = uniqBy(assetListData.allByAssets, 'value')
        assetListData.allByCategory = uniqBy(assetListData.allByCategory, 'value')
        assetListData.allSuppliers = uniqBy(assetListData.allSuppliers, 'value')
        assetListData.allReceivers = uniqBy(assetListData.allReceivers, 'value')

        setOptions(assetListData)
    }

    const calculateTransferAssetQuantity = (assetData) => {
        const quantityObj = { supplierAssetQuantity: 0, receiverAssetQuantity: 0 }
        let quantity = 0
        const quantityCalculation = (assetArr, quantityField) => {
            assetArr.map((supplierData) => {
                if (supplierData.action == 'transfer') {
                    quantityObj[quantityField] += supplierData.quantity
                }
            })
        }

        if (filterObj.mode == 'Supplier') {
            quantityCalculation(assetData?.supplier, 'supplierAssetQuantity')
            quantity = quantityObj.supplierAssetQuantity
        }
        if (filterObj.mode == 'Receiver') {
            quantityCalculation(assetData?.receiver, 'receiverAssetQuantity')
            quantity = quantityObj.receiverAssetQuantity
        }

        return quantity
    }

    const getEventAssetsList = async (params) => {
        SetIsLoadingMode(true)
        const paramsObj = params?.page ? params : { page: 0 }
        const query = { ...paramsObj, ...eventAssets }
        const response = await fetchAssets({ ...{ offset: params ? eventAssets.list.length : 0, limit: 20, isInventory: true }, ...filterObj })
        query.response = response
        const data = getPaginationState(query)
        const assetEventArr = []
        data.list.length > 0 &&
            data.list.map((item) => {
                assetEventArr.push({
                    ...item,
                    name: otherLanguage ? item.local_name || item.name : item.name,
                    available_quantity: item.assets_quantity?.available_quantity,
                    created_quantity: item.assets_quantity?.created_quantity,
                    transferred_quantity: calculateTransferAssetQuantity(item),
                    removed_quantity: item.assets_quantity?.removed_quantity,
                    color: filterObj.mode == 'Supplier' ? 'green' : 'red',
                })
            })
        setEventAssets({ ...eventAssets, list: assetEventArr, totalCount: response.count })
        SetIsLoadingMode(false)
    }

    const handleScroll = (e) => {
        if (e.target.scrollHeight - e.target.scrollTop === e.target.clientHeight) {
            if (timeout) clearTimeout(timeout)
            const { list, totalCount, pageNumber } = eventAssets
            if (list.length < totalCount) {
                timeout = setTimeout(() => {
                    const params = { page: pageNumber + 1 }
                    getEventAssetsList(params)
                }, 300)
            }
        }
    }

    const filterTable = () => {
        return (
            <tbody>
                {eventAssets.list.map((data, i) => (
                    <tr key={i}>
                        <td style={{ textAlign: 'left' }}>
                            <b style={{ color: 'black' }}>{data?.name}</b>
                            <br />
                            {data.asset_code}
                        </td>
                        <td style={{ color: '#858796' }}>{data?.measurement}</td>
                        <td style={{ color: 'black' }}>{data?.available_quantity ? parseInt(data?.available_quantity).toLocaleString() : ''}</td>
                        <td style={{ color: '#ebb868' }}>{data?.created_quantity ? `+${parseInt(data?.created_quantity).toLocaleString()}` : ''}</td>
                        <td style={{ color: 'red' }}>{data?.removed_quantity ? `-${parseInt(data?.removed_quantity).toLocaleString()}` : ''}</td>
                        <td style={{ color: data?.color }}>{data?.transferred_quantity ? `${data?.color == 'green' ? '+' : '-'}${parseInt(data?.transferred_quantity).toLocaleString()}` : ''}</td>
                    </tr>
                ))}
                <NoDataView list={eventAssets.list} isLoading={isLoadingMode} colSpan={6} />
            </tbody>
        )
    }

    useEffect(() => {
        getEventAssetsList()
    }, [filterObj])

    useEffect(() => {
        prepareDropdown()
    }, [])

    return (
        <>
            <Listing
                paginationProps={{
                    isPaginationRequired: true,
                    handleScroll,
                    isLoaderRequired: isLoadingMode,
                }}
                tableProps={{
                    getTableBody: filterTable,
                }}
                changeFilter={changeFilter}
                options={options}
            />
        </>
    )
}

export default ListingPage
