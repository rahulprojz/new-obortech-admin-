export const isDeviceAvailable = (checkValue, availableIotDevices) => {
    const device = availableIotDevices.filter((elem) => elem.id == checkValue)
    return device[0]?.is_available
}
const utilFunctionsItemModal = (availableIotDevices) => {
    const customStyles = {
        singleValue: (provided, state) => {
            let checkedColor = 'inherit'
            if (!isDeviceAvailable(state.data.value, availableIotDevices)) checkedColor = 'blue'
            return {
                ...provided,
                color: checkedColor,
            }
        },
    }
    return { customStyles, isDeviceAvailable }
}

export default utilFunctionsItemModal
