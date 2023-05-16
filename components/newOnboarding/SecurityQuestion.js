import { TextField, InputLabel, MenuItem, FormControl, Select } from '@material-ui/core'
import { useFormik } from 'formik'
import { useContext, useEffect, useRef, useState } from 'react'
import OnBoardContext from '../../store/onBoard/onBordContext'
import * as Yup from 'yup'
import string from '../../utils/LanguageTranslation.js'

const securityQuestionSchema = Yup.object().shape({
    firstQuestionAnswer: Yup.string()
        .trim()
        .required(`${string.login.securityanswerisrequired} ${string.errors.required}`)
        .notOneOf([Yup.ref('thirdQuestionAnswer'), null], 'Security answers can not be same'),
    secondQuestionAnswer: Yup.string()
        .trim()
        .required(`${string.login.securityanswerisrequired} ${string.errors.required}`)
        .notOneOf([Yup.ref('firstQuestionAnswer'), null], 'Security answers can not be same'),
    thirdQuestionAnswer: Yup.string()
        .trim()
        .required(`${string.login.securityanswerisrequired} ${string.errors.required}`)
        .notOneOf([Yup.ref('secondQuestionAnswer'), null], 'Security answers can not be same'),
    firstQuestion: Yup.string().trim().required(`${string.login.securityanswerisrequired} ${string.errors.required}`),
    secondQuestion: Yup.string().trim().required(`${string.login.securityanswerisrequired} ${string.errors.required}`),
    thirdQuestion: Yup.string().trim().required(`${string.login.securityanswerisrequired} ${string.errors.required}`),
})

