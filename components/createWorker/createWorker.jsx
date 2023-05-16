import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import Button from "../../components/common/form-elements/button/Button";
import Input from "../../components/common/form-elements/input/Input";
import { useFormik } from "formik";
import string from "../../utils/LanguageTranslation.js";
import FormHelperMessage from "../../components/common/form-elements/formHelperMessage";
import * as Yup from "yup";
import "./worker.css"
function CreateWorker (){
    const [modal, setModal] = useState(false);
    const toggle = () => setModal(!modal);
    const formik = useFormik({
        initialValues: {
            firstName: "",
            lastName: "",
            cellNo: "",
            email: "",
            role:"",
            uniqueId:"",
            password:"",
            isActive:""
          },
          validationSchema: Yup.object({
            firstName: Yup.string().required(`${string.firstName} ${string.errors.required}`),
            lastName: Yup.string().required(`${string.lastName} ${string.errors.required}`),
            cellNo: Yup.string().required(`${string.cellNo} ${string.errors.required}`),
            email: Yup.string().required(`${string.login.email} ${string.errors.required}`),
            role: Yup.string().required(`${string.role} ${string.errors.required}`),
            uniqueId: Yup.string().required(`${string.worker.uniqueId} ${string.errors.required}`),
            password: Yup.string().required(`${string.onboarding.passWord} ${string.errors.required}`),
            isActive: Yup.string().required(`${string.isActive} ${string.errors.required}`),
         }),
    })
    return(
        <div className="wroker-wrap">
          <Button  onClick={toggle} className="common-modal-btn ">{string.createWorkers}</Button>
          <Modal isOpen={modal} toggle={toggle} className="worker-modal common-model modal-lg customModal">
          <ModalHeader toggle={toggle} className="modal-center-Header">{string.createWorkers}</ModalHeader>
          <ModalBody className="common-modal-wrap">
          <form  onSubmit={formik.handleSubmit} >
            <div className="text-field-wrap d-flex justify-content-between">
                <div className="text-field-wrapper">
                    <Input type="text" className="input-field"
                        placeholder={`${string.firstName} *`}
                        name="firstName"
                        onChange={formik.handleChange}
                        value={formik.values.firstName}
                        />
                        {formik.errors.firstName ? (
                            <FormHelperMessage
                            className="err"
                            message={formik.errors.firstName}
                            />
                        ) : null}
                </div>
                <div className="text-field-wrapper">
                    <Input
                        type="text" className="input-field"
                        placeholder={`${string.lastName} *`}
                        name="lastName"
                        onChange={formik.handleChange}
                        value={formik.values.lastName}
                    />
                    {formik.errors.lastName ? (
                        <FormHelperMessage
                        className="err"
                        message={formik.errors.lastName}
                        />
                    ) : null}
                </div>
            </div>

            <div className="text-field-wrap d-flex justify-content-between">
                <div className="text-field-wrapper">
                <Input type="text" className="input-field"
                    placeholder={`${string.cellNo} *`}
                    name="cellNo"
                    onChange={formik.handleChange}
                    value={formik.values.cellNo}
                    />
                    {formik.errors.cellNo ? (
                        <FormHelperMessage
                        className="err"
                        message={formik.errors.cellNo}
                        />
                    ) : null}
                </div>
                <div className="text-field-wrapper">
                    <Input
                        type="email" className="input-field"
                        placeholder={`${string.login.email} *`}
                        name="email"
                        onChange={formik.handleChange}
                        value={formik.values.email}
                    />
                    {formik.errors.email ? (
                        <FormHelperMessage
                        className="err"
                        message={formik.errors.email}
                        />
                    ) : null}
                </div>
            </div>
            <div className="text-field-wrap d-flex justify-content-between">
                <div className="text-field-wrapper">
                    <Input type="text" className="input-field"
                        placeholder={`${string.role} *`}
                        name="role"
                        onChange={formik.handleChange}
                            value={formik.values.role}
                        />
                        {formik.errors.role ? (
                            <FormHelperMessage
                            className="err"
                            message={formik.errors.role}
                            />
                        ) : null}
                 </div>
                 <div className="text-field-wrapper">
                        <Input
                            type="text" className="input-field"
                            placeholder={`${string.worker.uniqueId} *`}
                            name="uniqueId"
                            onChange={formik.handleChange}
                            value={formik.values.uniqueId}
                        />
                        {formik.errors.uniqueId ? (
                            <FormHelperMessage
                            className="err"
                            message={formik.errors.uniqueId}
                            />
                        ) : null}
                 </div>
            </div>
            <div className="text-field-wrap d-flex justify-content-between">
                <div className="text-field-wrapper">
                    <Input type="password" className="input-field"
                        placeholder={`${string.login.password} *`}
                        name="password"
                        onChange={formik.handleChange}
                        value={formik.values.password}
                        />
                        {formik.errors.password ? (
                            <FormHelperMessage
                            className="err"
                            message={formik.errors.password}
                            />
                        ) : null}
                </div>
                <div className="text-field-wrapper">
                        <Input
                            type="text" className="input-field"
                            placeholder={`${string.isActive} *`}
                            name="isActive"
                            onChange={formik.handleChange}
                            value={formik.values.isActive}
                        />
                        {formik.errors.isActive ? (
                            <FormHelperMessage
                            className="err"
                            message={formik.errors.isActive}
                            />
                        ) : null}
                </div>
            </div>
            <div className="text-field-wrap d-flex justify-content-between">
            <Button  onClick={toggle} type="submit" className="input-field workers-btn">{string.save}</Button>
            <Button  onClick={toggle}  className="input-field workers-btn">{string.cancel}</Button>
            </div>

          </form>
          </ModalBody>
          </Modal>
        </div>
    )
};
export default CreateWorker;
