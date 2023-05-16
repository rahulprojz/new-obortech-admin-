import string from '../../utils/LanguageTranslation'
import AddUserTypeModal from './organization-type/AddModal'
import AddUserTitleModal from './user-title/AddModal'
import AddDocumentTypeModal from './document-type/AddModal'
import DeleteModal from '../../components/common/DeleteModal'
import DocumentTypeTab from './document-type'
import OrganizationTypeTab from './organization-type'
import UserTitleTab from './user-title'
import { LOADER_TYPES, TYPE_TITLE_PAGE_TAB } from '../../shared/constants'

const UserTypeAndTitlePageComponent = ({
    userTypes,
    userTitles,
    values,
    loadingMode,
    editMode,
    deleteModal,
    documentTypes,
    userTypeModal,
    selectedTypes,
    documentTypeModal,
    typeAlreadyExists,
    titleAlreadyExists,
    docTypeAlreadyExists,
    userTitleModal,
    onSubmitBtnClick,
    onSetEditMode,
    onSetDeleteMode,
    onToggleUserType,
    onUserTypeSubmit,
    onToggleUserTitle,
    onUserTitleSubmit,
    onToggleDeleteModal,
    onDeleteEntry,
    onToggleDocumentType,
    onDocumentTypeSubmit,
    onFetchDocumenTypeList,
    onFetchUserTypeList,
    onFetchTitleList,
    onSelectedTab,
}) => {
    const TabList = [
        { key: 'documentType', title: string.documentType.documentTypes, name: TYPE_TITLE_PAGE_TAB.DOCUMENT_TYPES },
        { key: 'userType', title: string.userTypeTitle.userTypes, name: TYPE_TITLE_PAGE_TAB.USER_TYPES },
        { key: 'userTitle', title: string.userTypeTitle.userTitles, name: TYPE_TITLE_PAGE_TAB.USER_TITLES },
    ]

    return (
        <div>
            <div className='container-fluid'>
                <div className='row d-flex project-listing'>
                    <ul className='nav nav-tabs w-100' id='myTab' role='tablist'>
                        {TabList.map((tab, i) => {
                            const { key, title, name } = tab
                            const id = `${key}s`
                            return (
                                <li key={tab.i} className='nav-item'>
                                    <a className={`nav-link ${i === 0 ? 'active' : ''}`} id={id} name={name} data-toggle='tab' href={`#${key}`} role='tab' aria-controls={id} aria-selected={i === 0 ? 'true' : ''} onClick={onSelectedTab}>
                                        {title}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                    <div className='tab-content w-100' id='myTabContent'>
                        <DocumentTypeTab documentTypes={documentTypes} loadingMode={loadingMode} onSubmitBtnClick={onSubmitBtnClick} onSetEditMode={onSetEditMode} onSetDeleteMode={onSetDeleteMode} onFetchDocumenTypeList={onFetchDocumenTypeList} />
                        <OrganizationTypeTab userTypes={userTypes} loadingMode={loadingMode} onSetEditMode={onSetEditMode} onSetDeleteMode={onSetDeleteMode} onSubmitBtnClick={onSubmitBtnClick} onFetchUserTypeList={onFetchUserTypeList} />
                        <UserTitleTab userTitles={userTitles} loadingMode={loadingMode} onSetEditMode={onSetEditMode} onSetDeleteMode={onSetDeleteMode} onSubmitBtnClick={onSubmitBtnClick} onFetchTitleList={onFetchTitleList} />
                    </div>
                </div>
            </div>

            <AddUserTypeModal
                isLoading={!!loadingMode[LOADER_TYPES.UPSERT]}
                toggle={onToggleUserType}
                isOpen={userTypeModal}
                string={string}
                values={values}
                onUserTypeSubmit={onUserTypeSubmit}
                editMode={editMode}
                typeAlreadyExists={typeAlreadyExists}
                types={documentTypes.list}
                selectedTypes={selectedTypes || []}
            />
            <AddUserTitleModal isLoading={!!loadingMode[LOADER_TYPES.UPSERT]} toggle={onToggleUserTitle} isOpen={userTitleModal} string={string} values={values} onUserTitleSubmit={onUserTitleSubmit} editMode={editMode} titleAlreadyExists={titleAlreadyExists} />
            <DeleteModal isLoading={!!loadingMode[LOADER_TYPES.DELETE]} toggle={onToggleDeleteModal} isOpen={deleteModal} onDeleteEntry={onDeleteEntry} />
            <AddDocumentTypeModal isLoading={!!loadingMode[LOADER_TYPES.UPSERT]} isOpen={documentTypeModal} values={values} docTypeAlreadyExists={docTypeAlreadyExists} editMode={editMode} toggle={onToggleDocumentType} onDocumentTypeSubmit={onDocumentTypeSubmit} />
        </div>
    )
}

export default UserTypeAndTitlePageComponent
