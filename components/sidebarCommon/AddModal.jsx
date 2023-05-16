import { values } from "lodash";
import string from "../../utils/LanguageTranslation.js";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";

const AddModal = ({ handleChange, onSubmit, isOpen, toggle, values, editMode }) => {
    if (typeof window === 'undefined') {
        return null;
    } else {
        return (
            <Modal isOpen={isOpen} toggle={toggle} className="customModal document">
                <ModalHeader toggle={toggle}>
                    <h5 className="modal-title text-dark font-weight-bold" id="exampleModalLabel">{editMode === "eventCategory" ? `${string.updateBtnTxt}` : `${string.project.add}`} {string.folder}</h5>
                </ModalHeader>
                <ModalBody>
                    <form onSubmit={onSubmit}>
                        <div className="row ml-0 mr-0 content-block">
                            <div className="form-group col-md-12 p-0">
                                <label htmlFor="name" className="col-md-12 col-form-label pl-0">{string.folderName}</label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    className="form-control"
                                    placeholder={string.tableColName}
                                // onChange={handleChange}
                                />
                            </div>
                        </div>
                        <ModalFooter>
                            <button data-dismiss="modal" onClick={onSubmit} className="btn btn-primary large-btn" type="submit">{editMode === "eventCategory" ? `${string.updateBtnTxt}` : `${string.insertBtnTxt}`}</button>
                        </ModalFooter>
                    </form>
                </ModalBody>
            </Modal>
        );
    }
}

AddModal.propTypes = {

};

AddModal.defaultProps = {

};

export default AddModal;
