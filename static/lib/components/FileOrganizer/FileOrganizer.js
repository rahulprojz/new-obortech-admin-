import classnames from 'classnames';
import React, { createRef, Fragment, useCallback, useEffect, useImperativeHandle, useRef, useState, } from 'react';
import { focusableElementDomString, getRowAndColumnIndex, getSibling, isScrolledIntoView, THUMBNAIL_WIDTH, } from '../../utils';
import { DndMultiProvider } from '../DndMultiProvider';
import { Draggable } from '../Draggable';
import { DragLayer } from '../DragLayer';
import { MemoAutoSizer } from './MemoAutoSizer';
const defaultSize = { width: THUMBNAIL_WIDTH, height: THUMBNAIL_WIDTH };
export function FileOrganizer({ files, onMove, onDragChange, onDeselectAll, onSelectAll, onRenderThumbnail, onRenderDragLayer, disableMove, preventArrowsToMove, preventClickAwayDeselect, draggingIds, padding, gridRef: _gridRef, thumbnailSize, className, onClick, onKeyDown, style, ...divProps }) {
    const fileOrganizerRef = useRef(null);
    const gridRef = useRef(null);
    useImperativeHandle(_gridRef, () => gridRef.current);
    const [columnCount, setColumnCount] = useState(0);
    const [editingId, setEditingId] = useState();
    const [draggingId, setDraggingId] = useState();
    // Get the width of the first item, or default if no first item found.
    const hasFiles = files.length > 0;
    const getSize = useCallback(() => {
        if (!hasFiles)
            return defaultSize;
        if (!fileOrganizerRef.current)
            return defaultSize;
        const draggableWrapper = fileOrganizerRef.current.querySelector('div[draggable="true"]');
        const draggableElement = draggableWrapper?.firstChild;
        const firstItem = draggableElement?.firstChild;
        if (!firstItem)
            return defaultSize;
        return firstItem.getBoundingClientRect();
    }, [hasFiles]);
    // Detect size of first item and use as size throughout.
    const [size, setSize] = useState(() => thumbnailSize || getSize());
    // Update size when getWidth ref changes (when hasFiles changes).
    useEffect(() => {
        if (thumbnailSize)
            return setSize(thumbnailSize);
        if (files.length === 0)
            return setSize(defaultSize);
        setSize((prev) => {
            const { width, height } = getSize();
            if (prev.width === width && prev.height === height)
                return prev;
            return { width, height };
        });
        // Watches all files to continuously check width and height.
    }, [files, getSize, thumbnailSize]);
    const handleOnDragChange = useCallback((id) => {
        onDragChange?.(id);
        setDraggingId(id);
    }, [onDragChange]);
    const handleItemKeyDown = useCallback((event, index, _file, draggableRef) => {
        let indexDiff = 0;
        switch (event.key) {
            case 'ArrowLeft':
                indexDiff = -1;
                break;
            case 'ArrowRight':
                indexDiff = 1;
                break;
            case 'ArrowUp':
                indexDiff = -1 * columnCount;
                break;
            case 'ArrowDown':
                indexDiff = columnCount;
                break;
            default:
                return; // Return if not one of above keys
        }
        event.preventDefault();
        let hasMoved = false;
        // If meta key was pressed, move to new location.
        if (!preventArrowsToMove &&
            (event.metaKey || event.ctrlKey) &&
            !disableMove &&
            editingId === undefined &&
            onMove) {
            hasMoved = true;
            onMove(index, index + indexDiff);
        }
        if (!gridRef.current)
            return;
        const siblingAtLocation = getSibling(draggableRef.current, indexDiff);
        // If no meta key was pressed, focus item in direction of keys.
        if (siblingAtLocation && !(event.metaKey || event.ctrlKey)) {
            const focusable = siblingAtLocation.querySelector(focusableElementDomString);
            if (focusable) {
                hasMoved = true;
                requestAnimationFrame(() => {
                    focusable.focus();
                });
            }
        }
        if (!hasMoved)
            return;
        const { isVisible } = isScrolledIntoView(siblingAtLocation, fileOrganizerRef.current);
        if (isVisible)
            return;
        // Use react-window scrollToItem api for virtualized items.
        const { rowIndex } = getRowAndColumnIndex(index + indexDiff, columnCount);
        gridRef.current.scrollToItem({ align: 'smart', rowIndex });
    }, [columnCount, disableMove, editingId, onMove, preventArrowsToMove]);
    const pad = Math.max(1, padding || 0);
    const renderItem = useCallback((file, index, style) => {
        if (!file)
            return React.createElement(Fragment, { key: '__null' }, null);
        const isEditing = editingId === file.id;
        const otherDragging = !!((draggingId && draggingId !== file.id) ||
            (draggingIds && draggingIds.length && !draggingIds.includes(file.id)));
        const draggableRef = createRef();
        const isInDragGroup = draggingIds ? draggingIds.includes(file.id) : false;
        return (React.createElement(Draggable, { "data-file-id": file.id, key: file.id, index: index, style: style && {
                ...style,
                top: typeof style.top === 'number' ? style.top + pad : style.top,
                left: typeof style.left === 'number' ? style.left + pad : style.left,
            }, ref: draggableRef, hideDragPreview: !!onRenderDragLayer, preventAnimation: isInDragGroup, onDragChange: (isDragging) => handleOnDragChange(isDragging ? file.id : undefined), disableDrag: isEditing || disableMove, onMove: onMove, onKeyDown: (e) => handleItemKeyDown(e, index, file, draggableRef), onRenderChildren: (isDragging) => {
                return onRenderThumbnail({
                    onRenderThumbnailProps: {
                        file,
                        dragging: isDragging || isInDragGroup,
                        otherDragging,
                        onEditingChange: (editing) => setEditingId(editing ? file.id : undefined),
                    },
                    id: file.id,
                    index,
                });
            } }));
    }, [
        editingId,
        draggingId,
        draggingIds,
        pad,
        onRenderDragLayer,
        disableMove,
        onMove,
        handleOnDragChange,
        handleItemKeyDown,
        onRenderThumbnail,
    ]);
    const handleOnClick = useCallback((event) => {
        onClick?.(event);
        if (!preventClickAwayDeselect)
            onDeselectAll?.();
    }, [onDeselectAll, onClick, preventClickAwayDeselect]);
    const handleOnKeyDown = useCallback((event) => {
        onKeyDown?.(event);
        if (event.key === 'Escape')
            return onDeselectAll?.();
        if (event.key === 'a' && (event.metaKey || event.ctrlKey)) {
            onSelectAll?.();
            event.preventDefault();
        }
    }, [onDeselectAll, onSelectAll, onKeyDown]);
    const customDragLayerTranslate = useCallback(({ mousePosition }) => {
        const x = mousePosition.x - THUMBNAIL_WIDTH / 2;
        const y = mousePosition.y - THUMBNAIL_WIDTH / 2;
        return { x, y };
    }, []);
    const fileOrganizerClass = classnames('ui__base ui__fileOrganizer', className);
    return (React.createElement(DndMultiProvider, null,
        React.createElement("div", Object.assign({}, divProps, { className: fileOrganizerClass, ref: fileOrganizerRef, onClick: handleOnClick, onKeyDown: handleOnKeyDown, style: style, role: "grid", tabIndex: 0 }),
            React.createElement(MemoAutoSizer, { ref: gridRef, files: files, padding: pad, size: size, renderItem: renderItem, onColumnCountChange: setColumnCount }),
            onRenderDragLayer ? (React.createElement(DragLayer, { customTranslate: customDragLayerTranslate },
                React.createElement("div", { className: "ui__fileOrganizer__draglayer", style: { height: THUMBNAIL_WIDTH, width: THUMBNAIL_WIDTH } }, onRenderDragLayer()))) : undefined)));
}
