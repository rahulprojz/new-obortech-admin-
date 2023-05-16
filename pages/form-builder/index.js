import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Modal, ModalBody, ModalHeader, ModalFooter, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { ReactFormBuilder, ReactFormGenerator } from 'chaincodedev-form-builder'
import { useDispatch, useSelector } from 'react-redux'
import Button from '../../components/common/form-elements/button/Button'
import Input from '../../components/common/form-elements/input/Input'
import string from '../../utils/LanguageTranslation.js'
import withAuth from '../../lib/withAuth'
import notify from '../../lib/notifier'
import { addForm, getFormById, getFormListByUserId, updateForm, deleteForm, clearForm } from '../../redux/actions/formReducer'
import { addFormData } from '../../lib/api/formBuilder'
import 'chaincodedev-form-builder/dist/app.css'
import './form-builder.css'
import LoaderButton from '../../components/common/form-elements/button/LoaderButton'
import DeleteModal from '../../components/common/DeleteModal'
import NProgress from 'nprogress'
import { getRootUrl } from '../../lib/api/getRootUrl'

const items = [
    {
        key: 'Header',
    },
    {
        key: 'Footer',
    },
    {
        key: 'Paragraph',
    },
    {
        key: 'TextInput',
    },
    {
        key: 'NumberInput',
    },
    {
        key: 'TextArea',
    },
    {
        key: 'RadioButtons',
    },
    {
        key: 'Checkboxes',
    },
    {
        key: 'Image',
    },
    {
        key: 'Range',
    },
    {
        key: 'IotOn',
    },
    {
        key: 'IotOff',
    },
    {
        key: 'LineBreak',
    },
    {
        key: 'Tags',
    },
    {
        key: 'Dropdown',
    },
    {
        key: 'TwoColumnRow',
    },
    {
        key: 'ThreeColumnRow',
    },
    {
        key: 'FourColumnRow',
    },
    {
        key: 'FileUpload',
    },
    {
        key: 'Signature',
    },
    {
        key: 'TransferAsset',
    },
    {
        key: 'CreateAsset',
    },
    {
        key: 'RemoveAsset',
    },
]

