import React, { useRef, useState } from 'react'
import { sortableContainer, sortableElement } from 'react-sortable-hoc'
import { Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'reactstrap'

import string from '../../utils/LanguageTranslation'
import LoaderButton from '../common/form-elements/button/LoaderButton'

const EditImageModal = ({ isOpen, onCancelClick, onSaveClick, isLoading, onEditPDFClick, toggleEditModal, leftBarRef, pdfImages, loading, selectedPage, onSortEnd, setLeftScrollPos, setSelectedPage, setSelectedPageIndex, _togglePageDelete, selectedPageIndex }) => {
    const [scrollerHeight, setScrollerHeight] = useState(0)

    let scrollPos = 0
    const divEl = useRef(null)

    const setScrollHeight = () => {
        const height = document.getElementById('pdf-viewer-blk').clientHeight
        setScrollerHeight(height)
    }

    const onScroll = () => {
        scrollPos = leftBarRef.current.scrollTop
    }

    /* PDF image sorting case */
    const SortableItem = sortableElement(({ value, imageIndex }) => (
        <>
            <img
                onClick={() => {
                    setLeftScrollPos(scrollPos)
                    setSelectedPage(value)
                    setSelectedPageIndex(imageIndex)
                }}
                src={`/server/upload/${value}`}
                alt='image'
                style={{ zIndex: 99999999 }}
            />
        </>
    ))

    const SortableList = sortableContainer(({ items }) => {
        return (
            <div id='pdf-page-scroll' onScroll={onScroll} style={{ height: scrollerHeight }} ref={leftBarRef} className='pdf-page-scroll'>
                {items.map((image, i) => {
                    const img_number = image.split('-')
                    const ar2 = img_number.slice(1, img_number.length)
                    const val = ar2.join('-')
                    return (
                        <React.Fragment key={i}>
                            <div className={selectedPage == val ? 'pdf-image active' : 'pdf-image'}>
                                <SortableItem key={i} index={i} value={val} imageIndex={i} />
                                <span className='textnumber'>{img_number[0]}</span>
                            </div>
                        </React.Fragment>
                    )
                })}
            </div>
        )
    })

    return (
        <Modal isOpen={isOpen} toggle={toggleEditModal} className='customModal document modal-lg' id='editDocumentEventPdfModal'>
            <ModalBody>
                {loading ? (
                    <div className='split-pdf-loader'>
                        <Spinner size='sm' />
                    </div>
                ) : (
                    <div id='pdf-viewer-blk' className='pdf-viewer' data-height={scrollerHeight}>
                        <SortableList
                            axis='xy'
                            distance={2}
                            items={pdfImages}
                            onSortEnd={onSortEnd}
                            style={{
                                zIndex: 99999999,
                            }}
                        />
                        <div className='modal-header-blk'>
                            <h5 className='document-edit-title'>{string.editPdfTxt}</h5>
                            <div className='document-action-btns'>
                                <i title='Edit page' className='fa fa-edit' style={{ marginRight: '6px', cursor: 'pointer' }} onClick={onEditPDFClick} />
                                {pdfImages.length > 1 && <i onClick={() => _togglePageDelete(selectedPageIndex)} style={{ cursor: 'pointer' }} title='Delete page' className='fa fa-trash-alt' />}
                            </div>
                            <div className='edit-doc-close-btn'>
                                <button onClick={toggleEditModal} type='button' className='close' aria-label='Close'>
                                    <span aria-hidden='true'>×</span>
                                </button>
                            </div>
                        </div>
                        <div ref={divEl} className='pdf-page-view'>
                            {selectedPage && <img onLoad={setScrollHeight} src={`/server/upload/${selectedPage}`} />}
                        </div>
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                <button className='btn btn-secondary' onClick={onCancelClick}>
                    {string.cancel}
                </button>
                <LoaderButton cssClass='btn btn-primary btn-fix-width' onClick={onSaveClick} isLoading={isLoading} text={string.save} />
            </ModalFooter>
        </Modal>
    )
}

export default EditImageModal
