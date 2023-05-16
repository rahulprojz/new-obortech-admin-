import React, { useState, useImperativeHandle, forwardRef } from 'react'
import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import { setSidebarMenuList } from '../../redux/actions/sidebarActions'
import string from '../../utils/LanguageTranslation.js'
import notify from '../../lib/notifier'

import { releaseProjectSidebar, removeFolder } from '../../lib/api/project'
import DeleteModal from '../common/DeleteModal'

const MoreOptionsPopup = forwardRef((props, ref) => {
    const { subIt, type, project, menu, collapseId, toggleShow, rootIdx, _handleRowIndex, idx, subIdx, fetchProject, fetchSideMenu, handleEdit } = props
    const dispatch = useDispatch()
    const { sidebar } = useSelector((state) => state)
    const [openDelete, setOpenDelete] = useState(false)
    const [deleteArgs, setDeleteArgs] = useState()
    const sideMenuData = sidebar.menuList
    const isProject = type == 'project'

    useImperativeHandle(ref, () => ({
        onInputEmptyBlur: (e, obj) => {
            onInputEmptyBlur(e, obj)
        },
    }))

    const handleMenuClick = (rootIdx, subFolderIDx, idx, subIdx) => {
        dispatch(setSidebarMenuList(sideMenuData, rootIdx, subFolderIDx, idx, subIdx))
    }

    const _toggleDelete = (e, id, deleteId, subFolderId, idx) => {
        setDeleteArgs({
            mainId: id,
            deleteId,
            subFolderId,
            idx,
        })
        setOpenDelete(!openDelete)
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

    const _toggleEdit = (E, id, subFolderId, idx) => {
        let arr = sideMenuData
        let subFolderObj = {
            folderName: '',
            folderEditName: '',
            folderEdit: false,
            subFolderEditName: '',
            subfolderEdit: false,
        }
        if (subFolderId) {
            _manualToggleCollapse(`collapse-${subFolderId}-${idx}`, false, 'show')
            _manualToggleCollapse(`collapsed${subFolderId}`, false, 'collapsed')
            arr = arr.map((it) => {
                if (it.id === id) {
                    it.subFolders = it.subFolders.map((subFolder) => {
                        if (subFolder.id === subFolderId) {
                            subFolderObj = {
                                folderName: subFolder.name,
                                subFolderName: subFolder.name,
                                subfolderEdit: true,
                            }
                            subFolder.edit = true
                        }
                        return subFolder
                    })
                }
                return it
            })
        } else {
            _manualToggleCollapse(`collapse-${id}-${idx}`, false, 'show')
            _manualToggleCollapse(`collapsed${id}`, false, 'collapsed')
            arr = arr.map((it) => {
                if (it.id === id) {
                    subFolderObj = {
                        folderName: it.name,
                        folderEditName: it.name,
                        folderEdit: true,
                    }
                    it.edit = true
                }
                return it
            })
        }

        handleEdit(subFolderObj)
        dispatch(setSidebarMenuList(arr))
    }

    const _toggleAdd = (e, id, subFolderId, idx, isShip) => {
        let arr = sideMenuData
        const newObj = {
            id: Math.floor(Math.random() * 1000),
            name: null,
            subFolders: [],
            projects: [],
        }

        // Fetch projects
        if (isShip) {
            fetchProject()
        }

        if (subFolderId) {
            _manualToggleCollapse(`collapsed${subFolderId}`, false, 'collapsed')
            _manualToggleCollapse(`collapse${subFolderId}`, true, 'show')
            _manualToggleCollapse(`collapse-${subFolderId}-${idx}`, false, 'show')

            arr = arr.map((it) => {
                if (it.id === id) {
                    if (it.subFolders.some((subFolder) => subFolder.id === subFolderId)) {
                        it.subFolders = it.subFolders.map((subFolder) => {
                            if (subFolder.id === subFolderId) {
                                subFolder.projects = subFolder.projects.concat({
                                    id: Math.floor(Math.random() * 1000),
                                    name: null,
                                    project: {
                                        name: null,
                                    },
                                    edit: true,
                                    parent: subFolderId,
                                })
                            }
                            return subFolder
                        })
                    } else {
                        it.projects = it.projects.concat({
                            id: Math.floor(Math.random() * 1000),
                            name: null,
                            project: {
                                name: null,
                            },
                            edit: true,
                            parent: id,
                        })
                    }
                }
                return it
            })
        } else if (id) {
            _manualToggleCollapse(`collapse${id}`, true, 'show')
            _manualToggleCollapse(`collapse-${id}-${idx}`, false, 'show')
            _manualToggleCollapse(`collapsed${id}`, false, 'collapsed')
            arr = arr.map((it) => {
                if (it.id === id) {
                    if (isShip) {
                        it.projects = it.projects.concat({
                            id: Math.floor(Math.random() * 1000),
                            name: null,
                            project: {
                                name: null,
                            },
                            edit: true,
                            parent: id,
                        })
                    } else {
                        it.subFolders = it.subFolders.concat({
                            ...newObj,
                            edit: true,
                            parent: id,
                        })
                    }
                }
                return it
            })
        } else {
            arr = arr.concat({ ...newObj, edit: true })
        }
        dispatch(setSidebarMenuList(arr))
    }

    const _deleteRecord = (e) => {
        const args = deleteArgs
        let arr = sideMenuData
        if (args) {
            if (args.deleteId) {
                if (args.subFolderId) {
                    arr = arr.map((it) => {
                        if (it.id === args.mainId) {
                            it.subFolders = it.subFolders.map((subIt) => {
                                if (subIt.id === args.subFolderId) {
                                    subIt.projects = subIt.projects.filter((project) => project.id !== args.deleteId)
                                    releaseProjectSidebar({
                                        // parent: args.subFolderId,
                                        id: args.deleteId,
                                    }).then(() => {
                                        notify(string.project.projectDeletedSuccessfully)
                                        fetchSideMenu()
                                    })
                                }
                                return subIt
                            })
                        }
                        return it
                    })
                    _manualToggleCollapse(`collapse-${args.subFolderId}-${args.idx}`, false, 'show')
                } else {
                    arr = arr.map((it) => {
                        it.projects = it.projects.filter((project) => project.id !== args.deleteId)
                        releaseProjectSidebar({
                            parent: args.mainId,
                            id: args.deleteId,
                        }).then(() => {
                            notify(string.project.projectDeletedSuccessfully)
                            fetchSideMenu()
                        })
                        return it
                    })
                    _manualToggleCollapse(`collapse-${args.deleteId}-${args.idx}`, false, 'show')
                }
            } else if (args.subFolderId) {
                arr = arr.map((it) => {
                    if (it.id === args.mainId) {
                        it.subFolders = it.subFolders.filter((subIt) => {
                            if (subIt.id != args.subFolderId) {
                                return subIt
                            }
                        })
                        removeFolder({ id: args.subFolderId }).then(() => {
                            fetchSideMenu()
                        })
                    }
                    return it
                })
                _manualToggleCollapse(`collapse-${args.subFolderId}-${args.idx}`, false, 'show')
            } else {
                arr = arr.filter((it) => {
                    if (it.id !== args.mainId) {
                        return it
                    }
                })
                removeFolder({ id: args.mainId }).then(() => {
                    fetchSideMenu()
                })
                _manualToggleCollapse(`collapse-${args.mainId}-${args.idx}`, false, 'show')
            }
            arr
            _toggleDelete(e)
        }
    }

    const onInputEmptyBlur = (e, obj) => {
        setDeleteArgs(obj)
        _deleteRecord(e)
        fetchSideMenu()
    }

    const options = [
        {
            name: string.addSubfolder,
            isView: type === 'root',
            fn: _toggleAdd,
        },
        {
            name: string.editSubFolder,
            isView: type === 'subfolder',
            fn: _toggleEdit,
        },
        {
            name: string.addProject,
            isView: type === 'subfolder',
            fn: _toggleAdd,
            isAddProject: true,
        },
        {
            name: string.deleteSubFolder,
            isView: type === 'subfolder',
            fn: _toggleDelete,
            isDelete: true,
        },
        {
            name: string.deleteProject,
            isView: type === 'project',
            fn: _toggleDelete,
            isDelete: true,
        },
    ]
    return (
        <>
            <div className={`${isProject ? '' : 'col-sm-2'} dropdown `} id={collapseId}>
                <span
                    id='collapse'
                    style={{ color: '#fff', cursor: 'pointer' }}
                    onClick={() => {
                        if (type == 'root') _handleRowIndex(rootIdx, subIdx)
                        if (isProject) handleMenuClick(rootIdx, subIdx, null, idx)
                        if (!isProject) handleMenuClick(rootIdx, subIdx)
                    }}
                >
                    <b>...</b>
                </span>
                <ul id={collapseId} name='collapse' className={`collapse dropdown-menu ${isProject && 'menu-project'} ${toggleShow ? 'show' : ''}`} style={{ margin: '0', padding: '10px', zIndex: 999999 }} onMouseOver={() => _handleRowIndex(rootIdx)}>
                    {options.map((option) => {
                        return option.isView ? (
                            <li
                                name='collapse'
                                onClick={(e) => {
                                    if (option.isDelete) {
                                        option.fn(e, menu.id, project?.id, subIt?.id, idx)
                                    } else option.fn(e, menu?.id, subIt?.id, idx, option.isAddProject)
                                }}
                            >
                                {option.name}
                            </li>
                        ) : null
                    })}
                </ul>
            </div>
            {openDelete && <DeleteModal toggle={_toggleDelete} isOpen={openDelete} onDeleteEntry={(e) => _deleteRecord(e)} />}
        </>
    )
})

MoreOptionsPopup.PropTypes = { toggleEdit: PropTypes.func }
MoreOptionsPopup.defaultProps = { toggleEdit: () => {} }

export default MoreOptionsPopup
