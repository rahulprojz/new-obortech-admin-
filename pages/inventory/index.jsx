import React, { useEffect } from 'react'
import NProgress from 'nprogress'
import withAuth from '../../lib/withAuth'
import Listing from './Listing'

const Inventory = ({ user }) => {
    useEffect(() => {
        NProgress.done()
    }, [])

    return (
        <div className='container-fluid'>
            <div className='row d-flex'>
                <div className='w-100'>
                    <div className='inventory-table-content'>
                        <Listing />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default withAuth(Inventory, { loginRequired: true })
