import { useEffect, useState } from 'react'
import AdvanceSelect from '../../../common/form-elements/select/AdvanceSelect'
import { otherLanguage } from '../../../../utils/selectedLanguage'
import string from '../../../../utils/LanguageTranslation.js'

const DocumentTypeFilter = ({ customStyles, dropDownStyle, documents, selectedDocType, onSetSelectedDocType, user, project, selectedDocName, onSetSelectedDocName }) => {
    const [options, setOptions] = useState([])

    if (typeof window === 'undefined') {
        return null
    }

    const prepareFilterOptions = async () => {
        let document_types = []
        if (project.id) {
            documents.map((project_event) => {
                document_types.push({ label: otherLanguage ? project_event?.local_event_name || project_event?.event_name : project_event?.event_name, value: project_event?.event_name, id: project_event?.event_id })
            })
        }
        const tempOptions = [{ value: '', label: string.showAllEvents, id: '' }, ...document_types]
        setOptions(tempOptions)
    }

    useEffect(() => {
        prepareFilterOptions()
    }, [documents])

    const documentStyleUpdated = { ...dropDownStyle, width: '220px' }

    return (
        <div id='documentTypeSelect' style={documentStyleUpdated}>
            <AdvanceSelect
                options={options.length > 1 ? options : []}
                styles={customStyles}
                value={options.find((cat) => cat.value == selectedDocName)}
                onChange={(selectedOption) => {
                    onSetSelectedDocType(selectedOption?.id || '')
                    onSetSelectedDocName(selectedOption?.value || '')
                }}
                getOptionLabel={(option) => option.label}
                getOptionValue={(option) => option.value}
            />
        </div>
    )
}

export default DocumentTypeFilter
