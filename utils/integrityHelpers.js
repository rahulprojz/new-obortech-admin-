export const integrityWrapper = (activeData, data) => {
    const { id, integrity_error, integrity_checked_at, integrity_status } = activeData
    const items = data || []
    const activeIndex = items.findIndex((item) => item.id === id)
    const activeItem = items[activeIndex]
    if (activeItem) {
        activeItem.integrity_error = integrity_error
        activeItem.integrity_checked_at = integrity_checked_at
        activeItem.integrity_status = integrity_status
    }

    return items
}