const SecurityQuestion = () => {
    const { setSelectedStep, setOnboarding, onboarding, decodedToken, securityQuestions } = useContext(OnBoardContext)
    const refSubmitForm = useRef()
    const language = decodedToken?.language
    const question = language == 'mn' ? 'local_questions' : 'questions'
    const [securityQuestion, setSecurityQuestion] = useState([])
    const [selectedQ, setSelectedQ] = useState([
        { id: onboarding.firstQuestion ?? 1, index: 1 },
        { id: onboarding.secondQuestion ?? 2, index: 2 },
        { id: onboarding.thirdQuestion ?? 3, index: 3 },
    ])
    const [open, setOpen] = useState(false)

    useEffect(() => {
        setSecurityQuestion(securityQuestions)
    }, [securityQuestions])

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            firstQuestionAnswer: onboarding.firstQuestionAnswer ?? '',
            secondQuestionAnswer: onboarding.secondQuestionAnswer ?? '',
            thirdQuestionAnswer: onboarding.thirdQuestionAnswer ?? '',
            firstQuestion: onboarding.firstQuestion ?? 1,
            secondQuestion: onboarding.secondQuestion ?? 2,
            thirdQuestion: onboarding.thirdQuestion ?? 3,
        },
        validationSchema: securityQuestionSchema,
        onSubmit: (values) => {
            setOnboarding({ type: 'updateOrgInfo', payload: values })
            setSelectedStep('step6')
        },
    })
    const handleNext = () => {
        refSubmitForm.current.click()
    }

    const handlePrevious = () => {
        setSelectedStep('step4')
    }

    const handleChange = (event, index) => {
        const FORMIK_MAPPER = {
            1: 'firstQuestion',
            2: 'secondQuestion',
            3: 'thirdQuestion',
        }
        const selectedQuestion = selectedQ.filter(({ index: idx }) => index != idx)
        setSelectedQ([...selectedQuestion, { id: event.target.value, index }])
        formik.setFieldValue(FORMIK_MAPPER[index], event.target.value)
    }
    return (
        <>
            <div className='angry-grid add-user-info-wrapper'>
                <div className='add-user-info-left-column'>
                    <div className='d-flex align-items-end verify-heading'>
                        <img style={{ width: '70px' }} src='/static/img/onboarding/security-question.png' />
                        <h3>{`${string.onboarding.securityQuestions} :`}</h3>
                    </div>
                    <div>
                        <form onSubmit={formik.handleSubmit}>
                            <div className='w-20'>
                                <FormControl>
                                    <Select name='firstQuestion' labelId='demo-controlled-open-select-label' id='demo-controlled-open-select' className='ob-min-w550' value={formik.values.firstQuestion} label='Select Question' onChange={(e) => handleChange(e, 1)}>
                                        {securityQuestion.map((sq, index) => {
                                            const isSelected = selectedQ.find(({ id, index }) => id == sq.id && index != 1)
                                            return (
                                                <MenuItem disabled={isSelected} key={index} value={sq.id}>
                                                    {sq[question]}
                                                </MenuItem>
                                            )
                                        })}
                                    </Select>
                                    <TextField
                                        error={formik.errors.firstQuestionAnswer && formik.touched.firstQuestionAnswer ? true : false}
                                        helperText={formik.errors.firstQuestionAnswer && formik.touched.firstQuestionAnswer ? formik.errors.firstQuestionAnswer : null}
                                        value={formik.values.firstQuestionAnswer}
                                        onChange={(event) => formik.setFieldValue('firstQuestionAnswer', event.target.value)}
                                        name='firstQuestionAnswer'
                                        label='Type Your Answer'
                                        id='demo-helper-text-misaligned'
                                        className='ob-min-w550'
                                    />
                                </FormControl>
                            </div>
                            <div className='mt-4'>
                                <FormControl>
                                    <Select name='secondQuestion' labelId='select-second-question' id='demo-controlled-open-select' className='ob-min-w550' value={formik.values.secondQuestion} label='Select Question' onChange={(e) => handleChange(e, 2)}>
                                        {securityQuestion.map((sq, index) => {
                                            const isSelected = selectedQ.find(({ id, index }) => id == sq.id && index != 2)
                                            return (
                                                <MenuItem disabled={isSelected} key={index} value={sq.id}>
                                                    {sq[question]}
                                                </MenuItem>
                                            )
                                        })}
                                    </Select>
                                    <TextField
                                        error={formik.errors.secondQuestionAnswer && formik.touched.secondQuestionAnswer ? true : false}
                                        helperText={formik.errors.secondQuestionAnswer && formik.touched.secondQuestionAnswer ? formik.errors.secondQuestionAnswer : null}
                                        value={formik.values.secondQuestionAnswer}
                                        onChange={(event) => formik.setFieldValue('secondQuestionAnswer', event.target.value)}
                                        className='ob-min-w550'
                                        id='demo-helper-text-misaligned'
                                        label='Type Your Answer'
                                    />
                                </FormControl>
                            </div>

                            <div className='mt-4'>
                                <FormControl>
                                    <Select name='thirdQuestion' labelId='select-third-question' id='demo-controlled-open-select' className='ob-min-w550' value={formik.values.thirdQuestion} label='Select Question' onChange={(e) => handleChange(e, 3)}>
                                        {securityQuestion.map((sq, index) => {
                                            const isSelected = selectedQ.find(({ id, index }) => id == sq.id && index != 3)
                                            return (
                                                <MenuItem disabled={isSelected} key={index} value={sq.id}>
                                                    {sq[question]}
                                                </MenuItem>
                                            )
                                        })}
                                    </Select>
                                    <TextField
                                        error={formik.errors.thirdQuestionAnswer && formik.touched.thirdQuestionAnswer ? true : false}
                                        helperText={formik.errors.thirdQuestionAnswer && formik.touched.thirdQuestionAnswer ? formik.errors.thirdQuestionAnswer : null}
                                        value={formik.values.thirdQuestionAnswer}
                                        onChange={(event) => formik.setFieldValue('thirdQuestionAnswer', event.target.value)}
                                        className='ob-min-w550'
                                        id='demo-helper-text-misaligned'
                                        label='Type Your Answer'
                                    />
                                </FormControl>
                            </div>

                            <button ref={refSubmitForm} style={{ visibility: 'hidden' }} type='submit'>
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
            <style jsx>{`
                .customFontSize {
                    font-size: 30px;
                }
                .navigation button {
                    border: 0;
                    background: transparent;
                }
            `}</style>
        </>
    )
}

export default SecurityQuestion
