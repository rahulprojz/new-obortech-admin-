import classnames from 'classnames';
import React from 'react';
export const ButtonGroup = ({ position = 'right', reverseWrap, centerMobile, children, className, ...props }) => {
    const buttonGroupClass = classnames('ui__base ui__buttonGroup', `ui__buttonGroup--position-${position}`, {
        'ui__buttonGroup--reverse': reverseWrap,
        'ui__buttonGroup--centerMobile': centerMobile,
    }, className);
    return (React.createElement("div", Object.assign({}, props, { className: buttonGroupClass }), children));
};
