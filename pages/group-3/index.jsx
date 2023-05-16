import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import NProgress from 'nprogress'
import DeleteModal from './DeleteModal'
import AddModal from './AddModal'
import EditModal from './EditModal'
import notify from '../../lib/notifier'
import string from '../../utils/LanguageTranslation'
import withAuth from '../../lib/withAuth'
import { dynamicLanguageStringChange } from '../../utils/globalFunc'
import { fetchGroups, addGroup, removeGroup, updateGroup, fetchGroupProject } from '../../lib/api/group'
import Button from '../../components/common/form-elements/button/Button'
import { INITIAL_PAGINATION_STATE, LOADER_TYPES } from '../../shared/constants'
import Loader from '../../components/common/Loader'
import { getPaginationQuery, getPaginationState } from '../../utils/InfinitePagination'
import NoDataView from '../../components/common/NoDataView'

let timeout

const GroupPage = () => {
   
    const [paginationData, setPaginationData] = useState(INITIAL_PAGINATION_STATE)
    const [group, setGroup] = useState({})
    const [deleteMode, setDeleteMode] = useState('')
    const [selectedIndex, setSelectedIndex] = useState('')
    const [groupProject, setGroupProject] = useState('')
    const [groupExists, setGroupExists] = useState(false)
    const [AddmodalOpen, setAddmodalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [loadingMode, setLoadingMode] = useState('')
    const [projectData, setProjectData] = useState({})
   
  const setGroupData = async(group) =>{
      setGroup(group)
  }
    
    const handleFetchGroupList = async (params = {}) => {
        NProgress.start()
        try {
            setLoadingMode(LOADER_TYPES.GROUPS)
            const query = { ...params, ...paginationData }
            const response = await fetchGroups(getPaginationQuery(query))
            query.response = response
            setLoadingMode('')
            setPaginationData(getPaginationState(query))
            NProgress.done()
        } catch (err) {
            setLoadingMode('')
            NProgress.done()
        }
    }

    const handleScroll = () => {
        // End of the document reached?
        if (window.innerHeight + Math.ceil(document.documentElement.scrollTop) >= document.documentElement.offsetHeight - 100) {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
                if (paginationData.list.length < paginationData.totalCount) {
                    handleFetchGroupList({ page: paginationData.pageNumber + 1 })
                }
            }, 300)
        }
    }

    useEffect(() => {
        handleFetchGroupList()
        window.addEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const resetInput = () => {
        setGroup({})
        setGroupExists(false)
        setAddmodalOpen(true)
    }

    // submit group function to check submitted details

    // add group function
    const addGroupData = async (data) => {
        NProgress.start()
        setGroupExists(false)
        try {
            const groupD = await addGroup(data)
            if (groupD.groupAlreadyExists) {
                setGroupExists(true)
                NProgress.done()
                return false
            }
            setGroupExists(false)
            handleFetchGroupList({ page: 0 })
            $('#groupModal').modal('hide')
            notify(string.group3AddSuccess)
            NProgress.done()
            return true
        } catch (err) {
            // console.error(err)
            notify(string.group3AddErr)
            NProgress.done()
        }
        return false
    }

    const onGroupSubmit = (group) => {
        return addGroupData(group)
    }

    // Function to delete entry from popup
    const onDeleteEntry = async (event) => {
        event.preventDefault()
        
        if (deleteMode === 'group') {
            // delete group data
            const groupsData = projectData?.group || paginationData.list[selectedIndex]
            if ((!!groupsData.is_available && !projectData?.group) || (!groupsData.is_available && !projectData?.group)) {
                setLoadingMode(LOADER_TYPES.DELETE)
                const { success } = await removeGroup({ id: groupsData.id })
                setLoadingMode('')
                if (success) {
                    handleFetchGroupList({ isFetchAll: true })
                    notify(string.group3DelSuccess)
                }
                if (!success && groupProject) {
                    notify({
                        message: `${dynamicLanguageStringChange(string.category.alreadyInUse, { category: string.group3, module: string.projects })}<ol style="text-align: left">${groupProject}</ol>`,
                    })
                }
                $('#deleteModal').modal('hide')
            } else {
                return notify({
                    message: `${dynamicLanguageStringChange(string.category.alreadyInUse, { category: string.group3, module: string.projects })}<ol style="text-align: left">${groupProject}</ol>`,
                })
            }
        }
        return false
    }

    // update group function
    const updategroup = async (group) => {
        NProgress.start()
        setGroupExists(false)
        setGroup(group)
        try {
            setLoadingMode(LOADER_TYPES.UPDATE)
            const groupUpdateResponse = await updateGroup(group)
            if (groupUpdateResponse.groupAlreadyExists) {
                setGroupExists(true)
                setLoadingMode('')
                NProgress.done()
                return false
            }
            setGroupExists(false)
            setGroup({})
            setLoadingMode('')
            handleFetchGroupList({ isFetchAll: true })
            notify(string.group3UpdateSuccess)
            NProgress.done()
            return true
        } catch (err) {
            setLoadingMode('')
            // console.error(err)
            notify(string.group3AddErr)
            NProgress.done()
        }
        return false
    }

    // set delete mode upon selecting delete icon
    const setdeleteMode = async (mode, i) => {
        if (mode) {
            const projectdata = await fetchGroupProject({ group_id: paginationData.list[i]?.id })
            const projectList = `${projectdata?.project_selection?.project?.name}${projectdata?.project_selection?.project?.isDraft ? ` (${string.project.draft})` : ''} ${projectdata?.project_selection?.project?.archived ? ` (${string.project.archived})` : ''}`
            setDeleteMode(mode)
            setSelectedIndex(i)
            setProjectData(projectdata)
            setGroupExists(false)
            setGroupProject(projectList)
            $('#deleteModal').modal('show')
        }
    }

    const seteditMode = (mode, i) => {
        if (mode) {
            setSelectedIndex(i)
            setGroupExists(false)
            if (mode === 'group') {
                const Group = paginationData.list[i]
                setGroup(Group)
                setEditModalOpen(true)
            }
        }
    }

    const togglePage = (state) => {
        setAddmodalOpen(state)
        setGroup({})
        setGroupExists(false)
    }

    const isFetchingList = LOADER_TYPES.GROUPS === loadingMode

    return (
        <div>
            <div className='container-fluid'>
                <div className='row d-flex project-listing'>
                    <div className='tab-pane fade show active mt-3 w-100' id='group' role='tabpanel' aria-labelledby='group-listing'>
                        <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                            <h4 className='text-dark'>{string.group3Listing}</h4>
                            <Button onClick={resetInput} className='btn btn-primary large-btn'>
                                {string.submitGroup3}
                            </Button>
                        </div>
                        <div className='project-table-listing table-responsive mt-2 w-100'>
                            <table className='table'>
                                <thead className='thead-dark'>
                                    <tr>
                                        <th scope='col'>#</th>
                                        <th scope='col'>{string.group3Id}</th>
                                        <th className='text-center' scope='col'>
                                            {string.actions}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginationData.list.map((group1, i) => {
                                        return (
                                            <tr key={group1.i}>
                                                <td>{i + 1}</td>
                                                <td>{group1.groupID}</td>
                                                <td>
                                                    {group1.id > 1 && (
                                                        <>
                                                            <i className='fa fa-pencil-alt' onClick={() => seteditMode('group', i)} role='button' aria-hidden='true' />
                                                            <i className='fa fa-trash' onClick={() => setdeleteMode('group', i)} role='button' aria-hidden='true' />
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    <NoDataView list={paginationData.list} isLoading={isFetchingList} />
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                {isFetchingList && <Loader className='pagination-loader' />}
            </div>

            <div className='modal fade customModal document' id='deleteModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                <DeleteModal isLoading={LOADER_TYPES.DELETE === loadingMode} onDeleteEntry={onDeleteEntry} />
            </div>

            <AddModal toggle={() => togglePage(!AddmodalOpen)} isOpen={AddmodalOpen} group={group} setGroupData={setGroupData} onGroupSubmit={onGroupSubmit} groupExists={groupExists} />

            {editModalOpen && (
                <EditModal toggle={() => setEditModalOpen(!editModalOpen)} isOpen={editModalOpen} group={group} isLoading={LOADER_TYPES.UPDATE === loadingMode} setGroupData={setGroupData} updateGroup={updategroup} groupExists={groupExists} />
            )}
        </div>
    )
}

GroupPage.getInitialProps = () => {
    const groupPage = true
    return { groupPage }
}

GroupPage.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.string,
    }),
}

GroupPage.defaultProps = {
    user: null,
}

export default withAuth(GroupPage, { loginRequired: true })
