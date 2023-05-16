import React, { useEffect, useState } from 'react'
import { uniqBy } from 'lodash'
import 'bootstrap-daterangepicker/daterangepicker.css'

import AdvanceSelect from '../common/form-elements/select/AdvanceSelect'
import { fetchAssets } from '../../lib/api/inventory-assets'
import { otherLanguage } from '../../utils/selectedLanguage'
import string from '../../utils/LanguageTranslation'

const TableHeader = ({ changeFilter, options }) => {
    const [assetsOption, setAssetsOption] = useState({ value: '', label: string.inventory.allAssets })
    const [filterOption, setFilterOption] = useState({ label: string.inventory.supplier, value: string.inventory.supplier })
    const [suppliersOption, setSuppliersOption] = useState({ value: '', label: string.inventory.allSuppliers })
    const [receiversOption, setReceiversOption] = useState({ value: '', label: string.inventory.allReceivers })
    const [assetNameList, setAssetNameList] = useState([])

    const getAssetNameList = async () => {
        const getAssetArr = await fetchAssets()
        const assetArr = []
        getAssetArr.map((item) => {
            assetArr.push({ value: item?.name, label: otherLanguage ? item?.local_name : item?.name, assetCode: item.asset_code })
        })
        setAssetNameList(uniqBy([{ value: '', label: string.inventory.showAllCategories }, ...assetArr], 'value'))
    }

    const customStyles = {
        control: (provided) => ({
            ...provided,
            minHeight: 35,
            height: 35,
            fontSize: 14,
            color: '#6e707e',
            borderRadius: 3,
        }),
        valueContainer: (provided) => ({ ...provided, maxWidth: '233px' }),
        menuList: (provided) => ({ ...provided, textAlign: 'left' }),
        option: (provided) => ({ ...provided, color: '#222222' }),
    }

    return (
        <>
            <thead>
                <tr style={{ borderBottom: 'solid', borderColor: '#a39b9b' }}>
                    <th scope='col'>
                        <div>
                            <AdvanceSelect
                                options={options.allByAssets}
                                styles={customStyles}
                                value={assetsOption}
                                onChange={(selectedOption) => {
                                    setAssetsOption(selectedOption)
                                    changeFilter({ name: selectedOption.name })
                                }}
                            />
                        </div>
                    </th>
                    <th scope='col'>{string.inventory.unit}</th>
                    <th scope='col'>{string.available}</th>
                    <th scope='col'>{string.statusResponses.created}</th>
                    <th scope='col'>{string.inventory.removed}</th>
                    <th scope='col'>
                        <div className='mb-3'>
                            <AdvanceSelect
                                options={options.allFilterOption}
                                styles={customStyles}
                                value={filterOption}
                                onChange={(selectedOption) => {
                                    setFilterOption(selectedOption)
                                    changeFilter({ mode: selectedOption.value, supplier: '', receiver: '' })
                                    setSuppliersOption({ value: '', label: string.inventory.allSuppliers })
                                    setReceiversOption({ value: '', label: string.inventory.allReceivers })
                                }}
                            />
                        </div>
                        {filterOption.value == 'Supplier' && (
                            <div>
                                <AdvanceSelect
                                    options={options.allSuppliers}
                                    styles={customStyles}
                                    value={suppliersOption}
                                    onChange={(selectedOption) => {
                                        setSuppliersOption(selectedOption)
                                        changeFilter({ supplier: selectedOption.value })
                                    }}
                                />
                            </div>
                        )}
                        {filterOption.value == 'Receiver' && (
                            <div>
                                <AdvanceSelect
                                    options={options.allReceivers}
                                    styles={customStyles}
                                    value={receiversOption}
                                    onChange={(selectedOption) => {
                                        setReceiversOption(selectedOption)
                                        changeFilter({ receiver: selectedOption.value })
                                    }}
                                />
                            </div>
                        )}
                    </th>
                </tr>
            </thead>
            <colgroup>
                <col style={{ width: '21%' }} className='pl-0' />
                <col style={{ width: '13%' }} className='text-capitalize' />
                <col style={{ width: '13%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '20%' }} />
            </colgroup>
        </>
    )
}

export default TableHeader
