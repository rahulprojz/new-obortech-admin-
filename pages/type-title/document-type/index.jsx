import { useMemo } from 'react'
import string from '../../../utils/LanguageTranslation'
import Button from '../../../components/common/form-elements/button/Button'
import Loader from '../../../components/common/Loader'
import { LOADER_TYPES } from '../../../shared/constants'
import NoDataView from '../../../components/common/NoDataView'

const DocumentTypeTab = ({ loadingMode, documentTypes: { list }, onSubmitBtnClick, onSetEditMode, onSetDeleteMode }) => {
    const isLoading = useMemo(() => {
        return !!loadingMode[LOADER_TYPES.DOCUMENT_TYPES]
    }, [loadingMode])

    return (
        <div className='tab-pane fade show active mt-3 w-100' id='documentType' role='tabpanel' aria-labelledby='document-type-listing'>
            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                <h4 className='text-dark'>{string.documentType.documentTypeListing}</h4>
                <Button className='btn btn-primary large-btn' onClick={() => onSubmitBtnClick('documentTypeAdd')}>
                    {string.userTypeTitle.submitUserTypeBtn}
                </Button>
            </div>
            <div className='project-table-listing table-responsive mt-2 w-100'>
                <table className='table'>
                    <thead className='thead-dark'>
                        <tr>
                            <th scope='col'>#</th>
                            <th scope='col'>{string.documentType.type}</th>
                            <th className='text-center' scope='col'>
                                {string.actions}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((docType, i) => {
                            return (
                                <tr key={docType.i}>
                                    <td>{i + 1}</td>
                                    <td>{docType.type}</td>
                                    <td>
                                        <i role='button' tabIndex={0} aria-hidden='true' className='fa fa-pencil-alt' onClick={() => onSetEditMode('documentType', i, docType)} />
                                        <i role='button' tabIndex={0} aria-hidden='true' className='fa fa-trash' onClick={() => onSetDeleteMode('deleteDocumentType', i, docType)} />
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

export default DocumentTypeTab
