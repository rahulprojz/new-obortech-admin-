import { SET_SIDEBAR_MENU_LIST, REMOVE_PROJECT_FROM_MENU_LIST } from '../types'
import { fetchSidebarFolders } from '../../lib/api/project'

export const fetchSideBarMenuLists = () => async (dispatch) => {
    const sidebarFolders = await fetchSidebarFolders()
    const folders = []
    sidebarFolders.map((sfolder) => {
        let folder = {
            id: sfolder.id,
            name: sfolder.name,
            organisation: sfolder.organization.organisationaName,
            projects: sfolder.projects,
            subFolders: [],
            position: sfolder.project_sidebar_folders[0].position,
            folderId: sfolder.project_sidebar_folders[0].id,
        }
        if (sfolder.project_sidebar_folders?.length) {
            const folders = sfolder.project_sidebar_folders.filter((f) => !f.project_id && !!f.parent)
            const projects = sfolder.project_sidebar_folders.filter((f) => !!f.project_id)
            let projectids = []
            const subFolders = folders.map((fs) => {
                fs.projects = projects.filter((p) => p?.parent == fs?.id).sort((a, b) => a.position - b.position) || []
                const ids = fs.projects.map((p) => p.project_id)
                projectids = projectids.concat(ids)
                return fs
            })
            folder.projects = folder.projects
                .filter((p) => !projectids.includes(p.id))
                .map((fp) => {
                    const project = projects.find((p) => p.project_id == fp.id)
                    if (project) {
                        fp.position = project.position
                    }
                    return fp
                })
                .sort((a, b) => a.position - b.position)
            folder.subFolders = subFolders.sort((a, b) => a.position - b.position)
        }

        folders.push(folder)
    })
    folders.sort((a, b) => a.position - b.position)
    dispatch(setSidebarMenuList(folders))
}


export const setSidebarMenuList = (menuData, rootIdx, subFolderIDx, idx, subIdx) => {
    let payload = []
    if (menuData.length) {
        payload = menuData.map((sidemenu, smIdx) => {
            if (sidemenu.subFolders && sidemenu.subFolders.length) {
                sidemenu.subFolders = sidemenu.subFolders.map((subfolder, sfIdx) => {
                    if (subfolder.projects && subfolder.projects.length) {
                        subfolder.projects = subfolder.projects.map((project, spIdx) => {
                            if (rootIdx == smIdx && sfIdx == subFolderIDx && spIdx == subIdx && !project.toggle) {
                                project.toggle = true
                            } else project.toggle = false
                            return project
                        })
                    }
                    if (rootIdx == smIdx && sfIdx == subFolderIDx && !(subIdx >= 0) && !subfolder.toggle) {
                        subfolder.toggle = true
                    } else subfolder.toggle = false
                    return subfolder
                })
            }
            if (sidemenu.projects && sidemenu.projects.length) {
                sidemenu.projects.map((project, pIdx) => {
                    if (rootIdx == smIdx && pIdx == idx && !project.toggle) project.toggle = true
                    else project.toggle = false
                    return project
                })
            }
            if (rootIdx == smIdx && !(subIdx >= 0) && !(idx >= 0) && !(subFolderIDx >= 0) && !sidemenu.toggle) sidemenu.toggle = true
            else sidemenu.toggle = false
            return sidemenu
        })
    }
    return {
        type: SET_SIDEBAR_MENU_LIST,
        payload,
    }
}

export const removeProjectFromMenuList = (payload) => {
    return {
        type: REMOVE_PROJECT_FROM_MENU_LIST,
        payload,
    }
}
