import ReactPaginate from 'react-paginate'

const Pagination = ({ data: { totalPages = 0, pageNumber = 1 }, onPageChange = () => {} }) => {
    if (!totalPages || totalPages === 1) {
        return null
    }

    return (
        <div className='d-flex justify-content-end mt-3'>
            <ReactPaginate
                forcePage={pageNumber}
                pageCount={totalPages}
                pageRangeDisplayed={4}
                marginPagesDisplayed={1}
                onPageChange={(data) => onPageChange(data.selected)}
                containerClassName='pagination'
                activeClassName='active'
                pageLinkClassName='page-link'
                breakLinkClassName='page-link'
                nextLinkClassName='page-link'
                previousLinkClassName='page-link'
                pageClassName='page-item'
                breakClassName='page-item'
                nextClassName='page-item'
                previousClassName='page-item'
                previousLabel={<>&laquo;</>}
                nextLabel={<>&raquo;</>}
            />
        </div>
    )
}

export default Pagination
