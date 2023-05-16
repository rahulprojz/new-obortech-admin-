import classnames from 'classnames';
import React, { forwardRef, useMemo } from 'react';
import * as icons from './../../icons';
export const Icon = forwardRef(({ icon, svgProps, className, children, ...props }, ref) => {
    const iconClass = classnames('ui__base ui__icon', className);
    const child = useMemo(() => {
        if (children !== undefined)
            return children;
        if (icons === undefined)
            return undefined;
        const IconChild = icons[icon];
        return React.createElement(IconChild, Object.assign({}, svgProps));
    }, [children, icon, svgProps]);
    return (React.createElement("i", Object.assign({}, props, { className: iconClass, ref: ref }), child));
});
