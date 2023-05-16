import classnames from 'classnames';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Motion, spring } from 'react-motion';
import { useCurrentRef } from '../../hooks';
import { getSibling } from '../../utils';
const ItemTypes = { Draggable: 'draggable' };
// Quick animation with no "bounce".
const SPRING = { stiffness: 300, damping: 30 };
export const Draggable = forwardRef(({ index, disableDrag, hideDragPreview, preventAnimation, onRenderChildren, onMove, onDragChange, children, className, ...divProps }, ref) => {
    const draggableRef = useRef(null);
    useImperativeHandle(ref, () => draggableRef.current);
    /* --- Drag and drop settings. --- */
    const [, drop] = useDrop({
        accept: ItemTypes.Draggable,
        hover(dragItem) {
            // Previous index.
            const fromIndex = dragItem.index;
            // Index it has been dragged to.
            const toIndex = index;
            // Cancel if index has not changed.
            if (fromIndex === toIndex)
                return;
            // Call onMove when index changes.
            const success = onMove?.(fromIndex, toIndex);
            // Set the item index to be the new index.
            if (success)
                dragItem.index = toIndex;
        },
    });
    const [{ isDragging }, drag, preview] = useDrag({
        item: { type: ItemTypes.Draggable, index },
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
        canDrag: !disableDrag,
    });
    useEffect(() => {
        if (hideDragPreview)
            preview(getEmptyImage(), { captureDraggingState: true });
    }, [hideDragPreview, preview]);
    // Call onDragChange whenever isDragging changes.
    const onDragChangeRef = useCurrentRef(onDragChange);
    useEffect(() => {
        if (isDragging && onDragChangeRef.current) {
            onDragChangeRef.current?.(true);
            return () => onDragChangeRef.current?.(false); // eslint-disable-line react-hooks/exhaustive-deps
        }
        return;
    }, [isDragging, onDragChangeRef]);
    drag(drop(draggableRef));
    /* --- Animation settings. --- */
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const prevIndex = useRef(index);
    const noAnimation = useCurrentRef(isDragging || preventAnimation);
    // Find the difference in position between new index and previous index. Then,
    // get the difference in position and set that as the starting point for the
    // animation.
    useEffect(() => {
        // Return early if no animation, since we do not want to compute the
        // previous location.
        if (!draggableRef.current || noAnimation.current)
            return;
        // Get sibling that occupies previous spot to find params.
        const indexDiff = prevIndex.current - index;
        const prev = getSibling(draggableRef.current, indexDiff);
        // Get the coordinates of the previous item.
        const { left: prevLeft, top: prevTop } = prev?.getBoundingClientRect() ?? {};
        // Get the coordinates of the current item.
        const { left, top } = draggableRef.current.getBoundingClientRect();
        // Get the deltas.
        const deltaX = prevLeft === undefined ? 0 : prevLeft - left;
        const deltaY = prevTop === undefined ? 0 : prevTop - top;
        // Set the coordinates to the distance.
        setCoords({ x: deltaX / 6, y: deltaY / 6 });
        // Store index for next swap.
        prevIndex.current = index;
    }, [index, noAnimation]);
    // Whenever coords change, revert back to zero.
    useEffect(() => {
        if (coords.x === 0 && coords.y === 0)
            return;
        requestAnimationFrame(() => setCoords({ x: 0, y: 0 }));
    }, [coords]);
    const motionStyle = useMemo(() => {
        if (noAnimation.current)
            return { x: 0, y: 0 };
        // Only spring when returning to zero. This lets it "snap" to the previous
        // location, then "spring" back to the new location.
        return {
            x: coords.x === 0 ? spring(coords.x, SPRING) : coords.x,
            y: coords.y === 0 ? spring(coords.y, SPRING) : coords.y,
        };
    }, [coords, noAnimation]);
    const draggableClass = classnames('ui__base ui__draggable', className);
    const onMotionRender = useCallback(({ x, y }) => {
        const inMotion = !!(x || y);
        return (React.createElement("div", Object.assign({}, divProps, { ref: draggableRef, className: draggableClass }),
            React.createElement("div", { style: {
                    WebkitTransform: `translate3d(${x}px, ${y}px, 0)`,
                    transform: `translate3d(${x}px, ${y}px, 0)`,
                }, className: classnames('ui__draggable__animated', {
                    'ui__draggable__animated--inMotion': inMotion,
                }) }, onRenderChildren ? onRenderChildren(isDragging) : children)));
    }, [children, divProps, draggableClass, isDragging, onRenderChildren]);
    return React.createElement(Motion, { style: motionStyle }, onMotionRender);
});
