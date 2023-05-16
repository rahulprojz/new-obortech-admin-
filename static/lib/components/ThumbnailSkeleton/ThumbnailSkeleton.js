import classnames from 'classnames';
import React from 'react';
import { FileSkeleton } from '../FileSkeleton';
export function ThumbnailSkeleton({ className, ...divProps }) {
    const thumbnailClass = classnames('ui__base ui__thumbnailSkeleton', className);
    return (React.createElement("div", Object.assign({}, divProps, { className: thumbnailClass }),
        React.createElement("div", { className: "ui__thumbnailSkeleton__image" },
            React.createElement(FileSkeleton, { className: "ui__thumbnailSkeleton__image__skeleton" })),
        React.createElement("div", { className: "ui__thumbnailSkeleton__label" })));
}
