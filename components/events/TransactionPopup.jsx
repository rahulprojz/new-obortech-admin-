import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import React from 'react'

import notify from '../../lib/notifier'
import string from '../../utils/LanguageTranslation'

const TransactionModal = ({isOpen, toggle, transaction_id}) => {
    const handleCopy = () => {
        if (transaction_id) {
            navigator.clipboard.writeText(transaction_id)
            notify(`${string.event.documentHashCopied} ${transaction_id}`)
        }
    }

    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal'>
            <ModalHeader toggle={toggle}>
                <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {string.transaction}
                </h5>
            </ModalHeader>
            <ModalBody className='text-center'>
                <div className='row ml-0 mr-0 content-block'>
                    <div className='form-group col-md-12 p-0'>
                        {transaction_id ?
                        <>
                            <div className='row'>
                                <span style={{ color: 'grey', cursor: 'pointer' }} className='form-label text-grey col-md-12 text-right' aria-hidden='true' onClick={handleCopy}>
                                    {string.event.copy} <i className='far fa-clone' />
                                </span>
                            </div>
                            <div className='row'>
                                <input type="text" className='disabled col-md-12 col-form-label pl-0' value={transaction_id}/>
                            </div>
                        </>
                        :
                        <div className='row'>
                            <span className='col-md-12 col-form-label pl-0 text-center'> {string.transactionNotAvailable}</span>
                        </div>
                    }
                    </div>
                </div>
            </ModalBody>
        </Modal>
    )
}

export default TransactionModal
