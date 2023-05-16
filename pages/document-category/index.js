import PropTypes from 'prop-types'
import DeleteModal from './DeleteModal'
import AddModal from './AddModal'
import EditModal from './EditModal'
import NProgress from 'nprogress'
import notify from '../../lib/notifier'
import string from '../../utils/LanguageTranslation.js'
import withAuth from '../../lib/withAuth'
import { fetchDocumentCategories, addDocumentCategory, removeDocumentCategory, updateDocumentCategory } from '../../lib/api/document-category'
import Button from '../../components/common/form-elements/button/Button'
import Input from '../../components/common/form-elements/input/Input'

class DocumentCategoryPage extends React.Component {
    static getInitialProps() {
        const documentCategoryPage = true
        return { documentCategoryPage }
    }

    static propTypes = {
        user: PropTypes.shape({
            id: PropTypes.string,
        }),
    }

    static defaultProps = {
        user: null,
        document_category: {},
    }

    async componentDidMount() {
        NProgress.start()
        try {
            const document_categories = await fetchDocumentCategories()
            // const documents = await fetchEvent();
            this.setState({ document_categories })
            NProgress.done()
        } catch (err) {
            this.setState({ loading: false, error: err.message || err.toString() }) // eslint-disable-line
            NProgress.done()
        }
    }

    constructor(props) {
        super(props)

        this.state = {
            user: props.user || {},
            document_categories: [],
            document_category: {},
            deleteMode: '',
            selectedIndex: '',
            editMode: '',
        }
    }

    // submit category function to check submitted details
    onCategorySubmit = (e) => {
        e.preventDefault()
        const { document_category } = this.state
        const { name } = document_category

        if (!name) {
            notify(string.categoryNameRequired)
            return
        }

        this.addCategory(document_category)
    }

    // Function to delete entry from popup
    onDeleteEntry = async (e) => {
        e.preventDefault()
        let { deleteMode, document_categories, documents, selectedIndex } = this.state
        // check which category to delete
        if (deleteMode == 'document') {
            // delete document data
            let documents_data = documents[selectedIndex]
            await removeEvents({ id: documents_data.id })
            documents.splice(selectedIndex, 1)
            this.setState({ documents })
            notify(string.eventDeleteSuccessNot)
        } else if (deleteMode == 'document_category') {
            // delete document category data
            let category = document_categories[selectedIndex]
            await removeDocumentCategory({ id: category.id })
            document_categories.splice(selectedIndex, 1)
            this.setState({ document_categories })
            notify(category.category.categoryDelSuccess)
        }
    }

    // add document category function
    addCategory = async (data) => {
        NProgress.start()
        try {
            const category = await addDocumentCategory({ name: data.name })
            let { document_categories } = this.state
            document_categories.push(category)
            this.setState({ document_categories, document_category: {} })
            notify(string.category.categoryAddSuccess)
            NProgress.done()
        } catch (err) {
            console.error(err)
            notify(category.category.errorAddCategory)
            NProgress.done()
        }
    }

    // update document category function
    updateCategory = async () => {
        NProgress.start()
        let { document_category, selectedIndex } = this.state
        try {
            await updateDocumentCategory(document_category)
            let { document_categories } = this.state
            document_categories[selectedIndex] = document_category
            this.setState({ document_categories, document_category: {} })
            notify(string.category.categoryUpdate)
            NProgress.done()
        } catch (err) {
            console.error(err)
            notify(string.category.errorAddCategory)
            NProgress.done()
        }
    }

    // set delete mode upon selecting delete icon
    setDeleteMode = (mode, i) => {
        if (mode) {
            this.setState({ deleteMode: mode })
            this.setState({ selectedIndex: i })
            $('#deleteModal').modal('show')
        }
    }

    setEditMode = (mode, i) => {
        if (mode) {
            this.setState({ editMode: mode })
            this.setState({ selectedIndex: i })
            if (mode == 'document') {
                let { documents } = this.state
                let document = documents[i]
                this.setState({ document })
                $('#editEventsModal').modal('show')
            } else if (mode == 'document_category') {
                let { document_categories } = this.state
                let document_category = document_categories[i]
                this.setState({ document_category })
                $('#editDocumentCategoryModal').modal('show')
            }
        }
    }

