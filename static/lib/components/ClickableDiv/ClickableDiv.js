import classnames from 'classnames';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { useAccessibleFocus, useKeyForClick, useOnClick } from '../../hooks';
export const ClickableDiv = forwardRef(({ onClick, onKeyPress, disabled, noFocusStyle, usePointer, className, children, tabIndex, ...divProps }, ref) => {
    const clickableDivRef = useRef(null);
    useImperativeHandle(ref, () => clickableDivRef.current);
    const handleOnClick = useOnClick(onClick, { disabled, stopPropagation: true });
    const handleKeyPress = useKeyForClick(onKeyPress, clickableDivRef);
    const isUserTabbing = useAccessibleFocus();
    const clickableDivClass = classnames('ui__base ui__clickableDiv', {
        'ui__clickableDiv--disabled': disabled,
        'ui__clickableDiv--tabbing': isUserTabbing,
        'ui__clickableDiv--noFocusStyle': noFocusStyle,
        'ui__clickableDiv--usePointer': usePointer && !disabled,
    }, className);
    return (React.createElement("div", Object.assign({}, divProps, { role: "button", tabIndex: disabled ? -1 : tabIndex ?? 0, className: clickableDivClass, onClick: handleOnClick, onKeyPress: handleKeyPress, ref: clickableDivRef }), children));
});
