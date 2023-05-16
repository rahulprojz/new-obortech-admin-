import classnames from 'classnames';
import React from 'react';
export const FilePlaceholder = ({ className, extension }) => {
    const filePlaceholderClass = classnames('ui__base ui__filePlaceholder', className);
    const formattedExtension = extension && `.${extension.replace(/^\./, '')}`;
    return (React.createElement("div", { className: filePlaceholderClass },
        React.createElement("div", { className: "ui__filePlaceholder__block ui__filePlaceholder__block--thumbnail" }),
        React.createElement("div", { className: "ui__filePlaceholder__block ui__filePlaceholder__block--line-sm" }),
        React.createElement("div", { className: "ui__filePlaceholder__block ui__filePlaceholder__block--line-xs" }),
        React.createElement("div", { className: "ui__filePlaceholder__block ui__filePlaceholder__block--line-df" }),
        React.createElement("div", { className: "ui__filePlaceholder__block ui__filePlaceholder__block--line-lgx" }),
        React.createElement("div", { className: "ui__filePlaceholder__block ui__filePlaceholder__block--line-lg" }),
        React.createElement("div", { className: "ui__filePlaceholder__block ui__filePlaceholder__block--line-df" }),
        formattedExtension ? React.createElement("div", { className: "ui__filePlaceholder__extension" }, formattedExtension) : undefined));
};
