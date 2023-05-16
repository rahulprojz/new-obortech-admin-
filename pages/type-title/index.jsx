/* eslint-disable no-underscore-dangle */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable indent */
import React from 'react'
import NProgress from 'nprogress'
import UserTypeAndTitlePageComponent from './component'
import * as documenTypeActions from '../../lib/api/document-type'
import * as userTitleActions from '../../lib/api/user_title'
import * as userTypeActions from '../../lib/api/user_type'
import notify from '../../lib/notifier'
import withAuth from '../../lib/withAuth'
import string from '../../utils/LanguageTranslation'
import { INITIAL_PAGINATION_STATE, LOADER_TYPES, TYPE_TITLE_PAGE_TAB } from '../../shared/constants'
import { getPaginationQuery, getPaginationState } from '../../utils/InfinitePagination'

let timeout
class UserTypeAndTitlePage extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            user: props.user || {},
            userTypes: INITIAL_PAGINATION_STATE,
            userTitles: INITIAL_PAGINATION_STATE,
            documentTypes: INITIAL_PAGINATION_STATE,
            userTypeModal: false,
            userTitleModal: false,
            documentTypeModal: false,
            deleteModal: false,
            values: {},
            editMode: '',
            deleteMode: '',
            typeAlreadyExists: false,
            titleAlreadyExists: false,
            docTypeAlreadyExists: false,
            loadingMode: {},
            selectedTab: TYPE_TITLE_PAGE_TAB.DOCUMENT_TYPES,
        }
    }

    componentDidMount() {
        this.handleFetchUserTypeList()
        this.handleFetchDocumenTypeList()
        this.handleFetchTitleList()
        window.addEventListener('scroll', this.handleScroll)
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.handleScroll)
    }

    handleSelectedTab = (event) => {
        this.setState({ selectedTab: event.target.name })
    }

    getPaginationData = () => {
        const { selectedTab, userTypes, userTitles, documentTypes } = this.state
        switch (selectedTab) {
            case TYPE_TITLE_PAGE_TAB.DOCUMENT_TYPES:
                return documentTypes
            case TYPE_TITLE_PAGE_TAB.USER_TITLES:
                return userTitles
            case TYPE_TITLE_PAGE_TAB.USER_TYPES:
                return userTypes
            default:
        }
        return false
    }

    handleScroll = () => {
        // End of the document reached?
        if (window.innerHeight + Math.ceil(document.documentElement.scrollTop) >= document.documentElement.offsetHeight - 100) {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
                const { selectedTab } = this.state
                const { list = [], totalCount = 0, pageNumber = 0 } = this.getPaginationData() || {}
                if (list.length < totalCount) {
                    const params = { page: pageNumber + 1 }
                    if (selectedTab === TYPE_TITLE_PAGE_TAB.DOCUMENT_TYPES) {
                        this.handleFetchDocumenTypeList(params)
                    } else if (selectedTab === TYPE_TITLE_PAGE_TAB.USER_TITLES) {
                        this.handleFetchTitleList(params)
                    } else if (selectedTab === TYPE_TITLE_PAGE_TAB.USER_TYPES) {
                        this.handleFetchUserTypeList(params)
                    }
                }
            }, 300)
        }
    }

    handleLoadingMode = (type, isFetching) => {
        this.setState((prevState) => ({ loadingMode: { ...prevState.loadingMode, [type]: isFetching } }))
    }

    handleFetchDocumenTypeList = async (params = {}) => {
        NProgress.start()
        try {
            this.handleLoadingMode(LOADER_TYPES.DOCUMENT_TYPES, true)
            const query = { ...params, ...this.state.documentTypes }
            const response = await documenTypeActions.getAllDocumentTypes(getPaginationQuery(query))
            query.response = response
            this.handleLoadingMode(LOADER_TYPES.DOCUMENT_TYPES, false)
            this.setState({ documentTypes: getPaginationState(query) })
            NProgress.done()
        } catch (err) {
            this.handleLoadingMode(LOADER_TYPES.DOCUMENT_TYPES, false)
            this.setState({ error: err.message || err.toString() }) // eslint-disable-line
            NProgress.done()
        }
    }

    handleFetchUserTypeList = async (params = {}) => {
        NProgress.start()
        try {
            this.handleLoadingMode(LOADER_TYPES.USER_TYPES, true)
            const query = { ...params, ...this.state.userTypes }
            const response = await userTypeActions.getAllTypesApi(getPaginationQuery(query))
            query.response = response?.data || {}
            this.handleLoadingMode(LOADER_TYPES.USER_TYPES, false)
            this.setState({ userTypes: getPaginationState(query) })
            NProgress.done()
        } catch (err) {
            this.handleLoadingMode(LOADER_TYPES.USER_TYPES, false)
            this.setState({ error: err.message || err.toString() }) // eslint-disable-line
            NProgress.done()
        }
    }

    handleFetchTitleList = async (params = {}) => {
        NProgress.start()
        try {
            this.handleLoadingMode(LOADER_TYPES.USER_TITLES, true)
            const query = { ...params, ...this.state.userTitles }
            const response = await userTitleActions.getAllTitlesApi(getPaginationQuery(query))
            query.response = response?.data || {}
            this.handleLoadingMode(LOADER_TYPES.USER_TITLES, false)
            this.setState({ userTitles: getPaginationState(query) })
            NProgress.done()
        } catch (err) {
            this.handleLoadingMode(LOADER_TYPES.USER_TITLES, false)
            this.setState({ error: err.message || err.toString() }) // eslint-disable-line
            NProgress.done()
        }
    }

    _handleSubmitBtnClick = (type) => {
        if (type === 'userTypeAdd') {
            this._toggleUserType()
        }
        if (type === 'userTitleAdd') {
            this._toggleUserTitle()
        }
        if (type === 'documentTypeAdd') {
            this._toggleDocumentType()
        }
        this.setState({
            values: {},
            editMode: '',
            deleteMode: '',
            typeAlreadyExists: false,
            titleAlreadyExists: false,
            docTypeAlreadyExists: false,
        })
    }

    _toggleUserType = () => {
        const { userTypeModal } = this.state
        this.setState({ userTypeModal: !userTypeModal })
    }

    _toggleUserTitle = () => {
        const { userTitleModal } = this.state
        this.setState({ userTitleModal: !userTitleModal })
    }

    _toggleDocumentType = () => {
        const { documentTypeModal } = this.state
        this.setState({ documentTypeModal: !documentTypeModal })
    }

    _toggleDeleteModal = () => {
        const { deleteModal } = this.state
        this.setState({ deleteModal: !deleteModal })
    }

    setEditMode = async (mode, i, selectedData) => {
        this.setState({
            values: selectedData,
            typeAlreadyExists: false,
            titleAlreadyExists: false,
            docTypeAlreadyExists: false,
        })
        if (mode === 'documentType') {
            this.setState({ editMode: 'documentType' })
            this._toggleDocumentType()
        } else {
            const response = await userTypeActions.fetchSelectedDocumentTypes(selectedData.id)
            // eslint-disable-next-line prefer-const
            let types = []

            if (response.code === 200) {
                response.data.map((type) => {
                    types.push(type.document_type.type)
                })
            }
            if (mode === 'editType') {
                this.setState({ editMode: 'editType', selectedTypes: types })
                this._toggleUserType()
            }
            if (mode === 'editTitle') {
                this.setState({ editMode: 'editTitle' })
                this._toggleUserTitle()
            }
        }
    }

    _onUserTypeSubmit = (name, documentType) => {
        if (this.state.editMode === 'editType') {
            this._updateUserType(name, documentType)
        } else {
            this._addUserType(name, documentType)
        }
    }

    _addUserType = async (name, documentType) => {
        NProgress.start()
        try {
            this.handleLoadingMode(LOADER_TYPES.UPSERT, true)
            const typeAddResponse = await userTypeActions.addTypesApi({ name, documentType })
            this.handleLoadingMode(LOADER_TYPES.UPSERT, false)
            if (typeAddResponse.typeAlreadyExists) {
                this.setState({ typeAlreadyExists: true })
                NProgress.done()
                return false
            }
            this.handleFetchUserTypeList({ page: 0 })
            this.setState({ values: {} })
            this._toggleUserType()
            notify(string.userTypeTitle.typeAddSuccess)
            NProgress.done()
            return true
        } catch (err) {
            notify(string.userTypeTitle.typeAddErr)
            NProgress.done()
        }
        return false
    }

    _updateUserType = async (name, documentType) => {
        NProgress.start()
        try {
            this.handleLoadingMode(LOADER_TYPES.UPSERT, true)
            const typeUpdateResponse = await userTypeActions.updateTypesApi({
                name,
                id: this.state.values.id,
                document_type: documentType,
            })
            this.handleLoadingMode(LOADER_TYPES.UPSERT, false)
            if (typeUpdateResponse.typeAlreadyExists) {
                this.setState({ typeAlreadyExists: true })
                NProgress.done()
                return false
            }
            this.handleFetchUserTypeList({ isFetchAll: true })
            this.setState({ values: {} })
            this._toggleUserType()
            notify(string.userTypeTitle.typeUpdateSuccess)
            NProgress.done()
            return true
        } catch (err) {
            this.handleLoadingMode(LOADER_TYPES.UPSERT, false)
            notify(string.userTypeTitle.typeUpdateErr)
            NProgress.done()
        }
        return false
    }

    _onUserTitleSubmit = (name) => {
        if (this.state.editMode === 'editTitle') {
            this._updateUserTitle(name)
        } else {
            this._addUserTitle(name)
        }
    }

    _onDocumentTypeSubmit = (type) => {
        if (this.state.editMode === 'documentType') {
            this._updateDocumentType(type)
        } else {
            this._addDocumentType(type)
        }
    }

    _addDocumentType = async (type) => {
        NProgress.start()
        try {
            this.handleLoadingMode(LOADER_TYPES.UPSERT, true)
            const response = await documenTypeActions.addDocumentTypeApi({ type })
            this.handleLoadingMode(LOADER_TYPES.UPSERT, false)
            if (response.typeAlreadyExists) {
                this.setState({ docTypeAlreadyExists: true })
                NProgress.done()
                return false
            }
            this.handleFetchDocumenTypeList({ page: 0 })
            this._toggleDocumentType()
            notify(string.documentType.addDocTypeSuccess)
            NProgress.done()
            return true
        } catch (err) {
            this.handleLoadingMode(LOADER_TYPES.UPSERT, false)
            notify(string.documentType.typeAddErr)
            NProgress.done()
        }
        return false
    }

    _updateDocumentType = async (type) => {
        NProgress.start()
        try {
            this.handleLoadingMode(LOADER_TYPES.UPSERT, true)
            const response = await documenTypeActions.updateDocumentTypeApi({
                type,
                id: this.state.values.id,
            })
            this.handleLoadingMode(LOADER_TYPES.UPSERT, false)
            if (response.typeAlreadyExists) {
                this.setState({ docTypeAlreadyExists: true })
                NProgress.done()
                return false
            }
            this.handleFetchDocumenTypeList({ isFetchAll: true })
            this._toggleDocumentType()
            notify(string.documentType.updateDocTypeSuccess)
            NProgress.done()
            return true
        } catch (err) {
            this.handleLoadingMode(LOADER_TYPES.UPSERT, false)
            notify(string.documentType.typeUpdateErr)
            NProgress.done()
        }
        return false
    }

    _addUserTitle = async (name) => {
        NProgress.start()
        try {
            this.handleLoadingMode(LOADER_TYPES.UPSERT, true)
            const titleAddResponse = await userTitleActions.addTitlesApi({ name })
            this.handleLoadingMode(LOADER_TYPES.UPSERT, false)
            if (titleAddResponse.titleAlreadyExists) {
                this.setState({ titleAlreadyExists: true })
                NProgress.done()
                return false
            }
            this.handleFetchTitleList({ page: 0 })
            this.setState({ values: {} })
            this._toggleUserTitle()
            notify(string.userTypeTitle.titleAddSuccess)
            NProgress.done()
            return true
        } catch (err) {
            this.handleLoadingMode(LOADER_TYPES.UPSERT, false)
            notify(string.userTypeTitle.titleAddErr)
            NProgress.done()
        }
        return false
    }

    _updateUserTitle = async (name) => {
        NProgress.start()
        try {
            this.handleLoadingMode(LOADER_TYPES.UPSERT, true)
            const titleUpdateResponse = await userTitleActions.updateTitlesApi({
                name,
                id: this.state.values.id,
            })
            this.handleLoadingMode(LOADER_TYPES.UPSERT, false)
            if (titleUpdateResponse.titleAlreadyExists) {
                this.setState({ titleAlreadyExists: true })
                NProgress.done()
                return false
            }
            this.handleFetchTitleList({ isFetchAll: true })
            this.setState({ values: {} })
            this._toggleUserTitle()
            notify(string.userTypeTitle.titleUpdateSuccess)
            NProgress.done()
            return true
        } catch (err) {
            this.handleLoadingMode(LOADER_TYPES.UPSERT, false)
            notify(string.userTypeTitle.titleUpdateErr)
            NProgress.done()
        }
        return false
    }

    setDeleteMode = async (mode, i, dataToDelete) => {
        this.setState({ values: dataToDelete })
        if (mode === 'deleteType') {
            this.setState({ deleteMode: 'deleteType' })
            this._toggleDeleteModal()
        }
        if (mode === 'deleteTitle') {
            this.setState({ deleteMode: 'deleteTitle' })
            this._toggleDeleteModal()
        }
        if (mode === 'deleteDocumentType') {
            this.setState({ deleteMode: 'deleteDocumentType' })
            this._toggleDeleteModal()
        }
    }

    _onDeleteEntry = () => {
        if (this.state.deleteMode === 'deleteType') {
            this._deleteUserType()
        }
        if (this.state.deleteMode === 'deleteTitle') {
            this._deleteUserTitle()
        }
        if (this.state.deleteMode === 'deleteDocumentType') {
            this._deleteDocumentType()
        }
    }

    _deleteDocumentType = async () => {
        NProgress.start()
        try {
            this.handleLoadingMode(LOADER_TYPES.DELETE, true)
            const deleteResp = await documenTypeActions.removeDocumentTypeApi({ id: this.state.values.id })
            this.handleLoadingMode(LOADER_TYPES.DELETE, false)
            if (deleteResp.success) {
                this.handleFetchDocumenTypeList({ isFetchAll: true })
                this.setState({ values: {} })
                this._toggleDeleteModal()
                notify(string.documentType.docTypeDeleteSuccess)
            } else {
                notify(string.documentType.docTypeDeleteErr)
            }
            NProgress.done()
        } catch (err) {
            this.handleLoadingMode(LOADER_TYPES.DELETE, false)
            notify(string.documentType.docTypeDeleteErr)
            NProgress.done()
        }
    }

    _deleteUserType = async () => {
        NProgress.start()
        try {
            this.handleLoadingMode(LOADER_TYPES.DELETE, true)
            const deleteResp = await userTypeActions.removeTypesApi(this.state.values)
            this.handleLoadingMode(LOADER_TYPES.DELETE, false)
            if (deleteResp.status) {
                this.handleFetchUserTypeList({ isFetchAll: true })
                this.setState({ values: {} })
                this._toggleDeleteModal()
                notify(string.userTypeTitle.typeDeleteSuccess)
            } else {
                notify(string.userTypeTitle.userTypeHasOrg)
            }
            NProgress.done()
        } catch (err) {
            this.handleLoadingMode(LOADER_TYPES.DELETE, false)
            notify(string.userTypeTitle.typeDeleteErr)
            NProgress.done()
        }
    }

    _deleteUserTitle = async () => {
        NProgress.start()
        try {
            this.handleLoadingMode(LOADER_TYPES.DELETE, true)
            const deleteResp = await userTitleActions.removeTitlesApi(this.state.values)
            this.handleLoadingMode(LOADER_TYPES.DELETE, false)
            if (deleteResp.status) {
                this.handleFetchTitleList({ isFetchAll: true })
                this.setState({ values: {} })
                this._toggleDeleteModal()
                notify(string.userTypeTitle.titleDeleteSuccess)
            } else {
                notify(string.userTypeTitle.titleHasUsers)
            }
            NProgress.done()
        } catch (err) {
            this.handleLoadingMode(LOADER_TYPES.DELETE, false)
            notify(string.userTypeTitle.titleDeleteErr)
            NProgress.done()
        }
    }

    render() {
        return (
            <UserTypeAndTitlePageComponent
                {...this.state}
                onSubmitBtnClick={this._handleSubmitBtnClick}
                onSetEditMode={this.setEditMode}
                onSetDeleteMode={this.setDeleteMode}
                onToggleUserType={this._toggleUserType}
                onUserTypeSubmit={this._onUserTypeSubmit}
                onToggleUserTitle={this._toggleUserTitle}
                onUserTitleSubmit={this._onUserTitleSubmit}
                onToggleDeleteModal={this._toggleDeleteModal}
                onDeleteEntry={this._onDeleteEntry}
                onToggleDocumentType={this._toggleDocumentType}
                onDocumentTypeSubmit={this._onDocumentTypeSubmit}
                onSelectedTab={this.handleSelectedTab}
            />
        )
    }
}

export default withAuth(UserTypeAndTitlePage, { loginRequired: true })
