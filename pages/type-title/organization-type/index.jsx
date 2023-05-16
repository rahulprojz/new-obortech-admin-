import { useMemo } from 'react'
import string from '../../../utils/LanguageTranslation'
import Button from '../../../components/common/form-elements/button/Button'
import Loader from '../../../components/common/Loader'
import { LOADER_TYPES } from '../../../shared/constants'
import NoDataView from '../../../components/common/NoDataView'

const OrganizationTypeTab = ({ loadingMode, userTypes: { list }, onSetEditMode, onSetDeleteMode, onSubmitBtnClick }) => {
    const isLoading = useMemo(() => {
        return !!loadingMode[LOADER_TYPES.USER_TYPES]
    }, [loadingMode])

    return (
        <div className='tab-pane fade mt-3 w-100' id='userType' role='tabpanel' aria-labelledby='user-type-listing'>
            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                <h4 className='text-dark'>{string.userTypeTitle.userTypeListing}</h4>
                <Button className='btn btn-primary large-btn' onClick={() => onSubmitBtnClick('userTypeAdd')}>
                    {string.userTypeTitle.submitUserTypeBtn}
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
                        {list.map((userType, i) => {
                            return (
                                <tr key={userType.i}>
                                    <td>{i + 1}</td>
                                    <td>{userType.name}</td>
                                    <td>
                                        <i role='button' tabIndex={0} aria-hidden='true' className='fa fa-pencil-alt' onClick={() => onSetEditMode('editType', i, userType)} />
                                        <i role='button' tabIndex={0} aria-hidden='true' className='fa fa-trash' onClick={() => onSetDeleteMode('deleteType', i, userType)} />
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

export default OrganizationTypeTab