const FormBuilder = (props) => {
    const { user } = props
    const [isPreviewForm, setIsPreviewForm] = useState(false)
    const [formData, setFormData] = useState([])
    const [NameModal, setNameModal] = useState(false)
    const [updateform, setformUpdate] = useState(false)
    const [Formname, setFormname] = useState(false)
    const [selectedFormId, setSelectedFormId] = useState('new')
    const { formList, form } = useSelector((state) => state.form)
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleteModal, setIsDeleteModal] = useState(false)
    const [selectedForm, setSelectedForm] = useState('')

    const dispatch = useDispatch()
    const isUpdating = selectedFormId && selectedFormId !== 'new'

    const onPreviewClick = () => {
        setIsPreviewForm(true)
    }

    useEffect(() => {
        NProgress.start()
        dispatch(getFormListByUserId(user.organization_id))
        if (isUpdating) {
            dispatch(getFormById(selectedFormId))
        }
        NProgress.done()
    }, [dispatch, isPreviewForm, user, selectedFormId])

    const onSubmitClick = () => {
        if (isUpdating) {
            if (formData.length > 0) {
                notify(string.formBuilder.updateformname)
                dispatch(updateForm({ data: formData, id: selectedFormId }))
            }
        } else {
            setNameModal(true)
        }
    }

    const onDeleteClick = () => {
        dispatch(
            deleteForm({ id: selectedFormId }, (isDeleted) => {
                handleToggleDeleteModal()
                if (isDeleted) {
                    notify(string.formBuilder.deleteformsuccess)
                    dispatch(getFormListByUserId(user.organization_id))
                    onDropdownChange('new')
                } else {
                    notify(string.formBuilder.deleteFormErr)
                }
            }),
        )
    }

    const handleToggleDeleteModal = () => {
        if (selectedFormId && parseInt(selectedFormId)) {
            setIsDeleteModal(!isDeleteModal)
        } else {
            notify(string.formBuilder.pleaseSelectForm)
        }
    }

    const onDropdownChange = (id) => {
        const selectedForm = formList.find((form) => form.id == id)
        setSelectedForm(selectedForm?.formname || '')
        dispatch(clearForm())
        setFormData([])
        setSelectedFormId(null)
        setTimeout(function () {
            setSelectedFormId(id)
        }, 200)
    }

    const _handleAddForm = async () => {
        if (Formname != '' && !/^\s*$/.test(Formname)) {
            if (updateform) {
                _updateForm()
            } else {
                setIsLoading(true)
                const formResponse = await addFormData({
                    data: formData,
                    id: user.organization_id,
                    formname: Formname,
                })
                addForm(formResponse)
                setIsLoading(false)
                setNameModal(false)
                setFormData([])
                setSelectedFormId(null)
                setTimeout(() => {
                    setSelectedFormId('new')
                }, 200)
                dispatch(clearForm())
                notify(string.formBuilder.addformsuccess)
            }
        } else {
            notify(string.formBuilder.addNamereq)
            return false
        }
    }

    const _updateForm = () => {
        setIsLoading(true)
        const formUpdated = formData.length > 0 ? formData : form
        dispatch(
            updateForm({
                data: formUpdated,
                id: selectedFormId,
                formname: Formname,
            }),
        )
        setIsLoading(false)
        setNameModal(false)
        setformUpdate(false)
        setSelectedFormId(null)
        setFormData([])
        dispatch(getFormById(selectedFormId))
        notify(string.formBuilder.updateformname)
    }

    const formupdatename = () => {
        setformUpdate(true)
        const data = formList.filter((item) => item.id === selectedFormId)
        setNameModal(true)
        setFormname(data[0].formname)
    }

    const goBack = () => {
        setIsLoading(false)
        setNameModal(false)
        setformUpdate(false)
        setFormData([])
        setSelectedFormId(null)
    }

    const toggle = () => {
        setNameModal(false)
        setformUpdate(false)
        setIsPreviewForm(false)
    }
    return (
        <div className='container-fluid'>
            <div className='row d-flex'>
                <div className='row w-100 form-builder-tools position-relative'>
                    <UncontrolledDropdown>
                        <DropdownToggle caret>{selectedForm || string.formBuilder.selectForm}</DropdownToggle>
                        <DropdownMenu>
                            <DropdownItem key='new' onClick={() => onDropdownChange('new')}>
                                {string.formBuilder.createNewForm}
                            </DropdownItem>
                            {formList.map(({ id, formname }) => (
                                <DropdownItem key={id} onClick={() => onDropdownChange(id)}>
                                    {formname}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </UncontrolledDropdown>
                    <div className='ot-btn-form-build-absolute d-flex'>
                        {/* <div className="mr-3">
                                <i className="fas fa-caret-left"></i>
                                <Button className="btn" onClick={goBack}>
                                    {string.onboarding.btn.back}
                                </Button>
                            </div> */}
                        <div className='mr-3'>
                            <i className='far fa-eye' />
                            <Button className='btn' onClick={onPreviewClick}>
                                {string.formBuilder.preview}
                            </Button>
                        </div>
                        <div className='mr-3'>
                            <i className='fas fa-check' />
                            <Button className='btn' onClick={() => onSubmitClick()}>
                                {string.formBuilder.submit}
                            </Button>
                        </div>
                        <div className=''>
                            <i className='far fa-trash-alt' />
                            <Button className='btn' onClick={handleToggleDeleteModal}>
                                {string.formBuilder.delete}
                            </Button>
                        </div>
                    </div>
                </div>

                <div style={{ height: '809pxpx' }} className='row form-container ot-form-builder-wrapper'>
                    {selectedFormId && <ReactFormBuilder onPost={({ task_data }) => setFormData(task_data)} toolbarItems={items} style={{ minWidth: '100%' }} url={`/api/v1/create-form/${selectedFormId}`} />}
                </div>
            </div>

            {/* PREVIEW FORM MODAL */}
            <Modal size='lg' isOpen={isPreviewForm} className='customModal document'>
                <ModalHeader toggle={toggle} cssModule={{ 'modal-title': 'modal-title text-dark font-weight-bold' }}>
                    {string.formBuilder.Formpreview}
                </ModalHeader>
                <ModalBody>
                    <ReactFormGenerator translate={string} rootURL={getRootUrl()} user_id={user.id} show_btns={false} data={formData.length > 0 ? formData : form} />
                </ModalBody>
            </Modal>

            {/* ADD FORM MODAL */}
            <Modal isOpen={NameModal} className='customModal document'>
                <ModalHeader
                    toggle={toggle}
                    cssModule={{
                        'modal-title': 'modal-title text-dark font-weight-bold',
                    }}
                >
                    {updateform ? string.formBuilder.updateModalname : string.formBuilder.addModalname}
                </ModalHeader>
                <ModalBody>
                    <label htmlFor='name' className='col-md-12 col-form-label pl-0'>
                        {string.formBuilder.formName}
                    </label>
                    <Input
                        type='text'
                        name='name'
                        id='name'
                        // value={Formname}
                        className='form-control'
                        placeholder={string.formBuilder.formName}
                        onChange={(event) => {
                            const pattern = /^(?!.*["'`\\])/
                            if (!pattern.test(event.target.value)) {
                                notify(`${dynamicLanguageStringChange(string.invalidChar, labels)}`)
                                return false
                            }
                            setFormname(event.target.value)
                        }}
                    />
                </ModalBody>
                <ModalFooter>
                    <LoaderButton cssClass='btn btn-primary large-btn' type='button' onClick={() => _handleAddForm()} isLoading={isLoading} text={string.submitBtnTxt} />
                </ModalFooter>
            </Modal>

            {/* DELETE FORM MODAL */}
            <DeleteModal isOpen={isDeleteModal} onDeleteEntry={onDeleteClick} toggle={handleToggleDeleteModal} headerText={string.formBuilder.deleteFormHeaderTxt} />
        </div>
    )
}

FormBuilder.getInitialProps = (ctx) => {
    const formBuilder = true
    return { formBuilder }
}

FormBuilder.propTypes = {
    user: PropTypes.shape({
        id: PropTypes.string,
    }),
}

FormBuilder.defaultProps = {
    user: null,
}

export default withAuth(FormBuilder, { loginRequired: true })
