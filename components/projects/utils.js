import string from '../../utils/LanguageTranslation.js'
import { LISTING_PAGE_TAB } from '../../shared/constants.js'
import { fetchNonDraftProjects, fetchDraftProjects, fetchArchived } from '../../lib/api/project'
import { getPaginationQuery, getPaginationState } from '../../utils/InfinitePagination'

export const SELECTED_TAB_DETAILS = {
    [LISTING_PAGE_TAB.PROJECT_LISTING]: {
        title: string.project.projectListing,
        getDataFn: fetchNonDraftProjects,
        tableHeaders: getTableHeaders(LISTING_PAGE_TAB.PROJECT_LISTING),
        isColGroupRequired: true,
        isPaginationRequired: true,
        isSubmitBtnAllowed: (user) => isEditDeleteBtnAllowed(user),
        editModalTitle: string.project.editProject,
        editSuccessText: string.project.projectDataSaved,
        addModalTitle: string.project.addProject,
        archiveSucessText: string.projectTemplate.projectArchivedSuccessfully,
    },
    [LISTING_PAGE_TAB.TEMPLATE_LISTING]: {
        title: string.projectTemplate.templateListing,
        getDataFn: fetchDraftProjects,
        tableHeaders: getTableHeaders(LISTING_PAGE_TAB.TEMPLATE_LISTING),
        isColGroupRequired: true,
        isPaginationRequired: true,
        isSubmitBtnAllowed: (user) => false,
        editModalTitle: string.projectTemplate.editTemplate,
        editSuccessText: string.projectTemplate.templateDataSaved,
        addModalTitle: string.projectTemplate.addTemplate,
        deleteSucessText: string.projectTemplate.templateDeletedSuccessfully,
    },
    [LISTING_PAGE_TAB.ARCHIVED_LISTING]: {
        title: string.projectTemplate.archiveListing,
        getDataFn: fetchArchived,
        tableHeaders: getTableHeaders(LISTING_PAGE_TAB.ARCHIVED_LISTING),
        isColGroupRequired: true,
        isPaginationRequired: true,
        isSubmitBtnAllowed: (user) => false,
        archiveSucessText: string.projectTemplate.projectArchivedSuccessfully,
        restoreSucessText: string.projectTemplate.restoreSuccessfully,
    },
}

export default function getTableHeaders(tabSelect) {
    let ColumnArray = []
    if (tabSelect === LISTING_PAGE_TAB.PROJECT_LISTING) {
        return [
            {
                text: '#',
                props: {
                    scope: 'col',
                },
                colGroupStyle: {
                    style: { width: '5%' },
                },
            },
            {
                text: string.project.projectName,
                props: {
                    scope: 'col',
                    className: 'text-left',
                },
                colGroupStyle: {
                    style: { width: '15%' },
                },
            },
            {
                text: string.status,
                props: {
                    scope: 'col',
                    className: 'text-left',
                },
                colGroupStyle: {
                    style: { width: '10%' },
                },
            },
            {
                text: string.project.projectCategory,
                props: {
                    scope: 'col',
                    style: { textAlign: 'left' },
                },
                colGroupStyle: {
                    style: { width: '15%' },
                },
            },
            {
                text: string.project.createdAt,
                props: {
                    scope: 'col',
                    style: { textAlign: 'center' },
                },
                colGroupStyle: {
                    style: { width: '15%' },
                },
            },
            {
                text: string.audit.title,
                props: {
                    scope: 'col',
                    style: { textAlign: 'text-center' },
                    role: 'button',
                },
                colGroupStyle: {
                    style: { width: '15%' },
                },
            },
            {
                text: string.actions,
                props: {
                    scope: 'col',
                    width: '20%',
                    className: 'text-center',
                },
                colGroupStyle: {
                    style: { width: '15%' },
                },
            },
        ]
    } else {
        return [
            {
                text: '#',
                props: {
                    scope: 'col',
                },
                colGroupStyle: {
                    style: { width: '5%' },
                },
            },
            {
                text: string.project.projectName,
                props: {
                    scope: 'col',
                    className: 'text-left',
                },
                colGroupStyle: {
                    style: { width: '20%' },
                },
            },
            {
                text: string.project.projectCategory,
                props: {
                    scope: 'col',
                    style: { textAlign: 'left' },
                },
                colGroupStyle: {
                    style: { width: '20%' },
                },
            },
            {
                text: string.project.createdAt,
                props: {
                    scope: 'col',
                    style: { textAlign: 'center' },
                },
                colGroupStyle: {
                    style: { width: '15%' },
                },
            },
            {
                text: string.actions,
                props: {
                    scope: 'col',
                    width: '20%',
                    className: 'text-center',
                },
                colGroupStyle: {
                    style: { width: '15%' },
                },
            },
        ]
    }
}

//Only Admin and Manager user will be able to add and delete project
export const isEditDeleteBtnAllowed = (user) => {
    return Boolean(user.role_id == process.env.ROLE_ADMIN || user.role_id == process.env.ROLE_MANAGER)
}

export const getShipMentStatusTitle = (isActive) => {
    switch (isActive) {
        case 0:
            return string.resumeProject
        case 1:
            return string.pauseProject
        default:
            return string.startProject
    }
}

export const getProjectStatusClass = (isActive, disableBtnCls) => {
    switch (isActive) {
        case 0:
            return disableBtnCls + 'fa fa-play-circle text-success'
        case 1:
            return disableBtnCls + 'fa fa-pause-circle text-danger'
        default:
            return disableBtnCls + 'fa fa-stop-circle'
    }
}

export const getModalClass = (currentStep) => {
    switch (currentStep) {
        case 1:
            return 'customModal width60'
        case 2:
            return 'customModal width85'
        default:
            return 'customModal'
    }
}

export const handleFetchListData = async ({ query, getDataFn = () => { } }) => {
    try {
        const paginationQuery = getPaginationQuery(query)
        if(query.sort && query.sortBy){
            paginationQuery.sort = query.sort
            paginationQuery.sortBy = query.sortBy
        }
        const response = await getDataFn(paginationQuery)
        const projects = getPaginationState({ ...query, response })
        return projects
    } catch (ex) {
        throw ex
    }
}
