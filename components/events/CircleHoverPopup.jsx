import styled from 'styled-components'
import string from '../../utils/LanguageTranslation.js'

const StyledDiv = styled.div`
    color: grey;
    ${(props) => (props.noborder ? '' : 'border: 1px solid grey;')}
    width: ${(props) => (props.align === 'center' ? '100%' : 'fit-content')};
    padding: ${(props) => (props.align === 'center' ? '0px 2px' : '0px 5px')};
    margin-bottom: ${(props) => (props.marginbottom ? `${props.marginbottom}px` : '0px')};
    ${(props) => (props.noborder ? '' : 'border-radius: 10px;')}
    text-align: ${(props) => props.align};
`

const StyleDeviceDiv = styled.div`
    width: 100%;
    ${(props) => (props.borderBottom ? 'border-bottom: 1px solid #ccc;' : '')}
    ${(props) => (props.padding ? 'padding: 10px 0px;' : '')}
    display: flex;
    align-items: center
    justify-content: flex-start;
    white-space: break-spaces;
    word-break: break-all;`

const BoldSpan = styled.span`
    color: ${(props) => (props.top ? '#000' : 'gray')};
    padding-left: '10px'
    padding-top: '10px'
`

const CircleHoverPopup = ({ positionTop, project_event, user, watch_all }) => {
    if (typeof window === 'undefined') {
        return null
    }

    let project_name = ''
    if (watch_all === true) {
        let project_obj = JSON.parse(window.localStorage.getItem('project_name_obj'))
        const projectid = project_event.project_id
        let data = project_obj.filter((val) => val.key == projectid)
        project_name = data[0].value
    }

    const deviceName = project_event?.deviceName || ''
    const isDevice = project_event?.event?.event_category_id == 1 && deviceName

    return (
        <div className={`circle-hover-popup text-left`} style={{ top: positionTop }}>
            {isDevice ? (
                <StyledDiv noborder align='center'>
                    <StyleDeviceDiv>
                        <BoldSpan>
                            {string.project.typeDeviceId}: {deviceName}
                        </BoldSpan>
                    </StyleDeviceDiv>
                </StyledDiv>
            ) : (
                <>
                    <div className='main-content-body'>
                        {project_name != '' && (
                            <>
                                <div className='listSecPri d-flex'>
                                    <div className='frieght-icon'></div>
                                    <div style={{ whiteSpace: 'break-spaces', wordBreak: 'break-all' }}>
                                        <span className='text-dark'>{string.project.projectNameTxt}</span>
                                        <br />
                                        <span>{project_name}</span>
                                    </div>
                                </div>
                                <hr className='event-hr' />
                            </>
                        )}
                        <div className='listSecPri  d-flex'>
                            <div className='frieght-icon'></div>
                            <div style={{ whiteSpace: 'break-spaces', wordBreak: 'break-all' }}>
                                <span className='text-dark'>{user?.organization?.user_type?.name}</span>
                                <br />
                                <span>{user?.organization?.name}</span>
                            </div>
                        </div>
                    </div>
                    <hr className='event-hr' />
                    <div className='main-content-body'>
                        <div className='listSecPri  d-flex'>
                            <div className='admin-icon'></div>
                            <div style={{ whiteSpace: 'break-spaces', wordBreak: 'break-all' }}>
                                <span className='text-dark'>{user?.user_title?.name}</span>
                                <br />
                                <span>{user?.username}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default CircleHoverPopup
