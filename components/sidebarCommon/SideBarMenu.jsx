import React from 'react'
import PropTypes from 'prop-types'
import Link from 'next/link'

import AdvanceSelect from '../common/form-elements/select/AdvanceSelect'
import Input from '../common/form-elements/input/Input'

const SideBarMenu = (props) => {
    const { id, className, isToggle, isExpanded, onClick, edit, name, setInputValue, inputValue, _handleInputBlur, controls, project, projectOption } = props

    return (
        <>
            {project ? (
                <div className={className}>
                    {project.name ? (
                        <Link href={'/event/' + project.project_id}>
                            <a>{project.name}</a>
                        </Link>
                    ) : (
                        <AdvanceSelect
                            className='basic-single'
                            classNamePrefix='select'
                            isClearable={true}
                            isSearchable={true}
                            name='project'
                            options={projectOption[id]}
                            onChange={(e) =>
                                _handleInputBlur(
                                    {
                                        target: {
                                            label: e?.label,
                                            value: e?.value,
                                            id: project?.id,
                                        },
                                    }
                                )
                            }
                        />
                    )}
                </div>
            )
                :
                (
                    <div className='col-sm-10'>
                        <span
                            id={`collapsed${id}`}
                            style={{ cursor: 'pointer' }}
                            className={className}
                            data-toggle={isToggle ? 'collapse' : ''}
                            data-target={controls ? `#collapse-${controls}${id}` : `#collapse${id}`}
                            aria-expanded={isExpanded ? 'true' : 'false'}
                            aria-controls={controls ? `collapse-${controls}${id}` : `collapse${id}`}
                            onClick={() => {
                                onClick(id)
                            }}
                        >
                            <span>
                                {edit ? (
                                    <Input
                                        type='text'
                                        value={inputValue || ''}
                                        onChange={(e) => {
                                            setInputValue(e.target.value)
                                        }}
                                        onBlur={(e) => _handleInputBlur(e, null, null, id)}
                                        onKeyPress={(e) => {
                                            e?.which === 13 && _handleInputBlur(e, null, null, id)
                                        }}
                                        id={id}
                                    />
                                ) : (
                                    name
                                )}
                            </span>
                        </span>
                    </div>
                )}

        </>
    )
}

SideBarMenu.propTypes = {
    onClick: PropTypes.func
}
SideBarMenu.defaultProps = {
    onClick: () => { }
}

export default SideBarMenu