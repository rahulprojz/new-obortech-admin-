import { useState, useEffect } from 'react'
import NftCard from './nft-card.jsx'
import string from '../../utils/LanguageTranslation'
import { getAllNfts } from '../../lib/api/nft'
import notify from '../../lib/notifier.js'
import { useCookies } from 'react-cookie'
import NProgress from 'nprogress'
import Loader from '../../components/common/Loader'
import { getPaginationQuery, getPaginationState } from '../../utils/InfinitePagination'
import { INITIAL_PAGINATION_STATE } from '../../shared/constants'

let timeout

const NftComponent = ({ props }) => {
    NProgress.start()
    const [paginationData,setPaginationData] = useState(INITIAL_PAGINATION_STATE)

    useEffect(() => {
        fetchNftData()
    }, [])

    const fetchNftData = async (params = {}) => {
        const query = { ...params, ...paginationData }
        const response = await getAllNfts(getPaginationQuery(query))
        query.response = response
        setPaginationData( getPaginationState(query))
        NProgress.done()
    }

    window.onscroll = function () {
        // End of the document reached?
        if (window.innerHeight + Math.ceil(document.documentElement.scrollTop) >= document.documentElement.offsetHeight - 100) {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
                const { list, totalCount, pageNumber } = paginationData
                if (list.length < totalCount) {
                    fetchNftData({page: pageNumber + 1}) 
                }
            }, 300)
        }
    }

    return (
        <>
            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                <h4 className='text-dark'>{string.nft.nftManagementHeading}</h4>
            </div>
            <div className='project-table-listing mt-2 w-100 row'>
                {paginationData.list &&
                    paginationData.list.map((data, i) => {
                        if (data) {
                            const nftTitle = data.name
                            const nftImage = data.image

                            // We can remove this condition after demo
                            if (nftImage !== 'https://ipfs.io/ipfs/QmcyaRpbZoqPeMnBJdwedtCMBzmDdZfqfcHFo7mqQk5WuQ' && nftImage !== 'https://ipfs.io/ipfs/Qmf5LxNv2FCGTkgCX2moJbQNPCGN6P96vSf31GdZTixbp1') {
                                const tokenId = data.token_id
                                const polygonUrl = data.polygon_url
                                return (
                                    <div key={i} className='col-md-4 col-lg-3 col-sm-9'>
                                        <NftCard nftTitle={nftTitle} nftImage={nftImage} tokenId={tokenId} polygonUrl={polygonUrl} />
                                    </div>
                                )
                            }
                        }
                    })}
            </div>
            {/* {isFetchingList && <Loader className='pagination-loader' />} */}
        </>
    )
}

export default NftComponent
