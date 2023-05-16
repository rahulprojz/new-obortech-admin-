import classnames from 'classnames';
import React, { useMemo } from 'react';
import { useDragLayer } from 'react-dnd';
export const DragLayer = ({ children, customTranslate, className, ...divProps }) => {
    const { currentOffset, isDragging, mousePosition } = useDragLayer((monitor) => ({
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
        mousePosition: monitor.getClientOffset(),
    }));
    const style = useMemo(() => {
        if (!currentOffset || !mousePosition)
            return { display: 'none' };
        const { x, y } = customTranslate?.({ currentOffset, mousePosition }) ?? currentOffset;
        const transform = `translate(${x}px, ${y}px)`;
        return { transform, WebkitTransform: transform };
    }, [currentOffset, customTranslate, mousePosition]);
    if (!isDragging)
        return null;
    const dragLayerClass = classnames('ui__base ui__dragLayer', className);
    return (React.createElement("div", Object.assign({}, divProps, { className: dragLayerClass }),
        React.createElement("div", { style: style }, children)));
};
