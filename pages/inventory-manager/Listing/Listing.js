import React, { useEffect } from 'react'
import Button from '../../../components/common/form-elements/button/Button'
import Loader from '../../../components/common/Loader'
import { InventoryFilter } from '../../../components/inventory-manager'
import { otherLanguage } from '../../../utils/selectedLanguage'

const Listing = (props) => {
    const {
        filterObj,
        setFilterObj,
        paginationProps = { isPaginationRequired: false, handleScroll: () => {}, isLoaderRequired: false, paginationLoading: () => {} },
        addSubmitBtnProps = { isFilterRequired: false, isVisible: false, addMode: () => {}, btnTxt: '', filterOptions: [] },
        tableProps = { tableHeaders: [], isColGroupRequired: false, getTableBody: () => {} },
    } = props

    useEffect(() => {
        window.addEventListener('scroll', paginationProps.handleScroll)
        return () => {
            window.removeEventListener('scroll', paginationProps.handleScroll)
        }
    }, [paginationProps.handleScroll])

    return (
        <div className='tab-pane fade show active mt-3 col-md-12' id='all2' role='tabpanel' aria-labelledby='all-containers'>
            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter'>
                {addSubmitBtnProps.isFilterRequired ? <InventoryFilter isVisible={addSubmitBtnProps.isVisible} filterOptions={addSubmitBtnProps.filterOptions} tabOptions={tableProps} filterObj={filterObj} setFilterObj={setFilterObj} /> : <span />}
                {addSubmitBtnProps.isVisible && (
                    <div style={{ marginLeft: '20px' }}>
                        <Button className='btn btn-primary' onClick={() => addSubmitBtnProps.addMode()} style={otherLanguage ? {height: 'auto'} : {}}>
                            {addSubmitBtnProps.btnTxt.toUpperCase()}
                        </Button>
                    </div>
                )}
            </div>
            <div className='project-table-listing table-responsive mt-2'>
                <table className='table text-center'>
                    <thead className='thead-dark'>
                        <tr>
                            {tableProps.tableHeaders.map(
                                ({ props, text, isAvailable }, i) =>
                                    isAvailable && (
                                        <th key={i} {...props}>
                                            {text}
                                        </th>
                                    ),
                            )}
                        </tr>
                    </thead>
                    {tableProps.isColGroupRequired && <colgroup>{tableProps.tableHeaders.map(({ colGroupStyle, isAvailable }, i) => isAvailable && <col {...colGroupStyle} />)}</colgroup>}
                    {tableProps.getTableBody(tableProps.isCategory ? 'category' : 'assets', addSubmitBtnProps.isVisible)}
                </table>
            </div>
            {Boolean(paginationProps.isLoaderRequired) && <Loader className='pagination-loader' />}
        </div>
    )
}

export default Listing
