import React, { useState } from 'react'
import string from '../utils/LanguageTranslation.js'
import '../static/css/sidebar.css'

export const SidebarSearch = (props) => {
    const { projectList, project_id } = props
    const [filteredData, setFilteredData] = useState([])
    const [searchProject, setSearchProject] = useState('')

    const handleSearchFilter = (event) => {
        const searchWord = event.target.value
        setSearchProject(searchWord)
        const newFilter = projectList.filter((value) => {
            const uniqueSearch = value.unique_Id.map((v) => {
                return v.uniqueId
            }).toString()
            if (value.label.toLowerCase().includes(searchWord.toLowerCase())) {
                return value.label.toLowerCase().includes(searchWord.toLowerCase())
            } else if (searchWord == uniqueSearch) {
                return value.value
            }
        })

        if (searchWord === '') {
            setFilteredData([])
        } else {
            setFilteredData(newFilter)
        }
    }
    return (
        <div style={{ position: 'relative' }}>
            <div className='projectsearch'>
                <input className='projectsearch-input' type='search' placeholder={string.projectnameval} value={searchProject} onChange={handleSearchFilter} />
            </div>
            {filteredData.length != 0 && (
                <div className='projectsearch-input-dropdown'>
                    {filteredData.slice(0, 10).map((value) => {
                        return (
                            <a
                                onMouseEnter={() => {
                                    localStorage.setItem('last_selected_folder', value.id)
                                    if (value.subPID) {
                                        localStorage.setItem('last_selected_sub_folder', value.subPID)
                                    }
                                }}
                                className='projectsearch-input-dropdown-list'
                                href={'/event/' + value.value}
                            >
                                <li>{value.label} </li>
                            </a>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
export default SidebarSearch
