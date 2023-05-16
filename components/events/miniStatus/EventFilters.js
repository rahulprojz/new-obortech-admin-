import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { ItemAddEditContextProvider } from '../../../store/event/itemAddEditContext'
import { ContainerAddEditContextProvider } from '../../../store/event/containerAddEditContext'
import CreateItemButton from '../createEditItem/CreateItemButton'
import AddItemQRCode from './eventFilter/AddItemQRCode'
import AddContainerQACode from './eventFilter/AddContainerQACode'
import ContainerNameFilter from './eventFilter/ContainerNameFilter'
import GroupNameFilter from './eventFilter/GroupNameFilter'
import ItemNameFilter from './eventFilter/ItemNameFilter'
import DeviceNameFilter from './eventFilter/DeviceFilter'
import TruckNameFilter from './eventFilter/TruckNameFilter'
import ParticipantFilter from './eventFilter/PartcipantFilter'
import DocumentTypeFilter from './eventFilter/DocumentTypeFilter'
import { getCustomLabels } from '../../../redux/selectors/customLabelSelector'

const customStyles = {
    control: (provided, state) => ({
        ...provided,
        minHeight: 36,
        height: 36,
        fontSize: 14,
        borderRadius: 0,
        color: '#6e707e',
        borderLeft: 'none',
        borderTop: 'none',
        borderRight: 'none',
        outline: 'none',
    }),
    dropdownIndicator: (provided, state) => ({
        ...provided,
        borderLeft: 'none',
    }),
}

const dropDownStyle = { width: '160px', marginLeft: '15px' }

const EventFilters = ({
    isDocumentView = false,
    showDevices = false,
    project,
    refetchProjectSelection,
    documents,
    user,
    showQrCode,
    showGroupQrCode,
    selectedParticipant = 0,
    projectOrganizations = [],
    selectedDocType = 0,
    selectedDocName = '',
    onSetSelectedParticipant = () => {},
    onSetSelectedDocType = () => {},
    onSetSelectedDocName = () => {},
    userManualEvents = [],
}) => {
    // Check if user is public user
    const isPublicUser = user && user?.role_id == process.env.ROLE_PUBLIC_USER
    const isManagerUser = user && user.role_id == process.env.ROLE_MANAGER
    const isAdmin = user && user.role_id == process.env.ROLE_ADMIN
    const isCEO = user && user.role_id == process.env.ROLE_CEO
    const ifSeniorManager = user.role_id == process.env.ROLE_SENIOR_MANAGER
    const labels = useSelector(getCustomLabels)

    const isShowQRCode = useMemo(() => {
        return showQrCode == 'show'
    }, [showQrCode])

    const checkRole = () => {
        if (isManagerUser) {
            return true
        }
        return false
    }

    const activeRole = checkRole()

    return (
        <>
            <GroupNameFilter isPublicUser={isPublicUser} project={project} customStyles={customStyles} dropDownStyle={dropDownStyle} />
            <TruckNameFilter isPublicUser={isPublicUser} project={project} customStyles={customStyles} dropDownStyle={dropDownStyle} />
            <ContainerAddEditContextProvider>
                <ContainerNameFilter isPublicUser={isPublicUser} project={project} customStyles={customStyles} dropDownStyle={dropDownStyle} />
                {showGroupQrCode && (isAdmin || isManagerUser) && <AddContainerQACode key='AddGroupQRCode' />}
            </ContainerAddEditContextProvider>
            <ItemAddEditContextProvider>
                <ItemNameFilter isPublicUser={isPublicUser} project={project} userLogged={user} customStyles={customStyles} dropDownStyle={dropDownStyle} showQrCode={showQrCode} isManager={activeRole} />
                {isShowQRCode && <AddItemQRCode key='AddItemQRCode' />}
                {isShowQRCode && (user.role_id == process.env.ROLE_ADMIN || user.role_id == process.env.ROLE_MANAGER) && !project?.is_completed && <CreateItemButton selectedProject={project} refetchProjectSelection={refetchProjectSelection} />}
            </ItemAddEditContextProvider>
            {showDevices && <DeviceNameFilter isPublicUser={isPublicUser} project={project} customStyles={customStyles} dropDownStyle={dropDownStyle} />}
            {isDocumentView && (
                <>
                    <ParticipantFilter
                        projectOrganizations={projectOrganizations}
                        project={project}
                        documents={documents}
                        userManualEvents={userManualEvents}
                        customStyles={customStyles}
                        dropDownStyle={dropDownStyle}
                        selectedParticipant={selectedParticipant}
                        onSetSelectedParticipant={onSetSelectedParticipant}
                    />
                    <DocumentTypeFilter
                        user={user}
                        project={project}
                        customStyles={customStyles}
                        documents={documents}
                        dropDownStyle={dropDownStyle}
                        selectedDocType={selectedDocType}
                        onSetSelectedDocType={onSetSelectedDocType}
                        userManualEvents={userManualEvents}
                        selectedDocName={selectedDocName}
                        onSetSelectedDocName={onSetSelectedDocName}
                    />
                </>
            )}
        </>
    )
}

export default EventFilters
