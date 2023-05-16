import { useState, useMemo, Fragment, useEffect } from 'react'
import { Collapse } from 'reactstrap'
import Loader from '../../../components/common/Loader'
import NoDataView from '../../../components/common/NoDataView'
import ActionButton from '../../../components/common/ActionButton'
import IntegrityIcon from '../../../components/common/IntegirityIcon'
const List = (props) => {
    const {
        isLoading,
        setEditMode,
        setDeleteMode,
        event_categories: { list, pageNumber },
        string,
        events,
        fetchEvents,
        handleScroll,
        activeIntegerity,
        handleIntegrity,
    } = props
    const [openAcc, setOpenAcc] = useState()
    const _toggleAcc = (idx) => {
        if (idx === openAcc) {
            setOpenAcc(null)
        } else {
            setOpenAcc(idx)
            fetchEvents({ isFetchAll: true })
        }
    }

    const eventsData =
        useMemo(() => {
            const filteredEvents = []
            list.map((category) => {
                const selectedEvents = events.filter(({ categoryId }) => categoryId === category.id)
                filteredEvents.push({ ...category, pdcEvents: selectedEvents })
            })

            return filteredEvents
        }, [events, list]) || []

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

    const handleIntegrityCheck = (category) => {
        let integrityIcon = `fa fa-refresh`
        if (activeIntegerity?.id === category?.id) {
            integrityIcon = 'fas fa-sync fa-spin'
        }
        if (activeIntegerity !== null && activeIntegerity?.id !== category?.id) {
            integrityIcon = 'fa fa-refresh text-muted disable'
        }
        return integrityIcon
    }

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
                                if (category.id != 1) {
                                    return (
                                        <Fragment key={i}>
                                            <tr key={i}>
                                                <td>{i + 1}</td>
                                                <td>{category.name}</td>
                                                <td>
                                                    <i className='fa fa-pencil-alt' onClick={() => setEditMode('eventCategory', i, null, category)} />
                                                    <i className='fa fa-trash' onClick={() => setDeleteMode('eventCategory', i)} />
                                                    {openAcc !== i && <i className='fa fa-caret-down' onClick={() => _toggleAcc(i)} />}
                                                    {openAcc === i && <i className='fa fa-caret-up' onClick={() => _toggleAcc(i)} />}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan='3' className='eventCatExpand'>
                                                    <Collapse isOpen={openAcc === i}>
                                                        <div style={{ textAlign: 'right' }}>{category.id != 1 && <i className='fa fa-plus pull-right' onClick={() => setEditMode('event', i, null, null)} />}</div>
                                                        <table className='table'>
                                                            <tbody>
                                                                {category.events?.map((event, j) => {
                                                                    const integrityIcon = handleIntegrityCheck(event)
                                                                    if (event.eventType == 'event') {
                                                                        return (
                                                                            <tr key={j}>
                                                                                <td>{event.eventName}</td>
                                                                                <td className='col-md-2'>
                                                                                    <IntegrityIcon data={event} />
                                                                                </td>
                                                                                <td>
                                                                                    <i className='fa fa-pencil-alt' onClick={() => setEditMode('event', i, j, event)} />
                                                                                    <i className='fa fa-trash' onClick={() => setDeleteMode('event', j, i, event)} />
                                                                                    <ActionButton
                                                                                        icon={integrityIcon}
                                                                                        title='Check Integrity'
                                                                                        onClick={() => {
                                                                                            if (!activeIntegerity) {
                                                                                                handleIntegrity(category, event)
                                                                                            }
                                                                                        }}
                                                                                    />
                                                                                </td>
                                                                            </tr>
                                                                        )
                                                                    }
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </Collapse>
                                                </td>
                                            </tr>
                                        </Fragment>
                                    )
                                }
                                return null
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
