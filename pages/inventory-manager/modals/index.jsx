import React, { useEffect, useState } from 'react'

import AssetsModal from './AssetsModal'
import CategoryModal from './CategoryModal'
import UncategorizedAssetModal from './UncategorizedAssetModal'
import { INVENTORY_PAGE_TAB } from '../../../shared/constants.js'
import { fetchCategory } from '../../../lib/api/assets-categories'
import { otherLanguage } from '../../../utils/selectedLanguage'

const Modals = (props) => {
    const [categoryList, setCategoryList] = useState([])
    const { selectedTab, mode } = props
    const isEditMode = mode == 'edit'

    useEffect(() => {
        const catList = []
        getCategoryList().then((res) => {
            res.map((item) => {
                if (item.id != 1) {
                    catList.push({ label: otherLanguage ? item.local_name : item.name, value: item.id })
                }
            })
            setCategoryList([{label: "Asset class category", value: ''} , ...catList])
        })
    }, [isEditMode])

    const getCategoryList = async () => {
        const category = await fetchCategory()
        return category
    }

    return (
        <>
            {selectedTab == INVENTORY_PAGE_TAB?.MY_ASSETS_CLASSES && props.isOpen && <AssetsModal key='asset-modal' {...props} categoryList={categoryList} isEditMode={isEditMode} />}
            {selectedTab == INVENTORY_PAGE_TAB.CATEGORIES && props.isOpen && <CategoryModal key='category-modal' {...props} isEditMode={isEditMode} />}
            {selectedTab == INVENTORY_PAGE_TAB.UNCATEGORIZED_ASSET_CLASSES && props.isOpen && <UncategorizedAssetModal {...props} categoryList={categoryList} />}
        </>
    )
}

export default Modals
