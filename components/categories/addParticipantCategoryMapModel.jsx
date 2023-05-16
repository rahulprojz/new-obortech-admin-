import React, { useEffect, useState } from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import Select from 'react-select'
import FormHelperMessage from '../common/form-elements/formHelperMessage'
import string from '../../utils/LanguageTranslation.js'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import { fetchAllParticipantCategories } from '../../lib/api/participant-category'

const AddDocumentCategoryMapSchema = Yup.object().shape({
    category_id: Yup.object().shape({
        value: Yup.string().required(string.selectCatagoryNot),
        label: Yup.string(),
    }),
})

const AddParticipantCategoryMapModal = ({ isLoading, setValues, onCategorySubmit, isOpen, toggle, values, participantCategories, editMode, string }) => {
    const [eventCategories, setEventCatogries] = useState([])
    const fetchParticipantCategories = async () => {
        try {
            const evCategory = []
            const participants = await fetchAllParticipantCategories()
            participants.map((participant) => {
                evCategory.push({ label: participant.name, value: participant.id })
            })
            setEventCatogries(evCategory)
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        fetchParticipantCategories()
    }, [])

    if (typeof window === 'undefined') {
        return null
    }
    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal document'>
            <ModalHeader toggle={toggle}>
                <span className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {string.addParticipantCatTxt}
                </span>
            </ModalHeader>
            <ModalBody>
                <Formik
                    enableReinitialize
                    initialValues={{
                        category_id: values.category_id,
                    }}
                    validationSchema={AddDocumentCategoryMapSchema}
                    onSubmit={(values) => {
                        onCategorySubmit()
                    }}
                >
                    {({ errors, touched, handleChange, handleSubmit, values }) => (
                        <form onSubmit={handleSubmit}>
                            <div className='row ml-0 mr-0 content-block'>
                                <div className='form-group col-md-12 p-0'>
                                    <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                        {string.selectCategory}
                                    </label>
                                    <Select
                                        value={values.category_id}
                                        options={eventCategories}
                                        name='category_id'
                                        onChange={(event) => {
                                            handleChange({ target: { name: 'category_id', value: event } })
                                            setValues(event)
                                        }}
                                    />
                                    {errors.category_id?.value ? <FormHelperMessage message={errors.category_id?.value} className='error' /> : null}
                                </div>
                            </div>
                            <ModalFooter>
                                <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={isLoading} text={editMode === 'eventCategory' ? string.updateBtnTxt : string.insertBtnTxt} />
                            </ModalFooter>
                        </form>
                    )}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

AddParticipantCategoryMapModal.propTypes = {}
AddParticipantCategoryMapModal.defaultProps = {}

export default AddParticipantCategoryMapModal
