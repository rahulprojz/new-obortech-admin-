import React, { useState, useMemo, Fragment, useEffect } from 'react'
import { Collapse } from 'reactstrap'
import notify from '../../../lib/notifier.js'
import constant from '../../../utils/LanguageTranslation.js'
import Loader from '../../../components/common/Loader'
import NoDataView from '../../../components/common/NoDataView'
import '../../../components/categories/index.css'

const List = (props) => {
    const [openAcc, setOpenAcc] = useState()
    const {
        isLoading,
        setEditMode,
        setDeleteMode,
        project_categories: { list, pageNumber },
        string,
        onSelectProjectCategory,
        pdcEvents,
        onUpdateDefaultPdcClick,
        fetchProjectCategories,
        handleScroll,
        onSelectProjectCategoryPDC,
    } = props

    const _toggleAcc = (idx) => {
        if (idx === openAcc) {
            setOpenAcc(null)
        } else {
            setOpenAcc(idx)
            fetchProjectCategories({ isFetchAll: true })
        }
    }

    const eventsData =
        useMemo(() => {
            const filteredEvents = []
            list.map((category) => {
                const selectedEvents = pdcEvents?.filter(({ categoryId }) => categoryId === category.id)
                filteredEvents.push({ ...category, pdcEvents: selectedEvents })
            })
            return filteredEvents
        }, [pdcEvents, JSON.stringify(list)]) || []

    useEffect(() => {
        window.addEventListener('scroll', handleScroll)

        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [handleScroll])

    useEffect(() => {
        if (openAcc > -1) {
            setOpenAcc(null)
        }
    }, [pageNumber])

    return (
        <>
            <div className='project-table-listing table-responsive mt-2 w-100'>
                <table className='table eventCat'>
                    <thead className='thead-dark'>
                        <tr>
                            <th scope='col'>#</th>
                            <th scope='col'>{string.tableColName}</th>
                            <th className='text-center' scope='col'>
                                {string.actions}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {eventsData.length > 0 &&
                            eventsData.map((category, i) => {
                                const isDisabledPdc = !(category.project_document_categories?.length && category.project_event_categories?.length && category.project_participant_categories?.length)

                                return (
                                    <Fragment key={category.id}>
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>{category.name}</td>
                                            <td>
                                                <i className='fa fa-pencil-alt' onClick={() => setEditMode('projectCategory', i, null, category)} />
                                                <i className='fa fa-trash' onClick={() => setDeleteMode('projectCategory', i)} />
                                                {openAcc !== i && <i className='fa fa-caret-down' onClick={() => _toggleAcc(i)} />}
                                                {openAcc === i && <i className='fa fa-caret-up' onClick={() => _toggleAcc(i)} />}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan='3' className='eventCatExpand'>
                                                <Collapse isOpen={openAcc === i}>
                                                    <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                                                        <button className='btn btn-primary btn-sm add-evnt-cat-btn' disabled={isDisabledPdc} onClick={() => onSelectProjectCategoryPDC(category.id)}>
                                                            {constant.pdcCategory.createPDCBtnText}
                                                        </button>
                                                        <button className='btn btn-primary btn-sm add-evnt-cat-btn' onClick={() => setEditMode('eventCategoryMap', i, null, null)}>
                                                            {constant.addEvntCatTxt}
                                                        </button>
                                                        <button className='btn btn-primary btn-sm add-evnt-cat-btn' onClick={() => setEditMode('documentCategoryMap', i, null, null)}>
                                                            {constant.addDocCatTxt}
                                                        </button>
                                                        <button className='btn btn-primary btn-sm add-prt-cat-btn' onClick={() => setEditMode('participantCategoryMap', i, null, null)}>
                                                            {constant.addParticipantCatTxt}
                                                        </button>
                                                    </div>
                                                    <table className='table'>
                                                        <tbody>
                                                            {category.project_event_categories?.map((category, j) => {
                                                                return (
                                                                    <tr key={j}>
                                                                        <td>{category.event_category.name}</td>
                                                                        <td>{constant.submissionRequest.event}</td>
                                                                        <td>
                                                                            <i className='fa fa-trash' onClick={() => setDeleteMode('eventCategoryMap', j, i)} />
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })}
                                                            {category.project_document_categories?.map((category, k) => {
                                                                return (
                                                                    <tr key={k}>
                                                                        <td>{category.document_category?.name}</td>
                                                                        <td>{constant.Document}</td>
                                                                        <td>
                                                                            <i className='fa fa-trash' onClick={() => setDeleteMode('documentCategoryMap', k, i)} />
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })}
                                                            {category.project_participant_categories?.map((category, l) => {
                                                                return (
                                                                    <tr key={l}>
                                                                        <td>{category.participant_category?.name}</td>
                                                                        <td>{constant.Participant}</td>
                                                                        <td>
                                                                            <i className='fa fa-trash' onClick={() => setDeleteMode('participantCategoryMap', l, i)} />
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })}
                                                            {category.project_pdc_categories?.map((category, m) => {
                                                                const isDeleting = category.is_deleting === '1'
                                                                return (
                                                                    <tr key={m} className={isDeleting ? 'not-allowed' : ''}>
                                                                        <td>{category.name || ''}</td>
                                                                        <td>{constant.pdcCatTxt}</td>
                                                                        <td>
                                                                            <i className='fa fa-pencil-alt' onClick={() => !isDeleting && onSelectProjectCategory(category.project_category_id, category.id)} />
                                                                            <i className={`fas fa-check ${category.is_default && 'true'}`} onClick={() => !isDeleting && onUpdateDefaultPdcClick(category)} />
                                                                            <i
                                                                                className='fa fa-trash'
                                                                                onClick={() => {
                                                                                    if (category.is_default) {
                                                                                        return notify(string.event.cannotDeleteDefault)
                                                                                    }
                                                                                    !isDeleting && setDeleteMode('pdcCategory', m, i)
                                                                                }}
                                                                            />
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </Collapse>
                                            </td>
                                        </tr>
                                    </Fragment>
                                )
                            })}
                        <NoDataView list={list} isLoading={isLoading} />
                    </tbody>
                </table>
            </div>
            {isLoading && <Loader className='pagination-loader' />}
        </>
    )
}

export default List
