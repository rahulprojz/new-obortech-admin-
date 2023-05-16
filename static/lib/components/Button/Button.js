import classnames from 'classnames';
import React, { forwardRef } from 'react';
import { useAccessibleFocus } from '../../hooks';
export const Button = forwardRef(({ buttonStyle = 'default', buttonSize = 'default', type = 'button', className, children, ...buttonProps }, ref) => {
    const isUserTabbing = useAccessibleFocus();
    const buttonClass = classnames('ui__base ui__button', `ui__button--style-${buttonStyle}`, `ui__button--size-${buttonSize}`, {
        'ui__button--disabled': buttonProps.disabled,
        'ui__button--tabbing': isUserTabbing,
    }, className);
    return (React.createElement("button", Object.assign({}, buttonProps, { className: buttonClass, type: type, ref: ref }),
        React.createElement("div", { className: "ui__button__internal" }, children)));
});
