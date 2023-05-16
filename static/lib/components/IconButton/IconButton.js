import classnames from 'classnames';
import React, { forwardRef } from 'react';
import { Button } from '../Button';
export const IconButton = forwardRef(({ children, className, ...props }, ref) => {
    const iconButtonClass = classnames('ui__base ui__iconButton', className);
    return (React.createElement(Button, Object.assign({}, props, { className: iconButtonClass, buttonStyle: "borderless", ref: ref }), children));
});
