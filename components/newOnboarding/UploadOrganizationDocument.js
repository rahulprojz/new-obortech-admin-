import { MenuItem, TextField } from '@material-ui/core'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useContext, useRef, useEffect } from 'react'
import notify from '../../lib/notifier'
import OnBoardContext from '../../store/onBoard/onBordContext'
import string from '../../utils/LanguageTranslation.js'

const UploadOrganizationDocument = () => {
    const refSubmitForm = useRef()
    const { setSelectedStep, documentTypes, setOnboarding, onboarding, decodedToken, checkMVSVerification } = useContext(OnBoardContext)
    const language = decodedToken?.language
    const idVerify = decodedToken?.idVerify
    const handleNext = () => {
        refSubmitForm.current.click()
    }
    const handlePrevious = () => {
        setSelectedStep('step8')
    }
    const formik = useFormik({
        initialValues: {
            document_type: onboarding.document_type ?? '',
            file: onboarding.file ?? '',
        },
        validationSchema: Yup.object().shape({
            document_type: Yup.string().required(`${string.onboarding.documentType} ${string.errors.required}`),
        }),
        onSubmit: (values) => {
            if (!values.file) {
                notify(`${string.onboarding.validations.uploadDoc}`)
                return false
            }
            setOnboarding({ type: 'updateOrgDoc', payload: values })
            setSelectedStep('step10')
        },
    })

    const _onSelectFile = async (e) => {
        if (!e.target.files[0]) return
        const file = e.target.files[0]
        const fileSize = file.size / 1024 / 1024
        if (fileSize > 1) {
            notify(`${string.onboarding.validations.lessthan1Mb}`)
            return
        }
        if (!['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            notify(`${string.onboarding.supporredFileFormats}`)
            return
        }
        formik.setFieldValue('file', file)
    }

    const checkVerfication = async () => {
        if (language == 'mn' && idVerify) {
            const verificationData = checkMVSVerification('organization')
            if (!verificationData.approved) {
                notify(`${string.onboarding.validations.verificationReject}`)
                setSelectedStep('step8')
            }
        }
    }

    useEffect(() => {
        // checkVerfication()
    }, [language, idVerify])

    return (
        <>
            <div className='angry-grid upload-org-wrapper'>
                <div className='upload-org-left-column'>
                    <div className='d-flex align-items-end verify-heading'>
                        <img style={{ width: '70px' }} src='/static/img/onboarding/office.png' />
                        <h3 className='mb-0'>{`${string.onboarding.addOrgInfo}`}</h3>
                    </div>
                    <div>
                        <form onSubmit={formik.handleSubmit}>
                            {/* Attached Document and Supported file */}
                            <div className='d-flex align-items-end justify-content-between'>
                                <TextField
                                    id='document_type'
                                    className='attach-doc-input'
                                    name='document_type'
                                    select
                                    label={`${string.onboarding.attachDoc}`}
                                    value={formik.values.document_type}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    variant='standard'
                                    error={!!(formik.errors.document_type && formik.touched.document_type)}
                                    helperText={formik.errors.document_type && formik.touched.document_type ? formik.errors.document_type : null}
                                >
                                    {documentTypes.map(({ document_type }) => (
                                        <MenuItem key={document_type?.id} value={document_type?.id}>
                                            {document_type?.type}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <div className='supported-files'>
                                    <p className='mb-0'>{`${string.onboarding.supportedOrgDocumentFormats}`}</p>
                                </div>
                            </div>
                            <div className='file-input-wrapper'>
                                <div className='form-group mb-0 files color'>
                                    <input accept='.pdf, .png, .jpg, .jpeg' id='upload' type='file' onChange={_onSelectFile} />
                                    {formik.values.file && <p style={{ position: 'absolute', top: '161px', width: '100%', textAlign: 'center' }}>{formik.values.file.name}</p>}
                                    <div className='btn-name'>
                                        <label htmlFor='upload'>{string.browserbtn}</label>
                                    </div>
                                </div>
                            </div>
                            <button ref={refSubmitForm} className='hidden-btn' type='submit'>
                                Submit
                            </button>
                        </form>
                    </div>
                </div>
                <div className='d-flex navigation'>
                    <button onClick={handlePrevious}>
                        <img style={{ transform: 'scaleX(-1)', width: '60px' }} src='/static/img/onboarding/next.png' />
                    </button>
                    <button onClick={handleNext}>
                        <img style={{ width: '60px' }} src='/static/img/onboarding/next.png' />
                    </button>
                </div>
            </div>
            <style jsx>
                {`
                    button {
                        border: 0;
                        background: transparent;
                    }
                    .files input {
                        outline: 2px dashed #ff0000 !important;
                        -webkit-transition: outline-offset 0.15s ease-in-out, background-color 0.15s linear;
                        transition: outline-offset 0.15s ease-in-out, background-color 0.15s linear;
                        padding: 180px 0px 50px 35%;
                        text-align: center !important;
                        margin: 0;
                        width: 100% !important;
                        border-radius: 5px;
                        font-size: 0px;
                    }
                    .files input:focus {
                        outline: 2px dashed #ff0000;
                        -webkit-transition: outline-offset 0.15s ease-in-out, background-color 0.15s linear;
                        transition: outline-offset 0.15s ease-in-out, background-color 0.15s linear;
                    }
                    .files {
                        position: relative;
                    }
                    .files:after {
                        pointer-events: none;
                        position: absolute;
                        top: 40px;
                        left: 0;
                        width: 64px;
                        right: 0;
                        height: 64px;
                        content: '';
                        background-image: url('../../static/img/onboarding/dragdrop.png');
                        display: block;
                        margin: 0 auto;
                        background-size: 100%;
                        background-repeat: no-repeat;
                    }
                    .color input {
                        background-color: #fff8f8;
                    }
                    .files:before {
                        position: absolute;
                        top: 120px;
                        left: 0;
                        pointer-events: none;
                        width: 34%;
                        right: 0;
                        height: 57px;
                        content: '${string.draganddropTxt}';
                        display: block;
                        margin: 0 auto;
                        color: #727272;
                        font-size: 18px;
                        font-weight: 300;
                        text-align: center;
                        font-family: 'Roboto Condensed';
                        line-height: 21px;
                    }
                    .btn-name {
                        position: absolute;
                        bottom: 66px;
                        left: 304px;
                        font-weight: bold;
                        font-size: 22px;
                        color: red;
                    }
                    .btn-name label {
                        cursor: pointer;
                        margin-bottom: 0px;
                    }
                    .files input[type='file']::-webkit-file-upload-button {
                        border: 1px solid red;
                        border-radius: 5px;
                        background-color: white;
                        color: white;
                        padding: 15px 45px;
                        font-size: 22px;
                        cursor: pointer;
                        display: inline-block;
                        margin: 4px 2px;
                    }
                    .supported-files {
                        width: 310px;
                    }
                `}
            </style>
        </>
    )
}

export default UploadOrganizationDocument
