import React, { useEffect } from 'react'
import Button from '../../../components/common/form-elements/button/Button'
import Loader from '../../../components/common/Loader'
import string from '../../../utils/LanguageTranslation.js'
const List = ({ paginationProps = { isPaginationRequired: false, handleSort: () => { }, handleScroll: () => { }, isLoaderRequired: false }, listTitle, addSubmitBtnProps = { isVisible: false, addMode: () => { }, btnTxt: '' }, tableProps = { tableHeaders: [], isColGroupRequired: false, getTableBody: () => { } } }) => {
    useEffect(() => {
        const { isPaginationRequired, handleScroll } = paginationProps
        if (isPaginationRequired) {
            window.addEventListener('scroll', handleScroll)
            return () => {
                window.removeEventListener('scroll', handleScroll)
            }
        }
    }, [paginationProps.handleScroll])

    console.log()
    return (
        <div className='tab-pane fade show active mt-3 col-md-12' id='all2' role='tabpanel' aria-labelledby='all-containers'>
            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 event-filter'>
                <h4 className='text-dark'>{listTitle}</h4>
                <div>
                    {addSubmitBtnProps.isVisible && (
                        <Button className='btn btn-primary large-btn' onClick={() => addSubmitBtnProps.addMode()}>
                            {addSubmitBtnProps.btnTxt}
                        </Button>
                    )}
                </div>

            </div>
            <div className='project-table-listing table-responsive mt-2'>
                <table className='table text-center'>
                    <thead className='thead-dark'>
                        <tr>
                            {tableProps.tableHeaders.map(({ props, text }, i) => {
                                if (string.audit.title === text) {
                                    return (<th key={i} {...props} onClick={() => paginationProps.handleSort()} role="button">{string.audit.title}
                                        <i class="fa fa-sort ml-2" aria-hidden="true"></i>
                                    </th>)
                                } else {
                                    return (
                                        <th key={i} {...props}>
                                            {text}
                                        </th>
                                    )
                                }
                            })}
                        </tr>
                    </thead>
                    {tableProps.isColGroupRequired && (
                        <colgroup>
                            {tableProps.tableHeaders.map(({ colGroupStyle }, i) => (
                                <col {...colGroupStyle} />
                            ))}
                        </colgroup>
                    )}
                    {tableProps.getTableBody()}
                </table>
            </div>
            {Boolean(paginationProps.isLoaderRequired) && <Loader className='pagination-loader' />}
        </div>
    )
}

export default List
