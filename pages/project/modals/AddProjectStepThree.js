import React, { useEffect, useState } from 'react'
import { DraggableItem } from '../../../components/projects/DraggableItem'
import string from '../../../utils/LanguageTranslation'
import Button from '../../../components/common/form-elements/button/Button'
import notify from '../../../lib/notifier'
import LoaderButton from '../../../components/common/form-elements/button/LoaderButton'
import { fetchProjectRoads } from '../../../lib/api/project'
import useModifyProps from '../../../utils/customHooks/useModifyProps'
import Spinner from '../../../components/common/OverlaySpinner'

const AddProjectStepThree = ({ mode, setState, state, saveProject, changeStep, project_id, isReadOnly }) => {
    if (typeof window === 'undefined') {
        return null
    }
    const [submitBtnDisable, setSubmitBtnDisable] = useState(false)
    const [draftBtnDisable, setDraftBtnDisable] = useState(false)
    const [initialItems, setInitialItems] = useState(0)
    const [selectedRoads, setSelectedRoads] = useState([])
    const [isLoadingContent, setIsLoadingContent] = useState(false)
    const [selectedRoadRadius, setSelectedRoadRadius] = useState([])

    const allRoadsMappingRef = useModifyProps(() => {
        const roadsMapping = {}
        if (Array.isArray(state.stations)) {
            state.stations.forEach((station) => {
                roadsMapping[station.id] = station
            })
        }
        return roadsMapping
    })

    const backStep = (event) => {
        event.preventDefault()
        changeStep(2)
    }

    const goInit = async () => {
        setIsLoadingContent(true)
        const projectRoads = await fetchProjectRoads({ project_id })
        setInitialItems(projectRoads.length)
        setSelectedRoads(projectRoads)
        updateSelectedRoadRadius(projectRoads)
        setIsLoadingContent(false)
    }

    const saveAsDraft = () => {
        state.project.isDraft = 1
        handleSubmission(true)
    }

    const submitProject = () => {
        if (!state.isEdit) state.project.isDraft = 0
        handleSubmission(false)
    }

    const handleSubmission = (draftClick) => {
        if (validateStations()) {
            notify(string.selectroads)
            return false
        }

        if (!draftClick) {
            setSubmitBtnDisable(true)
        } else if (!state.istemplateselected) {
            setDraftBtnDisable(true)
        }
        selectedRoads.map((road) => {
            if (road?.drawingMode && road?.drawingMode === 'draw-circle') road.pathArray = []
            return road
        })

        const newShip = {
            ...state.project,
            ...{ selectedRoads },
        }

        setState({
            project: {
                ...newShip,
            },
        })

        saveProject(newShip, draftClick, setSubmitBtnDisable)
    }

    const validateStations = () => {
        let invalid = false

        if (selectedRoads.length == 0) {
            invalid = true
        } else {
            selectedRoads.map((station) => {
                if (!station.road_id || station.road_id == '') {
                    invalid = true
                }
                if (station.road_id && station.radius == '') {
                    return (station.radius = state.stations.find((pStation) => pStation.id == station.road_id).radius)
                }
            })
        }
        return invalid
    }

    const updateSelectedRoadRadius = (selectedRoads) => {
        const allSelectedRadius = []
        selectedRoads.forEach((selectedRoad) => {
            if (allRoadsMappingRef.current[selectedRoad.road_id]) {
                allSelectedRadius.push({ road_id: selectedRoad.road_id, radius: allRoadsMappingRef.current[selectedRoad.road_id].radius, latitude: allRoadsMappingRef.current[selectedRoad.road_id].latitude, longitude: allRoadsMappingRef.current[selectedRoad.road_id].longitude })
            }
        })
        setSelectedRoadRadius(allSelectedRadius)
    }

    useEffect(() => {
        if (project_id) goInit()
    }, [])

    return (
        <form className='form-container'>
            <div className='project-table-listing table-responsive'>
                <table className='table'>
                    <thead className='thead-dark'>
                        <tr>
                            <th scope='col' width='4%' />
                            <th scope='col' width='27%'>
                                {string.project.stationName}
                            </th>
                            <th scope='col' width='20%'>
                                {string.latitude}
                            </th>
                            <th scope='col' width='20%'>
                                {string.longitude}
                            </th>
                            <th scope='col' width='18%'>
                                {string.radius}
                            </th>
                            <th scope='col' width='11%' />
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan='6'>
                                {selectedRoads?.length > 0 && (
                                    <DraggableItem
                                        className='table__drag'
                                        listItems={selectedRoads}
                                        stations={state.stations}
                                        project={state.project}
                                        setState={setState}
                                        mode={mode}
                                        state={state}
                                        selectedTab={state.selectedTab}
                                        initialItems={initialItems}
                                        allRoadsMappingRef={allRoadsMappingRef}
                                        selectedRoadRadius={selectedRoadRadius}
                                        updateSelectedRoadRadius={updateSelectedRoadRadius}
                                    />
                                )}
                            </td>
                        </tr>
                    </tbody>
                </table>
                {isReadOnly ? (
                    <div
                        className='add-btn'
                        style={{ margin: 'auto' }}
                        onClick={(event) => {
                            event.preventDefault()
                        }}
                    >
                        <Button className='btn' style={{ cursor: 'not-allowed' }}>
                            <i className='fas fa-plus fa-sm' disabled />
                        </Button>
                    </div>
                ) : (
                    <div
                        className='add-btn'
                        style={{ margin: 'auto' }}
                        onClick={(event) => {
                            event.preventDefault()
                            // disabled = { isReadOnly }
                            const { project } = state
                            selectedRoads.push({ radius: '', notEditable: true })
                            project.selectedRoads = selectedRoads
                            setSelectedRoads(selectedRoads)
                            setState({ project })
                        }}
                    >
                        <Button className='btn'>
                            <i className='fas fa-plus fa-sm' />
                        </Button>
                    </div>
                )}
            </div>
            <div className='modal-footer'>
                <Button className='btn btn-secondary large-btn' type='button' onClick={backStep}>
                    {string.onboarding.btn.back}
                </Button>
                {(mode == 'add' || state.isSavingDraft) && <LoaderButton cssClass='btn btn-primary large-btn' type='button' isLoading={draftBtnDisable} onClick={() => saveAsDraft()} text={string.project.saveAsTemplate} />}
                <LoaderButton cssClass='btn btn-primary large-btn' disabled={isReadOnly} type='button' isLoading={submitBtnDisable} onClick={() => submitProject()} text={string.submitBtnTxt} />
            </div>
        </form>
    )
}

AddProjectStepThree.propTypes = {}
AddProjectStepThree.defaultProps = {}

export default AddProjectStepThree
