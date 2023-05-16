import classnames from 'classnames';
import React, { cloneElement } from 'react';
import { useID } from '../../hooks/useID';
export const Label = ({ label, optionalText, children, className, htmlFor, ...props }) => {
    const childrenId = children?.props.id;
    const id = useID(childrenId);
    const labelClass = classnames('ui__base ui__label', { 'ui__label--disabled': children?.props.disabled, 'ui__label--attached': children }, className);
    return (React.createElement(React.Fragment, null,
        React.createElement("label", Object.assign({}, props, { className: labelClass, htmlFor: htmlFor ?? id }),
            label,
            optionalText ? React.createElement("span", { className: "ui__label__optional" }, optionalText) : undefined),
        children ? cloneElement(children, { id }) : undefined));
};
