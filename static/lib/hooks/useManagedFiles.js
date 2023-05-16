import { useCallback, useEffect, useMemo, useState } from 'react';
import { moveMultiFromIndexToIndex } from '../utils';
/**
 * Combines most of the necessary functionality to manage files for the
 * `FileOrganizer` component.
 * @param options Options for managing files.
 */
export function useManagedFiles({ initialFiles, preventMultiDrag, preventDeselectOnDragOther, preventSelectOnDrag, preventMultiSelect, easyMultiSelect, } = {}) {
    const [files, setFiles] = useState(initialFiles ?? []);
    const addFile = useCallback((file, index) => {
        setFiles((prev) => {
            if (prev.includes(file))
                return prev;
            if (index === undefined)
                return [...prev, file];
            return [...prev.slice(0, index), file, ...prev.slice(index)];
        });
    }, []);
    const removeFile = useCallback((file) => setFiles((prev) => prev.filter((f) => f !== file)), []);
    /* --- Selection. --- */
    // Note: this is also an ordered stack, with the most recently selected last.
    // This allows us to do shift-range selection from the most recent.
    const [selectedIds, setSelectedIds] = useState([]);
    const toggleSelectedId = useCallback((id, event) => {
        const multiKey = !preventMultiSelect && (event?.ctrlKey || event?.metaKey || false);
        const rangeKey = !preventMultiSelect && (event?.shiftKey || false);
        setSelectedIds((prev) => {
            const toggleIndex = prev.indexOf(id);
            if (!multiKey && rangeKey && prev.length) {
                const lastSelectedIndex = files.findIndex((f) => f.id === prev[prev.length - 1]);
                const toggleFileIndex = files.findIndex((f) => f.id === id);
                let selectedFiles = [];
                if (toggleFileIndex < lastSelectedIndex) {
                    selectedFiles = files.slice(toggleFileIndex, lastSelectedIndex + 1);
                }
                else {
                    selectedFiles = files.slice(lastSelectedIndex, toggleFileIndex + 1).reverse();
                }
                return selectedFiles.map((f) => f.id);
            }
            if (toggleIndex === -1) {
                if (easyMultiSelect || multiKey)
                    return [...prev, id];
                return [id];
            }
            if (toggleIndex !== -1) {
                if (easyMultiSelect || multiKey)
                    return [...prev.slice(0, toggleIndex), ...prev.slice(toggleIndex + 1)];
                if (prev.length > 1)
                    return [id];
                return [];
            }
            return prev;
        });
    }, [easyMultiSelect, files, preventMultiSelect]);
    const onDeselectAll = useCallback(() => setSelectedIds([]), []);
    const onSelectAll = useCallback(() => setSelectedIds(files.map((file) => file.id)), [files]);
    const _setMovingSelectedId = useCallback((id) => {
        setSelectedIds((prev) => {
            if (prev.includes(id))
                return prev;
            if (preventDeselectOnDragOther)
                return preventSelectOnDrag ? prev : [...prev, id];
            return preventSelectOnDrag ? [] : [id];
        });
    }, [preventDeselectOnDragOther, preventSelectOnDrag]);
    /* --- Multiple drag items. --- */
    const [draggingIds, setDraggingIds] = useState([]);
    const onDragChange = useCallback((id) => {
        if (!id)
            return setDraggingIds([]);
        if (selectedIds.length === 0)
            return;
        _setMovingSelectedId(id);
        if (!preventMultiDrag) {
            const toDragIds = selectedIds.includes(id) ? selectedIds : [id];
            setDraggingIds(toDragIds);
        }
        else {
            setDraggingIds([id]);
        }
    }, [selectedIds, _setMovingSelectedId, preventMultiDrag]);
    /* --- Moving items. --- */
    const onMove = useCallback((fromIndex, toIndex) => {
        const fromFile = files[fromIndex];
        if (!fromFile)
            return false;
        // Update selections.
        _setMovingSelectedId(fromFile.id);
        // If multi drag is permitted, and multiple items are selected, and
        // there are no items being dragged, do a multi move. This will be a
        // keyboard-specific operation, as multi dragging is managed by the
        // dragging handlers.
        if (!preventMultiDrag && selectedIds.includes(fromFile.id) && selectedIds.length > 1) {
            const next = moveMultiFromIndexToIndex(files, selectedIds, fromIndex, toIndex);
            if (next === files)
                return false;
            setFiles(next);
            return true;
        }
        // Don't allow "wrapping".
        if (toIndex < 0 || toIndex >= files.length)
            return false;
        const clone = files.slice();
        const item = clone.splice(fromIndex, 1)[0];
        clone.splice(toIndex, 0, item);
        setFiles(clone);
        return true;
    }, [_setMovingSelectedId, files, preventMultiDrag, selectedIds]);
    // Remove selected items if the file is removed.
    useEffect(() => {
        setSelectedIds((prev) => {
            const toRemove = new Set(prev);
            files.forEach((file) => {
                if (toRemove.has(file.id))
                    toRemove.delete(file.id);
            });
            return prev.filter((id) => !toRemove.has(id));
        });
    }, [files]);
    const managedFiles = useMemo(() => ({
        fileOrganizerProps: {
            files,
            onMove,
            onDragChange,
            onDeselectAll,
            onSelectAll,
            draggingIds: draggingIds,
        },
        getThumbnailSelectionProps: (id) => ({
            selected: selectedIds.includes(id),
            onClick: (event) => toggleSelectedId(id, event),
        }),
        files,
        setFiles,
        selectedIds,
        setSelectedIds,
        toggleSelectedId,
        addFile,
        removeFile,
        draggingIds,
    }), [
        addFile,
        draggingIds,
        files,
        onMove,
        onDragChange,
        removeFile,
        onSelectAll,
        selectedIds,
        toggleSelectedId,
        onDeselectAll,
    ]);
    return managedFiles;
}
