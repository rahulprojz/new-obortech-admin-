import React, { useEffect } from 'react'
import Loader from '../../../components/common/Loader'
import NoDataView from '../../../components/common/NoDataView'

const List = (props) => {
    const {
        isLoading,
        setEditMode,
        setDeleteMode,
        participant_categories: { list },
        string,
        handleScroll,
    } = props

    useEffect(() => {
        window.addEventListener('scroll', handleScroll)
        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [handleScroll])

    return (
        <>
            <div className='project-table-listing table-responsive mt-2 w-100'>
                <table className='table'>
                    <thead className='thead-dark'>
                        <tr>
                            <th scope='col'>#</th>
                            <th scope='col'>{string.categoryName}</th>
                            <th className='text-center' scope='col'>
                                {string.actions}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((category, i) => {
                            return (
                                <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>{category.name}</td>
                                    <td>
                                        <i className='fa fa-pencil-alt' onClick={() => setEditMode('participantCategory', i)}></i>
                                        <i className='fa fa-trash' onClick={() => setDeleteMode('participantCategory', i)}></i>
                                    </td>
                                </tr>
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
