import AdvanceSelect from '../../../common/form-elements/select/AdvanceSelect'
import string from '../../../../utils/LanguageTranslation.js'

const ParticipantFilter = ({ projectOrganizations = [], documents, project, customStyles, dropDownStyle, selectedParticipant, onSetSelectedParticipant }) => {
    const documentStyleUpdated = { ...dropDownStyle, width: '220px' }
    const organizatoinOptions = [{ label: string.participant.showForAllOrganizations, value: 0 }]
    projectOrganizations.length &&
        projectOrganizations.map((pUsers) => {
            if (pUsers.id) {
                const ifExists = organizatoinOptions.find((org) => org.label == pUsers.organization.name)
                if (!ifExists) {
                    organizatoinOptions.push({ label: pUsers.organization.name, value: pUsers.organization.id })
                }
            }
        })

    return (
        <div id='participantSelect' style={documentStyleUpdated}>
            <AdvanceSelect
                options={organizatoinOptions.length > 1 ? organizatoinOptions : []}
                styles={customStyles}
                value={organizatoinOptions.find((org) => org.value == selectedParticipant)}
                onChange={(selectedOption) => {
                    onSetSelectedParticipant(selectedOption.value)
                }}
            />
        </div>
    )
}

export default ParticipantFilter
