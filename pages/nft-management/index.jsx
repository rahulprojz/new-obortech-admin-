import NftComponent from '../../components/nft-managment'
import React from 'react'
import withAuth from '../../lib/withAuth'

const Nft = (props) => {
    return (
        <div>
            <div className='container-fluid'>
                <div className='row d-flex project-listing'>
                    <div className='tab-pane fade show active mt-3 w-100' id='road' role='tabpanel' aria-labelledby='road-listing'>
                        <NftComponent props={props} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default withAuth(Nft, { loginRequired: true })
