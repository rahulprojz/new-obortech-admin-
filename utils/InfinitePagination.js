const { PAGE_SIZE } = process.env

export const getPaginationQuery = ({ page, isFetchAll = false, list, pageNumber }) => {
    const pageNo = page > -1 ? page : pageNumber
    let pageSize = PAGE_SIZE
    let offset = pageNo * pageSize
    if (window && window.innerHeight > 1000) {
        pageSize = parseInt(pageSize) + (window.innerHeight > 2500 ? 80 : 30)
        offset = pageNo * pageSize
        if (list.length) {
            offset = list.length
        }
    }

    const pagination = {
        limit: isFetchAll ? list.length : pageSize,
        offset: isFetchAll ? 0 : offset,
    }
    return pagination
}
export const getPaginationState = ({ page, isFetchAll = false, list, response, pageNumber }) => {
    const pageNo = page > -1 ? page : pageNumber
    return {
        list: [...(pageNo === 0 || isFetchAll ? [] : list), ...(response.rows || [])],
        pageNumber: isFetchAll ? pageNumber : pageNo,
        totalCount: response.count,
    }
}
