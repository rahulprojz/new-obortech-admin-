import { Formik } from "formik";
import React, { useState } from "react";
import * as Yup from "yup";
import FormHelperMessage from "../../../components/common/form-elements/formHelperMessage";
import string from "../../../utils/LanguageTranslation.js";
import AdvanceSelect from "../../../components/common/form-elements/select/AdvanceSelect";
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import LoaderButton from "../../../components/common/form-elements/button/LoaderButton";

const AddGroupschema = Yup.object().shape({
    user: Yup.string().required(`${string.userDataRequest.requestUser} ${string.errors.required}`),
    purpose: Yup.string().required(`${string.userDataRequest.requestpurpose} ${string.errors.required}`),
});

function RequestUserData({ isOpen, toggle, userslist, purposelist, handleSubmit, isLoading }) {

    const [username, setUsername] = useState(false);

    if (typeof window === "undefined") {
        return null;
    } else {
        return (
            <Modal isOpen={isOpen} toggle={toggle} className="customModal">
                <ModalHeader toggle={toggle} cssModule={{'modal-title': 'modal-title text-dark font-weight-bold'}}>
                    {string.userDataRequest.requestUserListHeading}
                </ModalHeader>
                <ModalBody className="text-center">
                    <Formik
                        enableReinitialize={true}
                        initialValues={{
                            user: "",
                            purpose: ""
                        }}
                        validationSchema={AddGroupschema}
                        onSubmit={async (values) => {
                            await handleSubmit(values);
                        }}>
                        {({ setFieldValue, errors, touched, handleChange, handleSubmit, values }) => (
                            <form className="form-container" onSubmit={handleSubmit}>
                                <div className="row ml-0 mr-0 content-block">
                                    <div className="form-group col-md-12 p-0 alignleft">
                                        <label
                                            htmlFor="user"
                                            className="col-md-12 col-form-label pl-0">
                                            {string.userDataRequest.requestUser}
                                        </label>
                                        <AdvanceSelect
                                            className="basic-single"
                                            classNamePrefix="select"
                                            isSearchable={true}
                                            name="user"
                                            options={userslist}
                                            onChange={(val) => {
                                                let label = val.label.split(' ');
                                                setFieldValue("user", val.value);
                                                setUsername(label[0])
                                            }}
                                        />
                                        {(() => {
                                            if (errors.user && touched.user) {
                                                return <FormHelperMessage
                                                    message={errors.user}
                                                    className="error"
                                                />
                                            }
                                        })()}
                                    </div>
                                    <div className="form-group col-md-12 p-0 alignleft">
                                        <label htmlFor="purpose" className="col-md-12 col-form-label pl-0">{string.userDataRequest.requestpurpose}</label>
                                        <AdvanceSelect
                                            id="purpose"
                                            isClearable={false}
                                            isSearchable={false}
                                            name="purpose"
                                            options={purposelist}
                                            onChange={(val) => {
                                                setFieldValue("purpose", val.value);
                                            }}
                                        />

                                        {(() => {
                                            if (errors.purpose && touched.purpose) {
                                                return <FormHelperMessage
                                                    message={errors.purpose}
                                                    className="error"
                                                />
                                            }
                                        })()}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <LoaderButton
                                        cssClass="btn btn-primary large-btn"
                                        type="submit"
                                        isLoading={isLoading}
                                        text={string.submitBtnTxt}
                                    />
                                </div>
                            </form>
                        )}
                    </Formik>
                </ModalBody>
            </Modal>
        );
    }
}

RequestUserData.propTypes = {};
RequestUserData.defaultProps = {};

export default RequestUserData;
