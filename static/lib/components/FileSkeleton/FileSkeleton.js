import classnames from 'classnames';
import React from 'react';
export const FileSkeleton = ({ className }) => {
    const fileSkeletonClass = classnames('ui__base ui__fileSkeleton', className);
    return (React.createElement("div", { className: fileSkeletonClass },
        React.createElement("div", { className: "ui__fileSkeleton__block ui__fileSkeleton__block--thumbnail" }),
        React.createElement("div", { className: "ui__fileSkeleton__block ui__fileSkeleton__block--line-sm" }),
        React.createElement("div", { className: "ui__fileSkeleton__block ui__fileSkeleton__block--line-xs" }),
        React.createElement("div", { className: "ui__fileSkeleton__block ui__fileSkeleton__block--line-df" }),
        React.createElement("div", { className: "ui__fileSkeleton__block ui__fileSkeleton__block--line-lgx" }),
        React.createElement("div", { className: "ui__fileSkeleton__block ui__fileSkeleton__block--line-lg" }),
        React.createElement("div", { className: "ui__fileSkeleton__block ui__fileSkeleton__block--line-df" })));
};
