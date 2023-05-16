import classnames from 'classnames';
import React, { forwardRef, useMemo } from 'react';
import { useAccessibleFocus, useOnClick } from '../../hooks';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
export const ToolButton = forwardRef(({ className, expandProps, children, onClick, ...buttonProps }, ref) => {
    const handleOnClick = useOnClick(onClick, { stopPropagation: true });
    const isUserTabbing = useAccessibleFocus();
    const positionRight = expandProps?.position === 'right';
    const expandClass = expandProps?.className;
    const hasExpandProps = !!expandProps;
    const classes = useMemo(() => {
        const enabledObj = {
            'ui__toolButton--disabled': buttonProps.disabled,
            'ui__toolButton--tabbing': isUserTabbing,
            'ui__toolButton--expanded': hasExpandProps,
            'ui__toolButton--right': positionRight,
            'ui__toolButton--bottom': !positionRight,
        };
        const wrapper = classnames('ui__base ui__toolButton', enabledObj);
        const action = classnames('ui__toolButton__action', enabledObj, className);
        const expand = classnames('ui__toolButton__expand', enabledObj, expandClass);
        return { wrapper, action, expand };
    }, [buttonProps.disabled, className, expandClass, hasExpandProps, isUserTabbing, positionRight]);
    return (React.createElement("div", { className: classes.wrapper },
        React.createElement(IconButton, Object.assign({ disabled: buttonProps.disabled }, buttonProps, { className: classes.action, onClick: handleOnClick, ref: ref }), children),
        expandProps ? (React.createElement(IconButton, Object.assign({ disabled: buttonProps.disabled }, expandProps, { className: classes.expand }),
            React.createElement(Icon, { icon: "ChevronDown" }))) : undefined));
});
