import { useMemo } from 'react'
import string from '../../../utils/LanguageTranslation'
import Button from '../../../components/common/form-elements/button/Button'
import Loader from '../../../components/common/Loader'
import { LOADER_TYPES } from '../../../shared/constants'
import NoDataView from '../../../components/common/NoDataView'

const UserTitleTab = ({ loadingMode, userTitles: { list }, onSetEditMode, onSetDeleteMode, onSubmitBtnClick }) => {
    const isLoading = useMemo(() => {
        return !!loadingMode[LOADER_TYPES.USER_TITLES]
    }, [loadingMode])

    return (
        <div className='tab-pane fade mt-3 w-100' id='userTitle' role='tabpanel' aria-labelledby='user-title-listing'>
            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                <h4 className='text-dark'>{string.userTypeTitle.userTitleListing}</h4>
                <Button className='btn btn-primary large-btn' onClick={() => onSubmitBtnClick('userTitleAdd')}>
                    {string.userTypeTitle.submitUserTitleBtn}
                </Button>
            </div>
            <div className='project-table-listing table-responsive mt-2 w-100'>
                <table className='table'>
                    <thead className='thead-dark'>
                        <tr>
                            <th scope='col'>#</th>
                            <th scope='col'>{string.station.name}</th>
                            <th className='text-center' scope='col'>
                                {string.actions}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((userTitle, i) => {
                            return (
                                <tr key={userTitle.i}>
                                    <td>{i + 1}</td>
                                    <td>{userTitle.name}</td>
                                    <td>
                                        <i role='button' tabIndex={0} aria-hidden='true' className='fa fa-pencil-alt' onClick={() => onSetEditMode('editTitle', i, userTitle)} />
                                        <i role='button' tabIndex={0} aria-hidden='true' className='fa fa-trash' onClick={() => onSetDeleteMode('deleteTitle', i, userTitle)} />
                                    </td>
                                </tr>
                            )
                        })}
                        <NoDataView list={list} isLoading={isLoading} />
                    </tbody>
                </table>
            </div>
            {isLoading && <Loader className='pagination-loader' />}
        </div>
    )
}

export default UserTitleTab
