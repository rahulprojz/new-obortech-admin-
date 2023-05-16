const { async } = require('q')
const db = require('../../models')
const Project = db.projects
const Group = db.groups
const Item = db.items
const Device = db.devices
const Truck = db.trucks
const Container = db.containers
const ProjectSelection = db.project_selections
const SelectionContainer = db.selection_containers
const SelectionTruck = db.selection_trucks
const SelectionGroup = db.selection_groups

const getProjectByName = async (project_name) => {
    // we only need to select the projects because, some projects and templates having same name
    const projectData = await Project.findOne({
        where: {
            name: project_name,
            isDraft: 0,
        },
    })
    return projectData
}

const getGrouptByName = async (group_name) => {
    const groupData = await Group.findOne({
        where: {
            groupID: group_name,
        },
    })
    return groupData
}

const getItemByName = async (item_name) => {
    const itemData = await Item.findOne({
        where: {
            itemID: item_name,
        },
    })
    return itemData
}

const getDeviceByName = async (device_name) => {
    const deviceData = await Device.findOne({
        where: {
            deviceID: device_name,
        },
    })
    return deviceData
}

const getTruckByName = async (truck_name) => {
    const truckData = await Truck.findOne({
        where: {
            truckID: truck_name,
        },
    })
    return truckData
}

const getContainerByName = async (container_name) => {
    const containerData = await Container.findOne({
        where: {
            containerID: container_name,
        },
    })
    return containerData
}

// Validation checking the the selection was already selected in different project or not
const selectionValidation = async (project_id, { container_id, truck_id, group_id }) => {
    try {
        const projectSelection = await ProjectSelection.findOne({
            include: [
                {
                    model: SelectionContainer,
                    required: true,
                    where: { container_id },
                },
                {
                    model: SelectionTruck,
                },
                { model: SelectionGroup },
            ],
        })
        if (!projectSelection || (projectSelection && !projectSelection.project_id)) {
            return { success: true }
        }
        if (projectSelection) {
            return {
                success: project_id == projectSelection.project_id && projectSelection.selection_trucks[0].truck_id == truck_id && projectSelection.selection_groups[0].group_id == group_id,
                validationMessage: {
                    isContainerValid: project_id == projectSelection.project_id ? '' : 'Container name',
                    isTruckValid: projectSelection.selection_trucks[0].truck_id == truck_id ? '' : 'Truck name',
                    isGroupValid: projectSelection.selection_groups[0].group_id == group_id ? '' : 'Group name',
                },
            }
        }
    } catch (err) {
        console.log(err)
        return { success: false }
    }
}

module.exports = {
    getProjectByName,
    getGrouptByName,
    getItemByName,
    getDeviceByName,
    getTruckByName,
    getContainerByName,
    selectionValidation,
}
