import React, { useState, useEffect, useCallback } from 'react'
import NProgress from 'nprogress'
import string from '../../../utils/LanguageTranslation.js'
import notify from '../../../lib/notifier'
import Button from '../../../components/common/form-elements/button/Button'
import { dynamicLanguageStringChange } from '../../../utils/globalFunc'
import { LOADER_TYPES } from '../../../shared/constants'
import { getPaginationQuery, getPaginationState } from '../../../utils/InfinitePagination'
import { fetchParticipantCategories, addParticipantCategory, removeParticipantCategory, updateParticipantCategory } from '../../../lib/api/participant-category'
import List from './list'
import DeleteModal from '../../../components/common/DeleteModal'
import FormModal from './form'
let timeout
const ParticipantCategory = ({ participantCategories, setParticipantCategories }) => {
    const [participantCategoryModal, setParticipantCategoryModal] = useState(false)
    const [participantcategory, setParticipantCategory] = useState([])
    const [editMode, setEditMode] = useState('')
    const [deleteMode, setDeleteMode] = useState('')
    const [loadingMode, setLoadingMode] = useState({})
    const [selectedIndex, setSelectedIndex] = useState('')
    const [error, setError] = useState('')

    /* Participant Categories */
    const _fetchParticipantCategories = async (params = {}, isJob = false) => {
        handleLoadingMode(LOADER_TYPES.PARTICIPANT_CATEGORIES, true)
        if (!isJob) NProgress.start()
        try {
            const query = { ...params, ...participantCategories }
            const response = await fetchParticipantCategories(getPaginationQuery(query))
            query.response = response
            const data = getPaginationState(query)
            setParticipantCategories(data)
        } catch (err) {
            setError(err.message || err.toString())
        }
        if (!isJob) NProgress.done()
        handleLoadingMode(LOADER_TYPES.PARTICIPANT_CATEGORIES, false)
    }

    // add participant category function
    const addCategory = async (data) => {
        NProgress.start()
        handleLoadingMode(LOADER_TYPES.UPSERT, true)
        try {
            await addParticipantCategory(data)
            _fetchParticipantCategories({ page: 0 })
            setParticipantCategory({})
            notify(string.category.categoryAddSuccess)
            _toggleParticipantCategory()
        } catch (err) {
            notify(string.category.errorAddCategory)
        }
        NProgress.done()
        handleLoadingMode(LOADER_TYPES.UPSERT, false)
    }

    // update participant category function
    const updateCategory = async (data) => {
        NProgress.start()
        handleLoadingMode(LOADER_TYPES.UPSERT, true)
        try {
            const participant_category = participantCategories.list[selectedIndex]
            data.id = participant_category.id
            await updateParticipantCategory(data)
            _fetchParticipantCategories({ isFetchAll: true })
            setParticipantCategory({})
            notify(string.category.categoryUpdate)
            _toggleParticipantCategory()
        } catch (err) {
            notify(string.category.errorAddCategory)
        }
        NProgress.done()
        handleLoadingMode(LOADER_TYPES.UPSERT, false)
    }

    const _toggleParticipantCategory = (e, cat) => {
        setParticipantCategoryModal(!participantCategoryModal)
    }

    const handleLoadingMode = (type, isFetching) => {
        setLoadingMode((prevState) => {
            return { ...prevState, [type]: isFetching }
        })
    }

    // set delete mode upon selecting delete icon
    const _setDeleteMode = async (mode, i, cat, data = {}) => {
        if (mode == 'participantCategory') {
            setDeleteMode(mode)
            setSelectedIndex(i)
        }
    }

    // Function to delete entry from popup
    const _onDeleteEntry = async (e) => {
        e.preventDefault()
        handleLoadingMode(LOADER_TYPES.DELETE, true)
        try {
            if (deleteMode == 'participantCategory') {
                const selectCategory = participantCategories.list[selectedIndex]
                const response = await removeParticipantCategory({ id: selectCategory.id })
                if (response.isDeleted) {
                    await _fetchParticipantCategories({ isFetchAll: true })
                    notify(string.category.categoryDelSuccess)
                } else {
                    const participants = response.participant.map((participantData) => `<li>${participantData?.organization?.name}</li>`)
                    notify({
                        message: `${dynamicLanguageStringChange(string.category.alreadyInUse, { category: string.project.participantcategory, module: string.organizationTxt })}<ol style="text-align: left">${participants.join('')}</ol>`,
                    })
                }
                setDeleteMode('')
            }
        } catch (err) {
            console.lof(err)
        }
        handleLoadingMode(LOADER_TYPES.DELETE, false)
    }

    const _setEditMode = (mode, i, j, cat) => {
        if (mode) {
            if (mode == 'participantCategory') {
                setSelectedIndex(i)
                const event_name = participantCategories.list[i].name
                const val = { name: event_name }
                setParticipantCategory(val)
                setEditMode(mode)
                _toggleParticipantCategory(cat)
            }
        }
    }

    const _handleSubmitBtnClick = () => {
        _toggleParticipantCategory()
        setEditMode('')
        setParticipantCategory({})
    }

    const fetchAllData = (isJob = false) => {
        _fetchParticipantCategories(isJob ? { isFetchAll: true } : {}, isJob)
    }

    const handleScroll = useCallback(() => {
        if (window.innerHeight + Math.ceil(document.documentElement.scrollTop) >= document.documentElement.offsetHeight - 100) {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
                const { list, totalCount, pageNumber } = participantCategories
                if (list.length < totalCount) {
                    const params = { page: pageNumber + 1 }
                    _fetchParticipantCategories(params)
                }
            }, 300)
        }
    }, [participantCategories])

    useEffect(() => {
        if (!participantCategories.list.length) {
            fetchAllData()
        }

        return () => {
            if (timeout) clearTimeout(timeout)
        }
    }, [])

    return (
        <>
            <div className='tab-pane active mt-3 w-100' id='participantCategory' role='tabpanel' aria-labelledby='participation-listing'>
                <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter '>
                    <h4 className='text-dark'>{string.participant.categoryListing}</h4>
                    <Button className='btn btn-primary large-btn' onClick={_handleSubmitBtnClick}>
                        {string.submitCatBtn}
                    </Button>
                </div>
                <List isLoading={Boolean(loadingMode[LOADER_TYPES.PARTICIPANT_CATEGORIES])} participant_categories={participantCategories} setEditMode={_setEditMode} setDeleteMode={_setDeleteMode} string={string} handleScroll={handleScroll} />
            </div>

            {/* DELTE PARTICIPANT MODAL */}
            <DeleteModal isLoading={Boolean(loadingMode[LOADER_TYPES.DELETE])} toggle={() => setDeleteMode('')} isOpen={Boolean(deleteMode)} onDeleteEntry={_onDeleteEntry} />

            {/*ADD/UPDATE PARTICIPANT MODAL */}
            <FormModal
                participantCategoryModal={participantCategoryModal}
                _toggleParticipantCategory={() => setParticipantCategoryModal(!participantCategoryModal)}
                updateCategory={(data) => updateCategory(data)}
                addCategory={(data) => addCategory(data)}
                participantcategory={participantcategory}
                editMode={selectedIndex != null ? editMode : ''}
                isLoading={Boolean(loadingMode[LOADER_TYPES.UPSERT])}
            />
        </>
    )
}

export default ParticipantCategory
