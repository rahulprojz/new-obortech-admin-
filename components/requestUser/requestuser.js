import { Formik, Form, Field } from "formik";
import React, { useState } from "react";
import * as Yup from "yup";
import FormHelperMessage from "../../components/common/form-elements/formHelperMessage";
import string from "../../utils/LanguageTranslation.js";
import AdvanceSelect from "../../components/common/form-elements/select/AdvanceSelect";
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import LoaderButton from "../../components/common/form-elements/button/LoaderButton";
import { requestUserData } from "../../lib/api/network-api";
import notify from "../../lib/notifier";

const AddGroupschema = Yup.object().shape({
    users: Yup.string().required(`${string.requestUser} ${string.errors.required}`),
    purpose: Yup.string().required(`${string.requestpurpose} ${string.errors.required}`),
});


function RequestUser({ requestuserModal, toggle, userslist, purposelist }) {

    const [submitBtnDisable, setSubmitBtnDisable] = useState(false);
    const [username, setUsername] = useState(false);

    if (typeof window === "undefined") {
        return null;
    } else {
        return (
            <Modal isOpen={requestuserModal} toggle={toggle} className="customModal">
                <ModalHeader toggle={toggle}>
                    <h5 className="modal-title text-dark font-weight-bold" id="exampleModalLabel"> {string.requestUserListHeading} </h5>
                </ModalHeader>
                <ModalBody className="text-center mb-5">
                    <Formik
                        enableReinitialize={true}
                        initialValues={{
                            users: "",
                            purpose: ""
                        }}
                        validationSchema={AddGroupschema}
                        onSubmit={async (values) => {
                            setSubmitBtnDisable(true)
                            let accessdata = { "userName": "appUser" };
                            let resp = await GetAccess(accessdata);
                            if (resp.code == '200') {
                                let reqpath = '/create-user-data-request';
                                const headers = {
                                    "Authorization": 'Bearer ' + resp.data
                                }
                                const data = {
                                    "userid": "OBO123",
                                    "purpose": values.purpose,
                                    "validity": "10d",
                                    "processorid": "eDUwOTo6Q049YXBwVXNlcixPVT1jbGllbnQrT1U9b3JnMStPVT1kZXBhcnRtZW50MTo6Q049Y2Eub3JnMS5leGFtcGxlLmNvbSxPPW9yZzEuZXhhbXBsZS5jb20sTD1EdXJoYW0sU1Q9Tm9ydGggQ2Fyb2xpbmEsQz1VUw=="
                                }
                                let userresp = await SendUserData(reqpath, headers, data);
                                if (userresp.code == '200') {
                                    notify(string.projectusersuccess);
                                    setSubmitBtnDisable(false);
                                    toggle();
                                } else {
                                    notify(string.projectuserfailure)
                                    setSubmitBtnDisable(false);
                                    toggle();
                                }
                            } else {
                                notify(string.projectuserfailure)
                                setSubmitBtnDisable(false);
                                toggle();
                            }
                        }}>
                        {({ setFieldValue, errors, touched, handleChange, handleSubmit, values }) => (
                            <form className="form-container" onSubmit={handleSubmit}>
                                <div className="row ml-0 mr-0 content-block">
                                    <div className="form-group col-md-12 p-0 alignleft">
                                        <label
                                            htmlFor="groupID"
                                            className="col-md-12 col-form-label pl-0">
                                            {string.requestUser}
                                        </label>
                                        <AdvanceSelect
                                            className="basic-single"
                                            classNamePrefix="select"
                                            isSearchable={true}
                                            name="users"
                                            options={userslist}
                                            onChange={(val) => {
                                                let label = val.label.split(' ');
                                                setFieldValue("users", val.value);
                                                setUsername(label[0])
                                            }}
                                        />
                                        {(() => {
                                            if (errors.users && touched.users) {
                                                return <FormHelperMessage
                                                    message={errors.users}
                                                    className="error"
                                                />
                                            }
                                        })()}
                                    </div>
                                    <div className="form-group col-md-12 p-0 alignleft">
                                        <label
                                            htmlFor="purpose"
                                            className="col-md-12 col-form-label pl-0">
                                            {string.requestpurpose}
                                        </label>
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
                                        isLoading={submitBtnDisable}
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

RequestUser.propTypes = {};
RequestUser.defaultProps = {};

export default RequestUser;
