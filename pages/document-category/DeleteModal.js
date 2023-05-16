// updated
import Button from "../../components/common/form-elements/button/Button";
import string from "../../utils/LanguageTranslation.js";

function DeleteModal({ onDeleteEntry }) {
  if (typeof window === "undefined") {
    return null;
  } else {
    return (
      <div className="modal-dialog modal-md" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <Button
              className="close"
              type="button"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">×</span>
            </Button>
          </div>
          <div className="modal-body text-center mb-5">
            <p>
              <strong>{string.deleteRecordTxt}</strong>
            </p>
            <Button
              className="btn btn-primary large-btn"
              type="button"
              data-dismiss="modal"
              onClick={onDeleteEntry}
            >
              {string.deleteBtnTxt}
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

DeleteModal.propTypes = {};

DeleteModal.defaultProps = {};

export default DeleteModal;
