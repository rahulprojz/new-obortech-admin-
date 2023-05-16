import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import string from '../../utils/LanguageTranslation.js'
import notify from '../../lib/notifier'

const DocumentHash = ({ toggle, isOpen, documentHash }) => {
    const _copyText = (documentHash) => {
        if (typeof navigator.clipboard == 'undefined') {
            var textArea = document.createElement('textarea')
            textArea.value = documentHash
            textArea.style.position = 'fixed' //avoid scrolling to bottom
            document.body.appendChild(textArea)
            textArea.focus()
            textArea.select()

            try {
                var successful = document.execCommand('copy')
                if (successful) {
                    notify(`${string.event.documentHashCopied} ${documentHash}`)
                }
            } catch (err) {
                notify(err.message || err.toString())
            }

            document.body.removeChild(textArea)
            return
        }
        navigator.clipboard.writeText(documentHash).then(
            function () {
                notify(`${string.event.documentHashCopied} ${documentHash}`)
            },
            function (err) {
                notify(err.message || err.toString())
            },
        )
    }

    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <Modal isOpen={isOpen} toggle={toggle} className='customModal'>
                <ModalHeader title='my title' toggle={toggle}>
                    <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                        {string.documentHashModalTitle}
                    </h5>
                </ModalHeader>
                <ModalBody className='text-center mb-5'>
                    <p>
                        {documentHash} <i style={{ cursor: 'pointer' }} onClick={() => _copyText(documentHash)} className='fa doc-hash-copy fa-copy'></i>
                    </p>
                </ModalBody>
            </Modal>
        )
    }
}

export default DocumentHash
