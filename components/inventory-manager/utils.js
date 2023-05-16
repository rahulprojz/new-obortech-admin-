import string from '../../utils/LanguageTranslation.js'
import { INVENTORY_PAGE_TAB } from '../../shared/constants.js'

export default function getTableHeaders(unAuthorized = false, tableData) {
    return [
        {
            text: '#',
            props: {
                scope: 'col',
            },
            colGroupStyle: {
                style: { width: '5%' },
            },
            isAvailable: true,
        },
        {
            text: string.inventory.assetName,
            props: {
                scope: 'col',
                className: 'text-left',
            },
            colGroupStyle: {
                style: { width: '20%' },
            },
            filterOptions: tableData.allByName,
            isAvailable: true,
        },
        {
            text: string.inventory.assetCode,
            props: {
                scope: 'col',
                style: { textAlign: 'left' },
            },
            colGroupStyle: {
                style: { width: '15%' },
            },
            filterOptions: tableData.allByCode,
            isAvailable: true,
        },
        {
            text: string.inventory.category,
            props: {
                scope: 'col',
                style: { textAlign: 'left' },
            },
            colGroupStyle: {
                style: { width: '15%' },
            },
            filterOptions: tableData.allByCategory,
            isAvailable: true,
        },
        {
            text: string.inventory.suppliers,
            props: {
                scope: 'col',
                width: '15%',
                className: 'text-center',
            },
            colGroupStyle: {
                style: { width: '15%' },
            },
            filterOptions: tableData.allSuppliers,
            isAvailable: true,
        },
        {
            text: string.inventory.receivers,
            props: {
                scope: 'col',
                width: '15%',
                className: 'text-center',
            },
            colGroupStyle: {
                style: { width: '15%' },
            },
            filterOptions: tableData.allReceivers,
            isAvailable: !unAuthorized,
        },
        {
            text: string.actions,
            props: {
                scope: 'col',
                width: '15%',
                className: 'text-center',
            },
            colGroupStyle: {
                style: { width: '15%' },
            },
            isAvailable: true,
        },
    ]
}

function getCategoryTableHeaders() {
    return [
        {
            text: '#',
            props: {
                scope: 'col',
            },
            colGroupStyle: {
                style: { width: '5%' },
            },
            isAvailable: true,
        },
        {
            text: string.inventory.categorysName,
            props: {
                scope: 'col',
                className: 'text-left',
            },
            colGroupStyle: {
                style: { width: '80%' },
            },
            isAvailable: true,
        },
        {
            text: string.actions,
            props: {
                scope: 'col',
                width: '15%',
                className: 'text-center',
            },
            colGroupStyle: {
                style: { width: '15%' },
            },
            isAvailable: true,
        },
    ]
}

// Only Admin and Manager user will be able to add and delete project
export const isEditDeleteBtnAllowed = () => {
    return true
    // return Boolean(user.role_id == process.env.ROLE_ADMIN || user.role_id == process.env.ROLE_MANAGER)
}

export const SELECTED_TAB_DETAILS = {
    [INVENTORY_PAGE_TAB.MY_ASSETS_CLASSES]: {
        title: string.inventory.myAssetsClasses,
        // getDataFn: fetchNonDraftProjects,
        tableHeaders: (tableData) => getTableHeaders(false, tableData),
        isColGroupRequired: true,
        isPaginationRequired: true,
        isSubmitBtnAllowed: (user) => isEditDeleteBtnAllowed(user),
        btnTxt: string.inventory.createAssetsClass,
        isInventoryFilterRequired: true,
    },
    [INVENTORY_PAGE_TAB.CATEGORIES]: {
        title: string.inventory.categories,
        // getDataFn: fetchNonDraftProjects,
        tableHeaders: (tableData) => getCategoryTableHeaders(false, tableData),
        isCategory: true,
        isColGroupRequired: true,
        isPaginationRequired: true,
        isInventoryFilterRequired: false,

        isSubmitBtnAllowed: (user) => isEditDeleteBtnAllowed(user),
        btnTxt: string.inventory.createCategories,
    },
    [INVENTORY_PAGE_TAB.UNCATEGORIZED_ASSET_CLASSES]: {
        title: string.inventory.uncategorizedAssetClasses,
        // getDataFn: fetchNonDraftProjects,
        tableHeaders: (tableData) => getTableHeaders(true, tableData),
        isColGroupRequired: true,
        isPaginationRequired: true,
        isSubmitBtnAllowed: () => false,
        isInventoryFilterRequired: true,
    },
}
