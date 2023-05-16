/* eslint-disable no-undef */
import { Formik } from 'formik'
import * as Yup from 'yup'
import { Modal, ModalHeader, ModalBody } from 'reactstrap'
import FormHelperMessage from '../../components/common/form-elements/formHelperMessage'
import string from '../../utils/LanguageTranslation'
// updated
import Input from '../../components/common/form-elements/input/Input'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'

const EditTruckschema = Yup.object().shape({
    truckID: Yup.string()
        .trim()
        .required(`${string.truck.group2Id} ${string.errors.required}`)
        .matches(/^(?!.*["'`\\])/, `${string.truck.group2Id} ${string.errors.invalid}`),
})
function EditModal({ truck, isLoading, state, updateTruck, truckExists, isOpen, toggle }) {
    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <Modal isOpen={isOpen} toggle={toggle} className='customModal'>
                <ModalHeader toggle={toggle}>
                    <h5 className='modal-title text-dark font-weight-bold'>{string.truck.editGroup2}</h5>
                </ModalHeader>
                <ModalBody className='text-center mb-5'>
                    <Formik
                        enableReinitialize={true}
                        initialValues={{
                            truckID: truck.truckID || '',
                        }}
                        validationSchema={EditTruckschema}
                        onSubmit={async (values) => {
                            state({
                                truck: Object.assign({}, truck, { truckID: values.truckID.trim() }),
                            })
                            const truckUpdated = await updateTruck()
                            if (truckUpdated) {
                                toggle()
                            }
                        }}
                    >
                        {({ errors, touched, handleChange, handleSubmit, values }) => (
                            <form className='form-container' onSubmit={handleSubmit}>
                                <div className='row ml-0 mr-0 content-block'>
                                    <div className='form-group col-md-12 p-0'>
                                        <label htmlFor='truckID' className='col-md-12 col-form-label pl-0'>
                                            {string.truck.group2Id}
                                        </label>
                                        <Input
                                            type='text'
                                            name='truckID'
                                            id='truckID'
                                            value={values.truckID}
                                            onChange={(ev)=>{
                                                truckExists = false
                                                handleChange(ev)
                                            }}
                                            className='form-control'
                                            placeholder={string.truck.group2Id}
                                        // onChange={(event) => {
                                        //     state({
                                        //         truck: Object.assign({}, truck, { truckID: event.target.value })
                                        //     });
                                        // }}
                                        />

                                        {(() => {
                                            if (errors.truckID && touched.truckID) {
                                                truckExists = false
                                                return <FormHelperMessage message={errors.truckID} className='error' />
                                            } else if (truckExists) {
                                                return <FormHelperMessage message={string.project.alreadyExistsGroup2} className='error' />
                                            }
                                        })()}
                                    </div>
                                </div>
                                <div className='modal-footer'>
                                    <LoaderButton cssClass='btn btn-primary large-btn' type='submit' isLoading={isLoading} text={string.updateBtnTxt} />
                                </div>
                            </form>
                        )}
                    </Formik>
                </ModalBody>
            </Modal>
        )
    }
}


EditModal.propTypes = {}

EditModal.defaultProps = {}

export default EditModal
