import React, { useEffect, useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import string from '../../../utils/LanguageTranslation.js'
import FormHelperMessage from '../../../components/common/form-elements/formHelperMessage'
import Button from '../../../components/common/form-elements/button/Button'
import Input from '../../../components/common/form-elements/input/Input'
import CustomSelect from '../../../components/common/form-elements/select/CustomSelect'
import find from 'lodash/find'
import { fetchProjectOrgCategories } from '../../../lib/api/project-category'
import { fetchCategoryParticipants } from '../../../lib/api/organization'
import Spinner from '../../../components/common/OverlaySpinner'
import notify from '../../../lib/notifier.js'

const AddProjectStepOne = ({ setState, state, changeStep, setProjectData, allProjects, mode }) => {
    const [projectCategories, setProjectCategories] = useState([])
    const [isLoadingContent, setIsLoadingContent] = useState(false)

    const goInit = async () => {
        setIsLoadingContent(true)
        const project_categories = await fetchProjectOrgCategories()
        setProjectCategories(project_categories)
        setIsLoadingContent(false)
    }

    useEffect(() => {
        goInit()
    }, [])

    if (typeof window === 'undefined') {
        return null
    }

    let disabled = false
    if (state.project.isActive !== null && state.project?.isActive !== undefined && state.selectedTab == 'PROJECT_LISTING' && mode === 'edit') {
        disabled = true
    }
    const nextStep = async (values) => {
        try {
            const { name, project_category_id, template_id } = values
            const orgList = await fetchCategoryParticipants({ catIds: [project_category_id] })
            const isContainMoreThanOneOrg = orgList.length ? orgList.filter((org) => org.sync_status == 2).length > 1 : false
            if (isContainMoreThanOneOrg) {
                setState({
                    project: {
                        ...state.project,
                        name,
                        project_category_id,
                        id: template_id,
                    },
                })
                changeStep(2)
            } else {
                notify(string.project.mustTwoOrgs)
            }
        } catch (error) {
            notify(error.message || error.toString())
            console.log('AddProjectOne error ->', error)
        }
    }

    // Formik Validations and initialization
    const formik = useFormik({
        initialValues: {
            name: state?.project?.name || '',
            project_category_id: state?.project?.project_category_id || '',
            template_id: state?.project?.id || '',
        },
        validationSchema: Yup.object({
            name: Yup.string()
                .trim(string.errors.emptySpace)
                .min(3, string.errors.min3)
                .required(`${string.project.projectNameTxt} ${string.errors.required}`)
                .matches(/^(?!.*["'`\\])/, `${string.project.projectNameTxt} ${string.errors.invalid}`),

            project_category_id: Yup.string().required(`${string.project.eventCategory} ${string.errors.required}`),
        }),
        onSubmit: (values) => {
            nextStep(values)
        },
    })

    const _setProjectTemplate = (templateid) => {
        const project = find(allProjects, (item) => item.id == templateid)
        if (project) {
            project.template_id = templateid
            setProjectData(project)
            state.istemplateselected = true
            // window.localStorage.setItem('project_selections', JSON.stringify(project.selections))
            formik.setValues({ ...project })
        } else {
            const project = {}
            state.istemplateselected = false
            project.selections = [
                {
                    item_id: '',
                    container_id: '',
                    // Data interval remove from UI
                    // data_interval: 1,
                    device_id: '',
                    group_id: 1,
                    truck_id: '',
                    devices: [
                        {
                            // Data interval remove from UI
                            // data_interval: '',
                            device_id: '',
                            tag: '',
                        },
                    ],
                },
            ]
            project.selectedRoads = []
            setState({ project })
            formik.setValues({
                name: '',
                project_category_id: '',
                template_id: '',
            })
        }
    }

    if (typeof window === 'undefined') {
        return null
    } else {
        return (
            <div className='project-steps'>
                {isLoadingContent && <Spinner />}
                <form className='form-container' onSubmit={formik.handleSubmit}>
                    <div className='shiment-name'>
                        {disabled ? (
                            <Input type='text' value={formik.values.name} onChange={formik.handleChange} placeholder={string.project.typeProjectName} name='name' disabled='disabled' />
                        ) : (
                            <Input type='text' value={formik.values.name} onChange={formik.handleChange} placeholder={string.project.typeProjectName} name='name' />
                        )}

                        {formik.errors.name ? <FormHelperMessage className='err' message={formik.errors.name} /> : null}
                    </div>
                    {/* row */}
                    <div className='row ml-0 mr-0 content-block'>
                        <div className='col-md-6 pl-0'>
                            <div className='form-group row m-0'>
                                <label htmlFor='email_address' className='col-md-12 col-form-label pl-0 pr-0'>
                                    {string.project.projectTemplate}
                                </label>
                                <div className={'col-md-12 position-relative p-0'}>
                                    {disabled ? (
                                        <CustomSelect
                                            className='form-control'
                                            onChange={(event) => {
                                                _setProjectTemplate(event.target.value)
                                            }}
                                            value={`${formik.values.template_id}`}
                                            name='template_id'
                                            disabled='disabled'
                                        >
                                            <option value=''>{string.project.selectTemplate}</option>;
                                            {state.allProjects
                                                .filter((p) => p.isDraft === 1)
                                                .map((project, i) => {
                                                    if (project.isDraft) {
                                                        return (
                                                            <option key={project.id} value={project.id}>
                                                                {project.name}
                                                            </option>
                                                        )
                                                    }
                                                })}
                                        </CustomSelect>
                                    ) : (
                                        <CustomSelect
                                            className='form-control'
                                            onChange={(event) => {
                                                _setProjectTemplate(event.target.value)
                                            }}
                                            value={`${formik.values.template_id}`}
                                            name='template_id'
                                        >
                                            <option value=''>{string.project.selectTemplate}</option>;
                                            {state.allProjects
                                                .filter((p) => p.isDraft === 1)
                                                .map((project, i) => {
                                                    if (project.isDraft) {
                                                        return (
                                                            <option key={project.id} value={project.id}>
                                                                {project.name}
                                                            </option>
                                                        )
                                                    }
                                                })}
                                        </CustomSelect>
                                    )}

                                    {formik.errors.template_id ? <FormHelperMessage className='err' message={formik.errors.template_id} /> : null}
                                </div>
                            </div>
                        </div>
                        <div className='col-md-6 pr-0'>
                            <div className='row m-0'>
                                <div className='form-group col-md-6 pl-0'>
                                    <label htmlFor='email-address' className='col-md-12 col-form-label pl-0'>
                                        {string.project.projectCategory}
                                    </label>
                                    <div className='col-md-12 position-relative p-0'>
                                        <CustomSelect
                                            disabled={disabled ? 'disable' : ''}
                                            className='form-control'
                                            value={`${formik.values.project_category_id}`}
                                            name='project_category_id'
                                            options={projectCategories}
                                            onChange={(event) => {
                                                formik.setValues({ ...formik.values, project_category_id: event.target.value })
                                            }}
                                        />
                                        {formik.errors.project_category_id ? <FormHelperMessage className='err' message={formik.errors.project_category_id} /> : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* //row */}
                    <div className='modal-footer'>
                        <Button className='btn btn-primary large-btn' type='submit'>
                            {string.project.next}
                        </Button>
                    </div>
                </form>
            </div>
        )
    }
}

AddProjectStepOne.propTypes = {}
AddProjectStepOne.defaultProps = {}

export default AddProjectStepOne
