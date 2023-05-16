import classnames from 'classnames';
import React, { useEffect } from 'react';
import { MultiPage, SinglePage } from '../../icons';
export const ThumbnailDragLayer = ({ numFiles = 1, className, ...divProps }) => {
    numFiles = numFiles || 1;
    useEffect(() => {
        if (!Number.isInteger(numFiles))
            throw new RangeError('numFiles must be an integer');
        if (!Number.isFinite(numFiles))
            throw new RangeError('numFiles must not be infinite');
        if (numFiles <= 0)
            throw new RangeError('numFiles must be a positive integer');
    }, [numFiles]);
    const thumbnailDragLayerClass = classnames('ui__base ui__thumbnailDragLayer', className);
    return (React.createElement("div", Object.assign({}, divProps, { className: thumbnailDragLayerClass }),
        React.createElement("div", { className: "ui__thumbnailDragLayer__wrapper" },
            numFiles === 1 ? (React.createElement(SinglePage, { className: "ui__thumbnailDragLayer__icon" })) : (React.createElement(MultiPage, { className: "ui__thumbnailDragLayer__icon" })),
            numFiles > 1 ? (React.createElement("div", { className: "ui__thumbnailDragLayer__numFiles" },
                React.createElement("span", { className: "ui__thumbnailDragLayer__numFiles__wrapper" }, numFiles))) : undefined)));
};
