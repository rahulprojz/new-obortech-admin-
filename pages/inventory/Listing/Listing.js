import React, { useEffect } from 'react'
import Loader from '../../../components/common/Loader'

import TableHeader from '../../../components/inventory/TableHeader'
import TopFilters from '../../../components/inventory/TopFilters'

const Listing = (props) => {
    const { paginationProps = { isPaginationRequired: false, handleScroll: () => {}, isLoaderRequired: false }, tableProps = { tableHeaders: [], isColGroupRequired: false, getTableBody: () => {} }, changeFilter, options } = props

    useEffect(() => {
        const { isPaginationRequired, handleScroll } = paginationProps
        if (isPaginationRequired) {
            window.addEventListener('scroll', handleScroll)
            return () => {
                window.removeEventListener('scroll', handleScroll)
            }
        }
    }, [paginationProps.handleScroll])

    return (
        <>
            <div className='tab-pane fade show active col-md-12'>
                <TopFilters changeFilter={changeFilter} options={options} />
                <div className='inventory-table-container' onScroll={paginationProps.handleScroll}>
                    <table className='table inventory-table text-center mb-0'>
                        <TableHeader options={options} changeFilter={changeFilter} />
                        {tableProps.getTableBody()}
                    </table>
                    {Boolean(paginationProps.isLoaderRequired) && <Loader className='pagination-loader' style={{ height: '50px' }} />}
                </div>
            </div>
        </>
    )
}

export default Listing
