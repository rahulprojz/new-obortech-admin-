import { Formik } from 'formik'
import * as Yup from 'yup'
import { ModalBody, Modal, ModalHeader } from 'reactstrap'
import Input from '../../components/common/form-elements/input/Input'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'
import FormHelperMessage from '../../components/common/form-elements/formHelperMessage'
import string from '../../utils/LanguageTranslation.js'

// const trackItemSchema = Yup.object().shape({
//     trackid: Yup.string()
//         .trim()
//         .required(string.enterTrackId)
//         .matches(/^[a-z0-9]+$/i, string.onlyAlphanumric),
// })

const TrackItemModal = ({ isOpenModal, isLoading, onCodeChange, onTrackItem, onToggleModal, projectId, handleQrCodeOnChange }) => {
    return (
        <Modal className='track-item-modal' isOpen={isOpenModal} centered={true} toggle={onToggleModal}>
            <ModalHeader toggle={onToggleModal} style={{ borderBottom: 0 }}></ModalHeader>
            <ModalBody>
                <Formik
                    enableReinitialize={true}
                    initialValues={{
                        trackid: '',
                        qrTrackCode: '',
                        projectId,
                    }}
                    // validationSchema={trackItemSchema}
                    onSubmit={onTrackItem}
                >
                    {({ errors, touched, handleChange, handleSubmit, values }) => (
                        <form className='form-container' onSubmit={handleSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center' }}>
                                <img src='/static/img/track-item.png' style={{ width: '50px' }} alt='OBORTECH' />
                                <div style={{ width: '350px', marginTop: '40px' }}>
                                    <label className='col-md-12 col-form-label pl-0 text-secondary'>{string.trackItem.manualCode}</label>
                                    <Input
                                        type='text'
                                        name='trackid'
                                        id='trackid'
                                        className='form-control mb-2'
                                        placeholder={string.trackItem.placeholder}
                                        aria-label='Search'
                                        aria-describedby='basic-addon2'
                                        onChange={(ev) => {
                                            onCodeChange(ev)
                                            handleChange(ev)
                                        }}
                                        value={values.trackid}
                                    />
                                    {(() => {
                                        if (errors.trackid && touched.trackid) {
                                            return <FormHelperMessage message={errors.trackid} className='error' />
                                        }
                                    })()}
                                    <label htmlFor='track-code' className='col-md-12 col-form-label pl-0 mb-1 text-secondary'>
                                        {string.trackItem.autoCode}
                                    </label>
                                    <div className='row'>
                                        <Input
                                            type='text'
                                            name='qrTrackCode'
                                            id='qrTrackCode'
                                            className='form-control mb-2'
                                            placeholder={string.trackItem.autoPlaceholder}
                                            aria-label='Search'
                                            aria-describedby='basic-addon2'
                                            onChange={(ev) => {
                                                handleQrCodeOnChange(ev)
                                                handleChange(ev)
                                            }}
                                            value={values.qrTrackCode}
                                        />
                                    </div>
                                    {(() => {
                                        if (errors.qrTrackCode && touched.qrTrackCode) {
                                            return <FormHelperMessage message={errors.qrTrackCode} className='error' />
                                        }
                                    })()}
                                </div>
                                <div style={{ marginTop: '40px', paddingBottom: '30px' }}>
                                    <LoaderButton type='submit' isLoading={isLoading} cssClass='btn btn-primary large-btn' text={string.trackItem.trackBtn} disabled={values.qrTrackCode.trim() == '' && values.trackid.trim() == ''} />
                                </div>
                            </div>
                        </form>
                    )}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

export default TrackItemModal