    render() {
        const { user, document_categories, document_category } = this.state
        return (
            <div>
                <div className='container-fluid'>
                    <div className='row d-flex project-listing'>
                        <div className='tab-pane fade show active mt-3 w-100' id='document_category' role='tabpanel' aria-labelledby='document-listing'>
                            <div className='col-md-12 add-project d-flex align-items-center justify-content-between p-0 document-filter '>
                                <h4 className='text-dark'>{string.participant.categoryListing}</h4>
                                <Button className='btn btn-primary large-btn' data-toggle='modal' data-target='#documentCategoryModal'>
                                    {string.submitCatBtn}
                                </Button>
                            </div>
                            <div className='project-table-listing table-responsive mt-2 w-100'>
                                <table className='table'>
                                    <thead className='thead-dark'>
                                        <tr>
                                            <th scope='col'>#</th>
                                            <th scope='col'>{string.tableColName}</th>
                                            <th scope='col'></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {document_categories.map((category, i) => {
                                            return (
                                                <tr key={i}>
                                                    <td>{i + 1}</td>
                                                    <td>{category.name}</td>
                                                    <td>
                                                        <i className='fa fa-pencil-alt' onClick={() => this.setEditMode('document_category', i)}></i>
                                                        <i className='fa fa-trash' onClick={() => this.setDeleteMode('document_category', i)}></i>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {document_categories.length == 0 && (
                                            <tr>
                                                <td colSpan='3' className='text-center'>
                                                    {string.noData}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='modal fade customModal document' id='deleteModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                    <DeleteModal onDeleteEntry={this.onDeleteEntry} />
                </div>
                {/* ADD document popup */}
                <div className='modal fade customModal document' id='documentModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                    <div className='modal-dialog modal-lg' role='document'>
                        <div className='modal-content'>
                            <div className='modal-header'>
                                <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                                    {string.doc}
                                </h5>
                                <Button className='close' type='button' data-dismiss='modal' aria-label='Close'>
                                    <span aria-hidden='true'>×</span>
                                </Button>
                            </div>
                            <div className='modal-body'>
                                {/* form secction */}
                                <form className='form-container'>
                                    {/* row */}
                                    <div className='row ml-0 mr-0 content-block'>
                                        <div className='col-md-6'>
                                            <div className='form-group'>
                                                <label htmlFor='email_address' className='col-md-12 col-form-label pl-0'>
                                                    {string.newDocType}
                                                </label>
                                                <div className='col-md-12 position-relative pl-0 pr-0 d-flex'>
                                                    <div className='selected-value form-control'>
                                                        <span className='seleted-text'>{string.typeDoctype}</span>
                                                        <i className='fas fa-angle-down fa-sm'></i>
                                                    </div>
                                                    {/* dropdown */}
                                                    <div className='drop-content full-width'>
                                                        <div className='tab-content' id='myTabContent'>
                                                            <Input type='text' placeholder={string.typeDoc} id='myInput' />
                                                            <a href='#about'>1 </a>
                                                            <a href='#base'>2 </a>
                                                            <a href='#blog'>3</a>
                                                            <a href='#contact'>4</a>
                                                            <a href='#custom'>5 </a>
                                                            <a href='#support'>6</a>
                                                            <a href='#tools'>7</a>
                                                        </div>
                                                    </div>
                                                    {/* add btn */}
                                                    <div className='add-btn'>
                                                        <Button className='btn'>
                                                            <i className='fas fa-plus fa-sm'></i>
                                                        </Button>
                                                    </div>
                                                    {/* //add btn */}
                                                </div>
                                            </div>
                                        </div>

                                        <div className='col-md-6'>
                                            <div className='form-group'>
                                                <label htmlFor='email_address' className='col-md-12 col-form-label pl-0'>
                                                    {string.deleteDoctype}
                                                </label>
                                                <div className='col-md-12 position-relative pl-0 pr-0 d-flex'>
                                                    <div className='selected-value form-control'>
                                                        <span className='seleted-text'>{string.csnuNo}</span>
                                                        <i className='fas fa-angle-down fa-sm'></i>
                                                    </div>
                                                    {/* dropdown */}
                                                    <div className='drop-content full-width'>
                                                        <div className='tab-content' id='myTabContent'>
                                                            <Input type='text' placeholder={string.typeDoc} id='myInput' />
                                                            <a href='#about'>1 </a>
                                                            <a href='#base'>2 </a>
                                                            <a href='#blog'>3</a>
                                                            <a href='#contact'>4</a>
                                                            <a href='#custom'>5 </a>
                                                            <a href='#support'>6</a>
                                                            <a href='#tools'>7</a>
                                                        </div>
                                                    </div>
                                                    {/* add btn */}
                                                    <div className='add-btn'>
                                                        <Button className='btn'>
                                                            <i className='fas fa-minus fa-sm'></i>
                                                        </Button>
                                                    </div>
                                                    {/* //add btn */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* //row */}

                                    {/* row */}
                                    <div className='row ml-0 mr-0 content-block'>
                                        <div className='col-md-6'>
                                            <div className='form-group'>
                                                <label htmlFor='email_address' className='col-md-12 col-form-label pl-0'>
                                                    {string.newcategory}
                                                </label>
                                                <div className='col-md-12 position-relative pl-0 pr-0 d-flex'>
                                                    <div className='selected-value form-control'>
                                                        <span className='seleted-text'>{string.typeCategoryName}</span>
                                                        <i className='fas fa-angle-down fa-sm'></i>
                                                    </div>
                                                    {/* dropdown */}
                                                    <div className='drop-content full-width'>
                                                        <div className='tab-content' id='myTabContent'>
                                                            <Input type='text' placeholder={string.typeDoc} id='myInput' />
                                                            <a href='#about'>1 </a>
                                                            <a href='#base'>2 </a>
                                                            <a href='#blog'>3</a>
                                                            <a href='#contact'>4</a>
                                                            <a href='#custom'>5 </a>
                                                            <a href='#support'>6</a>
                                                            <a href='#tools'>7</a>
                                                        </div>
                                                    </div>
                                                    {/* add btn */}
                                                    <div className='add-btn'>
                                                        <Button className='btn'>
                                                            <i className='fas fa-plus fa-sm'></i>
                                                        </Button>
                                                    </div>
                                                    {/* //add btn */}
                                                </div>
                                            </div>
                                        </div>

                                        <div className='col-md-6'>
                                            <div className='form-group'>
                                                <label htmlFor='email_address' className='col-md-12 col-form-label pl-0'>
                                                    {string.selectCategory}
                                                </label>
                                                <div className='col-md-12 position-relative pl-0 pr-0 d-flex'>
                                                    <div className='selected-value form-control'>
                                                        <span className='seleted-text'>{string.csnuNo}</span>
                                                        <i className='fas fa-angle-down fa-sm'></i>
                                                    </div>
                                                    {/* dropdown */}
                                                    <div className='drop-content full-width'>
                                                        <div className='tab-content' id='myTabContent'>
                                                            <Input type='text' placeholder={string.typeDoc} id='myInput' />
                                                            <a href='#about'>1 </a>
                                                            <a href='#base'>2 </a>
                                                            <a href='#blog'>3</a>
                                                            <a href='#contact'>4</a>
                                                            <a href='#custom'>5 </a>
                                                            <a href='#support'>6</a>
                                                            <a href='#tools'>7</a>
                                                        </div>
                                                    </div>
                                                    {/* add btn */}
                                                    <div className='add-btn'></div>
                                                    {/* //add btn */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* //row */}

                                    {/* row */}
                                    <div className='row ml-0 mr-0 content-block'>
                                        <div className='col-md-6'>
                                            <div className='form-group'>
                                                <label htmlFor='email_address' className='col-md-12 col-form-label pl-0'>
                                                    {string.addDocTypeCategory}
                                                </label>
                                                <div className='col-md-12 position-relative pl-0 pr-0 d-flex'>
                                                    <div className='selected-value form-control'>
                                                        <span className='seleted-text'>{string.typeDoctypeName}</span>
                                                        <i className='fas fa-angle-down fa-sm'></i>
                                                    </div>
                                                    {/* dropdown */}
                                                    <div className='drop-content full-width'>
                                                        <div className='tab-content' id='myTabContent'>
                                                            <Input type='text' placeholder={string.typeDoc} id='myInput' />
                                                            <a href='#about'>1 </a>
                                                            <a href='#base'>2 </a>
                                                            <a href='#blog'>3</a>
                                                            <a href='#contact'>4</a>
                                                            <a href='#custom'>5 </a>
                                                            <a href='#support'>6</a>
                                                            <a href='#tools'>7</a>
                                                        </div>
                                                    </div>
                                                    {/* add btn */}
                                                    <div className='add-btn'>
                                                        <Button className='btn'>
                                                            <i className='fas fa-plus fa-sm'></i>
                                                        </Button>
                                                    </div>
                                                    {/* //add btn */}
                                                </div>
                                            </div>
                                        </div>

                                        <div className='col-md-6'>
                                            <div className='form-group'>
                                                <label htmlFor='email_address' className='col-md-12 col-form-label pl-0'>
                                                    {string.addDocType}
                                                </label>
                                                <div className='col-md-12 position-relative pl-0 pr-0 d-flex'>
                                                    <div className='selected-value form-control'>
                                                        <span className='seleted-text'>{string.doctypeName}</span>
                                                        <i className='fas fa-angle-down fa-sm'></i>
                                                    </div>
                                                    {/* dropdown */}
                                                    <div className='drop-content full-width'>
                                                        <div className='tab-content' id='myTabContent'>
                                                            <Input type='text' placeholder={string.typeDoc} id='myInput' />
                                                            <a href='#about'>1 </a>
                                                            <a href='#base'>2 </a>
                                                            <a href='#blog'>3</a>
                                                            <a href='#contact'>4</a>
                                                            <a href='#custom'>5 </a>
                                                            <a href='#support'>6</a>
                                                            <a href='#tools'>7</a>
                                                        </div>
                                                    </div>
                                                    {/* add btn */}
                                                    <div className='add-btn'></div>
                                                    {/* //add btn */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* //row */}
                                </form>
                                {/* //form secction */}
                            </div>
                            <div className='modal-footer'>
                                <Button className='btn btn-primary large-btn' type='button' data-dismiss='modal'>
                                    {string.saveCategory}
                                </Button>
                                <Button className='btn btn-secondary large-btn' type='button' data-dismiss='modal'>
                                    {string.deletecategory}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* //ADD document popup */}

                {/* ADD document popup */}
                <div className='modal fade customModal document' id='eventModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                    <div className='modal-dialog modal-lg' role='document'>
                        <div className='modal-content'>
                            <div className='modal-header'>
                                <h5 className='modal-title text-dark font-weight-bold' id='exampleModalLabel'>
                                    {string.events}
                                </h5>
                                <Button className='close' type='button' data-dismiss='modal' aria-label='Close'>
                                    <span aria-hidden='true'>×</span>
                                </Button>
                            </div>
                            <div className='modal-body'>
                                {/* form secction */}
                                <form className='form-container'>
                                    {/* row */}
                                    <div className='row ml-0 mr-0 content-block'>
                                        <div className='col-md-6'>
                                            <div className='form-group'>
                                                <label htmlFor='email_address' className='col-md-12 col-form-label pl-0'>
                                                    {string.newDoc}
                                                </label>
                                                <div className='col-md-12 position-relative pl-0 pr-0 d-flex'>
                                                    <div className='selected-value form-control'>
                                                        <span className='seleted-text'>{string.typeDoc}</span>
                                                        <i className='fas fa-angle-down fa-sm'></i>
                                                    </div>
                                                    {/* dropdown */}
                                                    <div className='drop-content full-width'>
                                                        <div className='tab-content' id='myTabContent'>
                                                            <Input type='text' placeholder={string.typeDoc} id='myInput' />
                                                            <a href='#about'>1 </a>
                                                            <a href='#base'>2 </a>
                                                            <a href='#blog'>3</a>
                                                            <a href='#contact'>4</a>
                                                            <a href='#custom'>5 </a>
                                                            <a href='#support'>6</a>
                                                            <a href='#tools'>7</a>
                                                        </div>
                                                    </div>
                                                    {/* add btn */}
                                                    <div className='add-btn'>
                                                        <Button className='btn'>
                                                            <i className='fas fa-plus fa-sm'></i>
                                                        </Button>
                                                    </div>
                                                    {/* //add btn */}
                                                </div>
                                            </div>
                                        </div>

                                        <div className='col-md-6'>
                                            <div className='form-group'>
                                                <label htmlFor='email_address' className='col-md-12 col-form-label pl-0'>
                                                    {string.deleteDoc}
                                                </label>
                                                <div className='col-md-12 position-relative pl-0 pr-0 d-flex'>
                                                    <div className='selected-value form-control'>
                                                        <span className='seleted-text'>{string.csnuNo}</span>
                                                        <i className='fas fa-angle-down fa-sm'></i>
                                                    </div>
                                                    {/* dropdown */}
                                                    <div className='drop-content full-width'>
                                                        <div className='tab-content' id='myTabContent'>
                                                            <Input type='text' placeholder={string.typeDoc} id='myInput' />
                                                            <a href='#about'>1 </a>
                                                            <a href='#base'>2 </a>
                                                            <a href='#blog'>3</a>
                                                            <a href='#contact'>4</a>
                                                            <a href='#custom'>5 </a>
                                                            <a href='#support'>6</a>
                                                            <a href='#tools'>7</a>
                                                        </div>
                                                    </div>
                                                    {/* add btn */}
                                                    <div className='add-btn'>
                                                        <Button className='btn'>
                                                            <i className='fas fa-minus fa-sm'></i>
                                                        </Button>
                                                    </div>
                                                    {/* //add btn */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* //row */}

                                    {/* row */}
                                    <div className='row ml-0 mr-0 content-block'>
                                        <div className='col-md-6'>
                                            <div className='form-group'>
                                                <label htmlFor='email_address' className='col-md-12 col-form-label pl-0'>
                                                    {string.newcategory}
                                                </label>
                                                <div className='col-md-12 position-relative pl-0 pr-0 d-flex'>
                                                    <div className='selected-value form-control'>
                                                        <span className='seleted-text'>{string.typeCategoryName}</span>
                                                        <i className='fas fa-angle-down fa-sm'></i>
                                                    </div>
                                                    {/* dropdown */}
                                                    <div className='drop-content full-width'>
                                                        <div className='tab-content' id='myTabContent'>
                                                            <Input type='text' placeholder={string.typeDoc} id='myInput' />
                                                            <a href='#about'>1 </a>
                                                            <a href='#base'>2 </a>
                                                            <a href='#blog'>3</a>
                                                            <a href='#contact'>4</a>
                                                            <a href='#custom'>5 </a>
                                                            <a href='#support'>6</a>
                                                            <a href='#tools'>7</a>
                                                        </div>
                                                    </div>
                                                    {/* add btn */}
                                                    <div className='add-btn'>
                                                        <Button className='btn'>
                                                            <i className='fas fa-plus fa-sm'></i>
                                                        </Button>
                                                    </div>
                                                    {/* //add btn */}
                                                </div>
                                            </div>
                                        </div>

                                        <div className='col-md-6'>
                                            <div className='form-group'>
                                                <label htmlFor='email_address' className='col-md-12 col-form-label pl-0'>
                                                    {string.selectCategory}
                                                </label>
                                                <div className='col-md-12 position-relative pl-0 pr-0 d-flex'>
                                                    <div className='selected-value form-control'>
                                                        <span className='seleted-text'>{string.csnuNo}</span>
                                                        <i className='fas fa-angle-down fa-sm'></i>
                                                    </div>
                                                    {/* dropdown */}
                                                    <div className='drop-content full-width'>
                                                        <div className='tab-content' id='myTabContent'>
                                                            <Input type='text' placeholder={string.typeDoc} id='myInput' />
                                                            <a href='#about'>1 </a>
                                                            <a href='#base'>2 </a>
                                                            <a href='#blog'>3</a>
                                                            <a href='#contact'>4</a>
                                                            <a href='#custom'>5 </a>
                                                            <a href='#support'>6</a>
                                                            <a href='#tools'>7</a>
                                                        </div>
                                                    </div>
                                                    {/* add btn */}
                                                    <div className='add-btn'></div>
                                                    {/* //add btn */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* //row */}

                                    {/* row */}
                                    <div className='row ml-0 mr-0 content-block'>
                                        <div className='col-md-6'>
                                            <div className='form-group'>
                                                <label htmlFor='email_address' className='col-md-12 col-form-label pl-0'>
                                                    {string.addDocTypeCategory}
                                                </label>
                                                <div className='col-md-12 position-relative pl-0 pr-0 d-flex'>
                                                    <div className='selected-value form-control'>
                                                        <span className='seleted-text'>{string.typeDoc}</span>
                                                        <i className='fas fa-angle-down fa-sm'></i>
                                                    </div>
                                                    {/* dropdown */}
                                                    <div className='drop-content full-width'>
                                                        <div className='tab-content' id='myTabContent'>
                                                            <Input type='text' placeholder={string.typeDoc} id='myInput' />
                                                            <a href='#about'>1 </a>
                                                            <a href='#base'>2 </a>
                                                            <a href='#blog'>3</a>
                                                            <a href='#contact'>4</a>
                                                            <a href='#custom'>5 </a>
                                                            <a href='#support'>6</a>
                                                            <a href='#tools'>7</a>
                                                        </div>
                                                    </div>
                                                    {/* add btn */}
                                                    <div className='add-btn'>
                                                        <Button className='btn'>
                                                            <i className='fas fa-plus fa-sm'></i>
                                                        </Button>
                                                    </div>
                                                    {/* //add btn */}
                                                </div>
                                            </div>
                                        </div>

                                        <div className='col-md-6'>
                                            <div className='form-group'>
                                                <label htmlFor='email_address' className='col-md-12 col-form-label pl-0'>
                                                    {string.addDoc}
                                                </label>
                                                <div className='col-md-12 position-relative pl-0 pr-0 d-flex'>
                                                    <div className='selected-value form-control'>
                                                        <span className='seleted-text'>{string.eventNameTxt}</span>
                                                        <i className='fas fa-angle-down fa-sm'></i>
                                                    </div>
                                                    {/* dropdown */}
                                                    <div className='drop-content full-width'>
                                                        <div className='tab-content' id='myTabContent'>
                                                            <Input type='text' placeholder={string.typeDoc} id='myInput' />
                                                            <a href='#about'>1 </a>
                                                            <a href='#base'>2 </a>
                                                            <a href='#blog'>3</a>
                                                            <a href='#contact'>4</a>
                                                            <a href='#custom'>5 </a>
                                                            <a href='#support'>6</a>
                                                            <a href='#tools'>7</a>
                                                        </div>
                                                    </div>
                                                    {/* add btn */}
                                                    <div className='add-btn'></div>
                                                    {/* //add btn */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* //row */}
                                </form>
                                {/* //form secction */}
                            </div>
                            <div className='modal-footer'>
                                <Button className='btn btn-primary large-btn' type='button' data-dismiss='modal'>
                                    {string.saveCategory}
                                </Button>
                                <Button className='btn btn-secondary large-btn' type='button' data-dismiss='modal'>
                                    {string.deletecategory}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                {/* //ADD document popup */}
                <div className='modal fade customModal document' id='documentCategoryModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                    <AddModal state={this.setState.bind(this)} onCategorySubmit={this.onCategorySubmit.bind(this)} />
                </div>
                <div className='modal fade customModal document' id='editDocumentCategoryModal' tabIndex='-1' role='dialog' aria-labelledby='exampleModalLabel' aria-hidden='true'>
                    <EditModal document_category={document_category} state={this.setState.bind(this)} updateCategory={this.updateCategory.bind(this)} />
                </div>
            </div>
        )
    }
}

export default withAuth(DocumentCategoryPage, { loginRequired: true })
