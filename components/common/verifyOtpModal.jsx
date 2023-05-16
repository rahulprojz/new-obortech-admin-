import { useFormik } from "formik";
import React from "react";
import * as Yup from 'yup'
import string from '../../utils/LanguageTranslation.js'
import { Modal, ModalBody, Button, ModalHeader, Spinner, ModalFooter } from 'reactstrap';
import OtpInput from "react-otp-input";



function VerifyOtpModal({ isOpen, toggle, onSubmit, isLoading }) {
    const formikOTP = useFormik({
        initialValues: {
            otp: '',
        },
        validationSchema: Yup.object({
            otp: Yup.number()
                .test('len', `${string.otp} ${string.errors.required}`, (val) => val?.toString().length === 6)
                .required(`${string.otp} ${string.errors.required}`),
        }),
        onSubmit: (values) => onSubmit(values),
    })
    return (
        <>
            <Modal isOpen={isOpen} toggle={toggle} className='customModal'>
                <ModalHeader cssModule={{ 'modal-title': 'modal-title text-uppercase text-dark font-weight-bold' }} toggle={toggle}>{string.verifyCode}</ModalHeader>
                <ModalBody>
                    <form className="flex justify-content-center">
                        <div className='form-group col-md-8 p-0 m-0'>
                            <label className='col-md-12 col-form-label pl-0'>
                                {string.otp}
                            </label>
                            <div className='d-flex otp-number'>
                                <OtpInput
                                    value={formikOTP.values.otp}
                                    onChange={(e) => formikOTP.setFieldValue('otp', e)}
                                    numInputs={6}
                                    isInputNum={true}
                                    disabledStyle={{ backgroundColor: 'transparent' }}
                                    separator={<span>&nbsp;</span>}
                                    hasErrored={formikOTP.errors.otp && formikOTP.touched.otp ? true : false}
                                    inputStyle={{ fontSize: '20px', marginRight: '30px', borderLeft: 'none', borderTop: 'none', borderRight: 'none' }}
                                />
                            </div>
                            {formikOTP.errors.otp && formikOTP.touched.otp && <p className='error mt-2 mb-0'>{formikOTP.errors.otp}</p>}
                        </div>
                    </form>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={formikOTP.handleSubmit} type='submit' className='btn btn-primary ml-2 large-btn'>{isLoading ? <Spinner size='sm' /> : string.verify}</Button>
                </ModalFooter>
            </Modal>

        </>
    )
}

export default VerifyOtpModal;
