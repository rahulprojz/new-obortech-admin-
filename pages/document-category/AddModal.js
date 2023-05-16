// updated
import Button from "../../components/common/form-elements/button/Button";
import Input from "../../components/common/form-elements/input/Input";
import string from "../../utils/LanguageTranslation.js";

function AddModal({ state, onCategorySubmit }) {
  if (typeof window === "undefined") {
    return null;
  } else {
    return (
      <div className="modal-dialog modal-md" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5
              className="modal-title text-dark font-weight-bold"
              id="exampleModalLabel"
            >
              {string.category.addCategory}
            </h5>
            <Button
              className="close"
              type="button"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">×</span>
            </Button>
          </div>
          <form onSubmit={onCategorySubmit}>
            <div className="modal-body">
              <div className="row ml-0 mr-0 content-block">
                <div className="form-group col-md-12 p-0">
                  <label
                    htmlFor="name"
                    className="col-md-12 col-form-label pl-0"
                  >
                    {string.categoryName}
                  </label>
                  <Input
                    type="text"
                    name="name"
                    id="name"
                    className="form-control"
                    placeholder={string.categoryName}
                    onChange={(document) => {
                      state({
                        document_category: Object.assign(
                          {},
                          document_category,
                          { name: document.target.value }
                        ),
                      });
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button
                data-dismiss="modal"
                onClick={onCategorySubmit}
                className="btn btn-primary large-btn"
                type="submit"
              >
                {string.insertBtnTxt}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

AddModal.propTypes = {};

AddModal.defaultProps = {};

export default AddModal;
