import classnames from 'classnames';
import React, { forwardRef, useMemo } from 'react';
import { useFocus } from '../../hooks';
import { Icon } from '../Icon';
export const Input = forwardRef(({ message = 'default', messageText, fillWidth, wrapperClassName, padMessageText, className, onFocus, onBlur, rightElement, leftElement, type = 'text', ...props }, ref) => {
    const { focused, handleOnFocus, handleOnBlur } = useFocus(onFocus, onBlur);
    const rightIcon = useMemo(() => {
        if (rightElement)
            return rightElement;
        let icon = undefined;
        switch (message) {
            case 'warning':
                icon = 'Warning';
                break;
            case 'error':
                icon = 'Error';
                break;
        }
        return icon ? React.createElement(Icon, { className: "ui__input__icon", icon: icon }) : undefined;
    }, [message, rightElement]);
    const wrapperClass = classnames('ui__base ui__input__wrapper', {
        'ui__input__wrapper--fill': fillWidth,
        'ui__input__wrapper--pad': padMessageText && !messageText,
    }, wrapperClassName);
    const mainClass = classnames('ui__input', `ui__input--message-${message}`, { 'ui__input--focused': focused });
    const inputClass = classnames('ui__input__input', { 'ui__input__input--disabled': props.disabled }, className);
    return (React.createElement("div", { className: wrapperClass },
        React.createElement("div", { className: mainClass },
            leftElement,
            React.createElement("input", Object.assign({}, props, { type: type, onFocus: handleOnFocus, onBlur: handleOnBlur, className: inputClass, ref: ref })),
            rightIcon),
        messageText ? React.createElement("div", { className: "ui__input__messageText" }, messageText) : undefined));
});
