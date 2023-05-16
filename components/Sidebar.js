import React, { useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useSelector, useDispatch } from 'react-redux'
import notify from '../lib/notifier'
import string from '../utils/LanguageTranslation.js'
import { assignProjectSidebar, fetchProjectList, fetchSidebarFolders, addSidebarFolder, updateFolder, updateSidebarFolder, updateSidebarPosition } from '../lib/api/project'
import { useOutsideClick } from '../utils/customHooks/useClickOutside'
import { toggleIsWatchAll } from '../redux/actions/watchAllActions'
import { setSidebarMenuList, fetchSideBarMenuLists } from '../redux/actions/sidebarActions'
import MoreOptionsPopup from './sidebarCommon/MoreOptionsPopup'
import SideBarMenu from './sidebarCommon/SideBarMenu'
import Sortable from 'sortablejs'
import SidebarSearch from './SidebarSearch'

let dragTimer

const Sidebar = forwardRef((user, ref) => {
    const dispatch = useDispatch()
    const { sidebar, watchAll } = useSelector((state) => state)
    const isWatchAll = watchAll.isWatchAll
    const sideMenuData = sidebar.menuList

    useImperativeHandle(ref, () => ({
        refreshFolders() {
            fetchSideMenu()
        },
    }))

    const [selectedRow, setSelectedRow] = useState(null)
    const [projectOption, setProjectOption] = useState([])
    const [subFolderEditMode, setSubFolderEditMode] = useState(false)
    const [subFolderEditValue, setSubFolderEditValue] = useState(null)
    const [folderEditMode, setFolderEditMode] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)
    const [folderEditValue, setFolderEditValue] = useState(null)
    const [folderValue, setFolderValue] = useState(null)
    const [lastSelectedFolder, setLastSelectedFolder] = useState(null)
    const [lastSelectedSubFolder, setLastSelectedSubFolder] = useState(null)
    const [projectList, setProjectList] = useState([])
    const moreOutside = useOutsideClick(sideMenuData)
    const isAdmin = user.user.role_id == process.env.ROLE_ADMIN
    const ignoreDrag = !isAdmin ? 'ignore-drag' : ''
    const router = useRouter()
    let { project_id } = router.query
    if (typeof window === 'undefined') {
        return null
    } else {
        if (isWatchAll && router.pathname != '/allevent') {
            dispatch(toggleIsWatchAll())
        }
    }

    const handleSetMenuFolders = (list = [], rootIdx, subFolderIDx, idx, subIdx) => {
        dispatch(setSidebarMenuList(list, rootIdx, subFolderIDx, idx, subIdx))
    }

    const _manualToggleCollapse = (id, open, className) => {
        const elem = document.getElementById(id)
        if (elem) {
            if (open) {
                elem.classList.add(className)
            } else {
                elem.classList.remove(className)
            }
        }
    }

    const fetchSideMenu = async () => {
        dispatch(fetchSideBarMenuLists())
    }

    const fetchProject = async (folders = sideMenuData) => {
        let projectoptions = []
        let subProjectList = []
        const projectsData = await fetchProjectList() //Fetch projects from DB
        //Projects List
        folders.map((f) => {
            const options = f.projects.map((project) => ({
                id: f.id,
                unique_Id: projectsData.filter((val) => {
                    if (val.id == project.id) {
                        return val
                    }
                }),
                label: project.name,
                value: project.id,
            }))
            projectoptions[f.id] = options
        })
        //SubProjects ---> Projects List
        folders.map((f) => {
            f.subFolders.map((subf) => {
                const options = subf.projects.map((subP) => ({
                    id: f.id,
                    unique_Id: projectsData.filter((valS) => {
                        if (valS.id == subP.project_id) {
                            return valS.uniqueId
                        }
                    }),
                    subPID: subf.id,
                    label: subP.name,
                    value: subP.project_id,
                }))
                subProjectList[subf.id] = options
            })
        })
        setProjectOption(projectoptions)
        const projectData = projectoptions.concat(subProjectList).flat(Infinity) //Merging array and converting into one single array
        setProjectList(projectData)
    }

    useMemo(() => {
        setProjectOption([])
        fetchProject()
    }, [sideMenuData])

    useEffect(() => {
        fetchSideMenu()
        setLastSelectedFolder(localStorage.getItem('last_selected_folder'))
        setLastSelectedSubFolder(localStorage.getItem('last_selected_sub_folder'))
    }, [])

    useEffect(() => {
        const {
            query: { project_id },
        } = router
        const folders = [...sideMenuData]

        if (project_id) {
            if (folders.length > 0) {
                folders.forEach((folder) => {
                    const folderCollapsed = `collapsed${folder.id}`
                    const folderCollapse = `collapse${folder.id}`
                    if (folder.subFolders.length > 0)
                        folder.subFolders.forEach((subFolder) => {
                            const subFolderCollapsed = `collapsed${subFolder.id}`
                            const subFolderCollapse = `collapse${subFolder.id}`
                            subFolder.projects.forEach((project) => {
                                if (project['project'] && project['project']['id'])
                                    if (project['project']['id'] == project_id) {
                                        // Folder Expand
                                        _manualToggleCollapse(folderCollapsed, true, 'collapsed')
                                        _manualToggleCollapse(folderCollapse, true, 'show')

                                        // Sub Folder Expand
                                        _manualToggleCollapse(subFolderCollapsed, true, 'collapsed')
                                        _manualToggleCollapse(subFolderCollapse, true, 'show')
                                    }
                            })
                        })
                    if (folder.projects.length > 0) {
                        folder.projects.forEach((project) => {
                            const subProjectCollapsed = `collapsed${project.id}`
                            const subProjectCollapse = `collapse${project.id}`
                            if (project['project'] && project['project']['id'])
                                if (project['project']['id'] == project_id) {
                                    // Folder Expand
                                    _manualToggleCollapse(folderCollapsed, true, 'collapsed')
                                    _manualToggleCollapse(folderCollapse, true, 'show')

                                    // Sub Folder Expand
                                    _manualToggleCollapse(subProjectCollapsed, true, 'collapsed')
                                    _manualToggleCollapse(subProjectCollapse, true, 'show')
                                }
                        })
                    }
                })
            }
            var element = document.getElementById(project_id)
            if (element && !isScrolled) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })
                setIsScrolled(true)
            }
            //To set selected folder and subfolder on search in url
            projectList.filter((value) => {
                if (value.value == project_id) {
                    localStorage.setItem('last_selected_folder', value.id)
                    if (value.subPID) {
                        localStorage.setItem('last_selected_sub_folder', value.subPID)
                    }
                    setLastSelectedFolder(localStorage.getItem('last_selected_folder'))
                    setLastSelectedSubFolder(localStorage.getItem('last_selected_sub_folder'))
                }
            })
        }
    }, [sideMenuData])
    useEffect(() => {
        if (moreOutside) {
            handleSetMenuFolders(sideMenuData)
        }
    }, [moreOutside])

    const _handleInputBlur = (e, type, subFolderId, user_id) => {
        const {
            target: { label, value, id },
        } = e
        const arr = sideMenuData.map((it) => {
            if (type === 'subFolder') {
                it.subFolders = it.subFolders.map((subFolder) => {
                    if (subFolder.id === parseInt(id)) {
                        if (subFolderEditMode) {
                            if (value) {
                                subFolder.name = value
                                updateSidebarFolder({ id: subFolder.id, name: value }).then(() => {
                                    fetchSideMenu().then(() => {})
                                })
                            } else {
                                subFolder.name = subFolderEditValue
                            }
                            subFolder.edit = false
                            setSubFolderEditMode(false)
                            setSubFolderEditValue(null)
                            setFolderValue(null)
                        } else {
                            if (value) {
                                subFolder.name = value
                                addSidebarFolder({
                                    parent: subFolder.parent,
                                    name: value,
                                    user_id,
                                }).then((response) => {
                                    if (response.error != undefined) {
                                        notify(string.folderExit)
                                    } else {
                                        fetchSideMenu().then(() => {})
                                        subFolder.edit = false
                                        setFolderValue(null)
                                    }
                                })
                            } else {
                                fetchSideMenu().then(() => {})
                            }
                        }
                    }
                    return subFolder
                })
                return it
            } else if (type === 'project') {
                if (subFolderId) {
                    it.subFolders = it.subFolders.map((subFolder) => {
                        if (subFolderId === subFolder.id) {
                            subFolder.projects = subFolder.projects.map((project) => {
                                if (project.id === parseInt(id)) {
                                    if (label) {
                                        project.name = label
                                        project.project_id = value
                                        assignProjectSidebar({
                                            parent: project.parent,
                                            project_id: value,
                                            user_id,
                                            name: label,
                                        }).then(() => {
                                            fetchSideMenu().then(() => {})
                                        })
                                    }
                                }
                                return project
                            })
                        }
                        return subFolder
                    })
                } else {
                    it.projects = it.projects.map((project) => {
                        if (project.id === parseInt(id)) {
                            if (label) {
                                project.name = label
                                assignProjectSidebar({
                                    parent: project.parent,
                                    project_id: value,
                                    user_id,
                                }).then(() => {
                                    fetchSideMenu().then(() => {})
                                })
                            }
                        }
                        return project
                    })
                }
            } else {
                if (it.id === parseInt(id)) {
                    if (folderEditMode) {
                        if (value) {
                            it.name = value
                            updateFolder({ id: it.id, name: value }).then(() => {
                                fetchSideMenu().then(() => {})
                            })
                        } else {
                            it.name = folderEditValue
                        }
                        it.edit = false
                        setFolderEditMode(false)
                        setFolderEditValue(null)
                        setFolderValue(null)
                    } else {
                        if (value) {
                            it.name = value
                            it.edit = false
                            addSidebarFolder({ parent: null, name: value, user_id }).then((response) => {
                                if (response.error != undefined) {
                                    notify(string.folderExit)
                                } else {
                                    setFolderValue(null)
                                    fetchSideMenu().then(() => {})
                                }
                            })
                        } else {
                            fetchSideMenu().then(() => {})
                        }
                    }
                }
            }
            return it
        })
    }

    const updatePosition = async (target, type) => {
        const positionArray = []
        $($(target).children('li').get()).each((index, element) => {
            positionArray[index] = { id: element.id, position: index, name: element.getAttribute('name') }
        })
        await updateSidebarPosition({
            positions: positionArray,
            type,
        })
    }
    if (typeof window === 'undefined') {
        return null
    } else {
        const el = document.getElementById('root-folders')
        if (el) {
            Sortable.create(el, {
                group: 'root-folders',
                animation: 100,
                filter: '.ignore-drag',
                onMove: (e) => {
                    if (dragTimer) clearTimeout(dragTimer)
                    dragTimer = setTimeout(() => {
                        updatePosition(e.target)
                    }, 1000)
                },
            })
        }
        return (
            <>
                <div className={`sidebar-wrapper`}>
                    <div className='sidebar-brand-block'>
                        {/* Sidebar - Brand */}
                        <div className='sidebar-brand d-flex align-items-center o-hidden'>
                            <img src='/static/img/logo.png' alt='OBORTECH' />
                        </div>
                    </div>
                    <ul className='navbar-nav sidebar sidebar-dark accordion customAccordion' id='accordionSidebar'>
                        {/* Divider */}
                        <hr className='sidebar-divider my-0' />
                        {/* Topbar Search */}
                        <li>
                            <form className='d-none d-sm-inline-block form-inline navbar-search'>
                                <SidebarSearch projectList={projectList} project_id={project_id} />
                            </form>
                        </li>
                        {/* Watch all feature */}
                        <li style={{ textAlign: 'right', backgroundColor: 'inherit' }} className='nav-item title'>
                            <input
                                type='checkbox'
                                onChange={() => {}}
                                onClick={() => {
                                    dispatch(toggleIsWatchAll())
                                }}
                                checked={isWatchAll}
                            />
                            <span style={{ marginLeft: '6px' }}>{string.watchAll}</span>
                        </li>
                        <ul id={'root-folders'} className='p-0'>
                            {sideMenuData.length > 0 &&
                                sideMenuData?.map((menu, idx) => {
                                    const rootIdx = idx
                                    if (isAdmin || menu.projects?.length || (menu.subFolders?.length && menu.subFolders?.some((subIt) => subIt.projects?.length))) {
                                        const element = document.getElementById(`subfolder${menu.id}`)
                                        if (element) {
                                            Sortable.create(element, {
                                                group: 'subfolders',
                                                animation: 100,
                                                filter: '.ignore-drag',
                                                onMove: (e) => {
                                                    if (dragTimer) clearTimeout(dragTimer)
                                                    dragTimer = setTimeout(() => {
                                                        updatePosition(e.target)
                                                    }, 1000)
                                                },
                                            })
                                        }
                                        const element1 = document.getElementById(`root-projects${menu.id}`)
                                        if (element) {
                                            Sortable.create(element1, {
                                                group: 'rootProjects',
                                                animation: 100,
                                                filter: '.ignore-drag',
                                                onMove: (e) => {
                                                    if (dragTimer) clearTimeout(dragTimer)
                                                    dragTimer = setTimeout(() => {
                                                        updatePosition(e.target, 'project')
                                                    }, 1000)
                                                },
                                            })
                                        }
                                        return (
                                            <React.Fragment key={idx}>
                                                <li id={menu.folderId} name={menu.name} className={`${ignoreDrag} ${selectedRow == idx ? 'nav-item row zindex-5' : 'nav-item row zindex-1'}`} key={idx}>
                                                    <SideBarMenu
                                                        id={menu.id}
                                                        className={menu.subFolders?.length > 0 || menu.projects?.length > 0 ? (menu.id == lastSelectedFolder ? 'nav-link' : 'nav-link collapsed') : 'nav-link'}
                                                        isToggle={menu.subFolders?.length > 0 || menu.projects?.length > 0}
                                                        isExpanded={menu.id == lastSelectedFolder}
                                                        onClick={() => {
                                                            localStorage.setItem('last_selected_folder', menu.id)
                                                        }}
                                                        edit={menu.edit != undefined && menu.edit}
                                                        name={`${menu.organisation} | ${menu.name}`}
                                                        setInputValue={setFolderValue}
                                                        inputValue={folderValue}
                                                        _handleInputBlur={(e) => _handleInputBlur((e, null, null, menu.id))}
                                                    />
                                                    {isAdmin && (
                                                        <MoreOptionsPopup
                                                            type='root'
                                                            menu={menu}
                                                            collapseId={`${menu.id}-${idx}`}
                                                            toggleShow={menu.toggle}
                                                            rootIdx={rootIdx}
                                                            idx={idx}
                                                            _handleRowIndex={setSelectedRow}
                                                            fetchProject={fetchProject}
                                                            fetchSideMenu={fetchSideMenu}
                                                            handleEdit={(editObj) => {
                                                                setFolderValue(editObj.folderName)
                                                                setSubFolderEditValue(editObj.subFolderName)
                                                                setSubFolderEditMode(editObj.subfolderEdit)
                                                            }}
                                                        />
                                                    )}
                                                    <div id={`collapse${menu.id}`} className={menu.id == lastSelectedFolder ? 'collapse show' : 'collapse'} aria-labelledby='headingTwo' data-parent='#accordionSidebar'>
                                                        <div className='collapse-inner rounded'>
                                                            <ul id={`subfolder${menu.id}`} className='collapse-inner rounded pl-0'>
                                                                {menu.subFolders?.map((subIt, idx) => {
                                                                    const isSubToggled = subIt.id == lastSelectedSubFolder
                                                                    const isFolderOpened = subIt.projects.find((p) => p.project_id == project_id)
                                                                    const subProjectsEle = document.getElementById(`sub-project${subIt.id}`)
                                                                    if (subProjectsEle) {
                                                                        Sortable.create(subProjectsEle, {
                                                                            group: `subprojectElements${subIt.id}`,
                                                                            animation: 100,
                                                                            filter: '.ignore-drag',
                                                                            onMove: (e) => {
                                                                                if (dragTimer) clearTimeout(dragTimer)
                                                                                dragTimer = setTimeout(() => {
                                                                                    updatePosition(e.target, 'project')
                                                                                }, 1000)
                                                                            },
                                                                        })
                                                                    }
                                                                    const subIdx = idx

                                                                    if (subIt?.projects.length && subIt.projects.some((p) => !p.name)) {
                                                                        const element = document.getElementById(`collapse-sub${subIt.id}`)
                                                                        const toggleElement = document.getElementById(`collapsed${subIt.id}`)
                                                                        if (element) {
                                                                            element.className += ' show'
                                                                        }
                                                                        if (toggleElement) {
                                                                            toggleElement.className = toggleElement.className.replace('collapsed')
                                                                            toggleElement.setAttribute('aria-expanded', true)
                                                                        }
                                                                    }
                                                                    return !!subIt.projects?.length || isAdmin ? (
                                                                        <li key={idx} id={subIt.id} name={subIt.name} className={`${ignoreDrag} collapse-inner rounded row`}>
                                                                            <>
                                                                                {(!!subIt.projects?.length || isAdmin) && (
                                                                                    <>
                                                                                        <SideBarMenu
                                                                                            id={subIt.id}
                                                                                            className={subIt.projects?.length > 0 ? `nav-link ${document.getElementById(`collapse${subIt.id}`)?.className?.includes('show') ? '' : isSubToggled || isFolderOpened ? '' : 'collapsed'}` : 'collapse-item'}
                                                                                            isToggle={subIt.projects?.length > 0}
                                                                                            isExpanded={isSubToggled || isFolderOpened}
                                                                                            edit={subIt.edit != undefined && subIt.edit}
                                                                                            name={subIt.name}
                                                                                            setInputValue={setFolderValue}
                                                                                            inputValue={folderValue}
                                                                                            _handleInputBlur={(e) => _handleInputBlur(e, 'subFolder', null, menu.id)}
                                                                                            controls='sub'
                                                                                            onClick={() => {
                                                                                                localStorage.setItem('last_selected_sub_folder', subIt.id)
                                                                                            }}
                                                                                        />
                                                                                    </>
                                                                                )}
                                                                                {isAdmin && (
                                                                                    <MoreOptionsPopup
                                                                                        type='subfolder'
                                                                                        menu={menu}
                                                                                        collapseId={`${subIt.id}-${idx}`}
                                                                                        toggleShow={subIt.toggle}
                                                                                        rootIdx={rootIdx}
                                                                                        idx={idx}
                                                                                        _handleRowIndex={setSelectedRow}
                                                                                        fetchProject={fetchProject}
                                                                                        fetchSideMenu={fetchSideMenu}
                                                                                        subIt={subIt}
                                                                                        subIdx={subIdx}
                                                                                        handleEdit={(editObj) => {
                                                                                            setFolderValue(editObj.folderName)
                                                                                            setSubFolderEditValue(editObj.subFolderName)
                                                                                            setSubFolderEditMode(editObj.subfolderEdit)
                                                                                        }}
                                                                                    />
                                                                                )}
                                                                            </>
                                                                            <div id={`collapse-sub${subIt.id}`} className={`${isSubToggled || isFolderOpened ? 'show' : ''} collapse`} aria-labelledby='headingThree'>
                                                                                <ul id={`sub-project${subIt.id}`} className='collapse-inner rounded p-0'>
                                                                                    {subIt.projects?.map((project, idx) => {
                                                                                        return (
                                                                                            <li key={idx} id={project.project_id} name={project.name} className={`${ignoreDrag} row`}>
                                                                                                <SideBarMenu
                                                                                                    id={menu.id}
                                                                                                    project={project}
                                                                                                    className={project.project_id && !isWatchAll && project.project_id == project_id ? 'col-sm-10 active-project' : 'col-sm-10'}
                                                                                                    _handleInputBlur={(e) => _handleInputBlur(e, 'project', subIt.id, menu.id)}
                                                                                                    projectOption={projectOption}
                                                                                                />
                                                                                                {isAdmin && (
                                                                                                    <div className='col-sm-2 project-padding'>
                                                                                                        <MoreOptionsPopup
                                                                                                            type='project'
                                                                                                            menu={menu}
                                                                                                            collapseId={`${project.id}-${idx}`}
                                                                                                            toggleShow={project.toggle}
                                                                                                            rootIdx={rootIdx}
                                                                                                            idx={idx}
                                                                                                            _handleRowIndex={setSelectedRow}
                                                                                                            fetchProject={fetchProject}
                                                                                                            fetchSideMenu={fetchSideMenu}
                                                                                                            subIdx={subIdx}
                                                                                                            project={project}
                                                                                                            handleEdit={(editObj) => {
                                                                                                                setFolderValue(editObj.folderName)
                                                                                                                setSubFolderEditValue(editObj.subFolderName)
                                                                                                                setSubFolderEditMode(editObj.subfolderEdit)
                                                                                                            }}
                                                                                                        />
                                                                                                    </div>
                                                                                                )}
                                                                                            </li>
                                                                                        )
                                                                                    })}
                                                                                </ul>
                                                                            </div>
                                                                        </li>
                                                                    ) : null
                                                                })}
                                                            </ul>
                                                            <ul id={`root-projects${menu.id}`} className='collapse-inner rounded p-0'>
                                                                {menu.projects?.length > 0 &&
                                                                    menu.projects?.map((project, idx) => (
                                                                        <li key={idx} id={project.project_id} name={project.name} className={`${ignoreDrag} collapse-inner rounded`}>
                                                                            <SideBarMenu
                                                                                id={menu.id}
                                                                                project={project}
                                                                                className={project.project_id && !isWatchAll && project.project_id == project_id ? 'col-sm-10 pl-2 active-project' : 'col-sm-10 pl-2'}
                                                                                _handleInputBlur={(e) => _handleInputBlur(e, 'project', null, menu.id)}
                                                                                projectOption={projectOption}
                                                                            />
                                                                        </li>
                                                                    ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </li>
                                            </React.Fragment>
                                        )
                                    }
                                })}
                        </ul>
                    </ul>
                </div>
            </>
        )
    }
})

export default Sidebar
