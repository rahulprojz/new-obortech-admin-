import React, { useEffect, useState } from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import Select from 'react-select'
import FormHelperMessage from '../common/form-elements/formHelperMessage'
import string from '../../utils/LanguageTranslation.js'
import LoaderButton from '../common/form-elements/button/LoaderButton'
import { fetchAllEventCategories } from '../../lib/api/event-category'

const AddEventCategoryMapschema = Yup.object().shape({
    category_id: Yup.object().shape({
        value: Yup.string().required(`${string.selectCatagoryNot}`),
        label: Yup.string(),
    }),
})

const AddEventCategoryMapModal = ({ isLoading, setValues, onCategorySubmit, isOpen, toggle, values, editMode, string }) => {
    const [event_categories, setEventCategories] = useState([])

    const fetchEventCategories = async () => {
        const evCategories = []
        const eventCategories = await fetchAllEventCategories()
        eventCategories.map((category) => {
            evCategories.push({ label: category.name, value: category.id })
        })
        setEventCategories(evCategories)
    }

    useEffect(() => {
        fetchEventCategories()
    }, [])

    if (typeof window === 'undefined') {
        return null
    }
    return (
        <Modal isOpen={isOpen} toggle={toggle} className='customModal document'>
            <ModalHeader toggle={toggle}>
                <span className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                    {editMode === 'projectCategory' ? string.updateEvntCatTxt : string.addEvntCatTxt}
                </span>
            </ModalHeader>
            <ModalBody>
                <Formik
                    enableReinitialize
                    initialValues={{
                        category_id: values.category_id,
                    }}
                    validationSchema={AddEventCategoryMapschema}
                    onSubmit={(val) => {
                        onCategorySubmit()
                    }}
                >
                    {({ errors, touched, handleChange, handleSubmit, values }) => {
                        return (
                            <form onSubmit={handleSubmit}>
                                <div className='row ml-0 mr-0 content-block'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                                            {string.selectCategory}
                                        </label>
                                        <Select
                                            value={values.category_id}
                                            options={event_categories.filter(event=> event.value !=1)}
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
                        )
                    }}
                </Formik>
            </ModalBody>
        </Modal>
    )
}

AddEventCategoryMapModal.propTypes = {}
AddEventCategoryMapModal.defaultProps = {}

export default AddEventCategoryMapModal
