import React, { useReducer, useState, useEffect, useCallback } from 'react'
import { Popover } from 'reactstrap'
import { uniqBy } from 'lodash'

import { INITIAL_PAGINATION_STATE, INVENTORY_PAGE_TAB } from '../../../shared/constants'
import Listing from './Listing'
import Modals from '../modals'
import NoDataView from '../../../components/common/NoDataView'

import { getPaginationQuery, getPaginationState } from '../../../utils/InfinitePagination'
import DeleteModal from '../../../components/common/DeleteModal'
import { otherLanguage } from '../../../utils/selectedLanguage'
import string from '../../../utils/LanguageTranslation'
import { SelectDropdown } from '../../../components/inventory-manager'
import { SELECTED_TAB_DETAILS } from '../../../components/inventory-manager/utils'
import { fetchCategory, deleteCategory } from '../../../lib/api/assets-categories'
import { fetchAssets, removeAssets } from '../../../lib/api/inventory-assets'

let timeout
const ListingPage = (props) => {
    const { selectedTab, updateUnSeenCount } = props
    const [subInfoHover, setSubInfoHover] = useState('')
    const [assetOption, setAssetOption] = useState([])
    const [state, setState] = useReducer((prevState, newState) => ({ ...prevState, ...newState }), {
        selectedTabDetails: SELECTED_TAB_DETAILS[selectedTab],
        isLoadingMode: false,
        assets: {
            list: [],
        },
        category: { list: [] },
        MY_ASSETS_CLASSES: INITIAL_PAGINATION_STATE,
        CATEGORIES: INITIAL_PAGINATION_STATE,
        UNCATEGORIZED_ASSET_CLASSES: INITIAL_PAGINATION_STATE,
        isOpen: false,
        deleteOpen: false,
        deleteID: '',
        deleteLoading: false,
        loadingMode: false,
        mode: 'create',
    })
    const [filterObj, setFilterObj] = useState({ name: '', code: '', category: '', supplier: '', receiver: '' })

    const initialApi = (params) => {
        setState({ isLoadingMode: true })
        selectedTab == INVENTORY_PAGE_TAB.CATEGORIES && getCategoryData(params?.page ? params : { page: 0 })
        selectedTab == INVENTORY_PAGE_TAB.MY_ASSETS_CLASSES && getAssetsCategorized(params?.page ? params : { page: 0 })
        selectedTab == INVENTORY_PAGE_TAB.UNCATEGORIZED_ASSET_CLASSES && getAssetsUncategorized(params?.page ? params : { page: 0 })
    }

    const prepareDropdown = async () => {
        let payload = {}
        if(selectedTab == INVENTORY_PAGE_TAB.MY_ASSETS_CLASSES){
            payload = {categorized: 1}
        } else if(selectedTab == INVENTORY_PAGE_TAB.UNCATEGORIZED_ASSET_CLASSES){
            payload = {categorized: false}
        }
        const response = await fetchAssets(payload)
        setAssetOption(response)
    }

    const getCurrentList = () => {
        const assetListData = {
            allByCode: [{ label: string.inventory.showAllCode, value: '' }],
            allByName: [{ label: string.inventory.showAllName, value: '' }],
            allByCategory: [{ label: string.inventory.showAllCategory, value: '' }],
            allSuppliers: [{ label: string.inventory.showAllSuppliers, value: '' }],
            allReceivers: [{ label: string.inventory.showAllReceivers, value: '' }],
        }
        if (selectedTab != 'CATEGORIES') {
            assetOption.map((item) => {
                assetListData.allByCode.push({ label: item.asset_code, value: item.id })
                assetListData.allByName.push({ label: item.name, value: item.id })
                selectedTab == 'MY_ASSETS_CLASSES' && assetListData.allByCategory.push({ label: item.assets_category.name, value: item.assets_category.id })
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
        assetListData.allByCode = uniqBy(assetListData.allByCode, 'value')
        assetListData.allByName = uniqBy(assetListData.allByName, 'value')
        assetListData.allByCategory = uniqBy(assetListData.allByCategory, 'value')
        assetListData.allSuppliers = uniqBy(assetListData.allSuppliers, 'value')
        assetListData.allReceivers = uniqBy(assetListData.allReceivers, 'value')

        return assetListData
    }

    const getAssetsCategorized = async (params = {}) => {
        const query = { ...params, ...state.MY_ASSETS_CLASSES }
        const response = await fetchAssets({ ...getPaginationQuery(query), categorized: 1, ...filterObj })
        query.response = response
        const data = getPaginationState(query)
        setState({ MY_ASSETS_CLASSES: data, isLoadingMode: false })
        updateUnSeenCount(response.unSeenCount)
    }

    const getAssetsUncategorized = async (params = {}) => {
        const query = { ...params, ...state.UNCATEGORIZED_ASSET_CLASSES }
        const response = await fetchAssets({ ...getPaginationQuery(query), categorized: 0, ...filterObj })
        query.response = response
        const data = getPaginationState(query)
        setState({ UNCATEGORIZED_ASSET_CLASSES: data, isLoadingMode: false })
        updateUnSeenCount(0)
    }

    const getCategoryData = async (params = {}) => {
        const query = { ...params, ...state.CATEGORIES }
        const response = await fetchCategory(getPaginationQuery(query))
        query.response = response
        const data = getPaginationState(query)
        setState({ CATEGORIES: data, isLoadingMode: false })
        updateUnSeenCount(response.unSeenCount)
    }

    const paginationLoading = () => {
        setState({ isLoadingMode: true })
    }

    const toggle = () => {
        setState({ isOpen: !state.isOpen })
    }

    const addMode = () => {
        setState({ mode: 'create', editIndex: null })
        toggle()
    }
    const editMode = (i) => {
        setState({ mode: 'edit', editIndex: i })
        toggle()
    }

    const deleteToggle = () => {
        setState({ deleteOpen: !state.deleteOpen })
    }

    const deleteMode = async () => {
        if (state.deleteID) {
            setState({ deleteLoading: true })
            selectedTab == INVENTORY_PAGE_TAB.CATEGORIES ? await deleteCategory(state.deleteID) : await removeAssets(state.deleteID)
            initialApi()
            setState({ deleteLoading: false, deleteOpen: false, deleteID: '' })
        }
    }

    const handleScroll = useCallback(() => {
        if (window.innerHeight + Math.ceil(document.documentElement.scrollTop) >= document.documentElement.offsetHeight - 100) {
            if (timeout) clearTimeout(timeout)
            const { list, totalCount, pageNumber } = state[selectedTab]
            if (list.length < totalCount) {
                setState({ isLoadingMode: true })
                timeout = setTimeout(() => {
                    const params = { page: pageNumber + 1 }
                    initialApi(params)
                }, 300)
            }
        }
    }, [state[selectedTab]])

    const getTableBody = (type, isCategorized = true) => {
        return (
            <tbody>
                {state[selectedTab].list.map((data, i) => {
                    return (
                        <tr key={data?.id}>
                            <td>{i + 1}</td>
                            <td className='project-name-blk'>
                                <div style={{ width: 'auto', cursor: 'pointer' }} id={`asset-tooltip-${i}`} className='text-left' onMouseEnter={() => setSubInfoHover(`asset-tooltip-${i}`)} onMouseLeave={() => setSubInfoHover('')}>
                                    {otherLanguage ? data.local_name : data.name}
                                </div>
                                {data?.subinfo && (
                                    <Popover hideArrow placement='bottom-start' isOpen={subInfoHover == `asset-tooltip-${i}`} target={`asset-tooltip-${i}`}>
                                        <div style={{ padding: '15px', paddingRight: '40px', color: 'grey', fontSize: '16px' }}>{data?.subinfo} </div>
                                    </Popover>
                                )}
                            </td>
                            {type != 'category' && (
                                <>
                                    <td style={{ textAlign: 'left' }}>{data.asset_code}</td>
                                    <td style={{ textAlign: 'left' }}>{data.assets_category?.name}</td>
                                    <td style={{ textAlign: 'left', paddingLeft: '100px' }}>
                                        <SelectDropdown
                                            key={data?.id}
                                            className='mr-0'
                                            isSearchable={false}
                                            availables={
                                                data.supplier.length > 0
                                                    ? uniqBy(
                                                          data.supplier.map((item) => ({ label: item.supplier_org.name, value: item.supplier_org.id })),
                                                          'value',
                                                      )
                                                    : []
                                            }
                                        />
                                    </td>

                                    {isCategorized && (
                                        <td style={{ textAlign: 'left' }}>
                                            <SelectDropdown
                                                key={data?.id}
                                                className='mr-0'
                                                isSearchable={false}
                                                availables={
                                                    data.receiver.length > 0
                                                        ? uniqBy(
                                                              data.receiver.map((item) => ({ label: item.receiver_org?.name, value: item.receiver_org?.id })),
                                                              'value',
                                                          )
                                                        : []
                                                }
                                            />
                                        </td>
                                    )}
                                </>
                            )}
                            {
                                <td className='custom-width'>
                                    <i title={string.editTemplateTitle} className={`fa fa-pencil-alt${type == 'category' && data?.id == 1 ? ' disable-btn' : ''}`} onClick={() => editMode(i)} />
                                    <i title={string.deleteTemplateTitle} className={`fa fa-trash${type == 'category' && data?.id == 1 ? ' disable-btn' : ''}`} onClick={() => setState({ deleteID: data.id, deleteOpen: true })}></i>
                                </td>
                            }
                        </tr>
                    )
                })}
                <NoDataView list={state[selectedTab].list} isLoading={state.isLoadingMode} colSpan={type == 'category' ? 3 : isCategorized ? 7 : 6} />
            </tbody>
        )
    }

    useEffect(() => {
        initialApi()
    }, [state.selectedTabDetails, JSON.stringify(filterObj)])

    useEffect(() => {
        prepareDropdown()
    }, [])

    return (
        <>
            <Listing
                initialApi={initialApi}
                state={state}
                paginationProps={{
                    isPaginationRequired: state.selectedTabDetails.isPaginationRequired,
                    isLoaderRequired: state.isLoadingMode,
                    paginationLoading,
                    handleScroll,
                }}
                listTitle={state.selectedTabDetails.title || ''}
                filterObj={filterObj}
                setFilterObj={setFilterObj}
                addSubmitBtnProps={{
                    isVisible: state.selectedTabDetails.isSubmitBtnAllowed(state.user),
                    addMode,
                    btnTxt: state.selectedTabDetails.btnTxt,
                    isFilterRequired: state.selectedTabDetails.isInventoryFilterRequired,
                }}
                tableProps={{
                    tableHeaders: state.selectedTabDetails.tableHeaders(getCurrentList()),
                    selectedOption: state.selectedOption,
                    setState,
                    isColGroupRequired: state.selectedTabDetails.isColGroupRequired,
                    getTableBody,
                    isCategory: state.selectedTabDetails.isCategory,
                    isCategorized: state.selectedTabDetails.title == string.inventory.myAssetsClasses,
                }}
            />
            {state.isOpen && <Modals key='category-modal' {...state} selectedTab={selectedTab} toggle={toggle} setState={setState} initialApi={initialApi} />}
            <DeleteModal isOpen={state.deleteOpen} toggle={deleteToggle} onDeleteEntry={deleteMode} isLoading={state.deleteLoading} />
        </>
    )
}

export default ListingPage
