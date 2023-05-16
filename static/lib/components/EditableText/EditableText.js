import classnames from 'classnames';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useAccessibleFocus } from '../../hooks';
import { ClickableDiv } from '../ClickableDiv';
export const EditableText = forwardRef(({ value: controlledValue, editMode: controlledEditMode, onEdit, onSave, onCancel, className, disabled, locked, onRenderText, placeholder, centerText, bordered, ...clickableDivProps }, ref) => {
    const inputRef = useRef(null);
    const buttonRef = useRef(null);
    useImperativeHandle(ref, () => buttonRef.current);
    // Use state if controlled edit mode not provided.
    const [stateEditMode, setStateEditMode] = useState(false);
    const editMode = controlledEditMode ?? stateEditMode;
    // Use state if controlled value not provided.
    const [stateValue, setStateValue] = useState('');
    const value = controlledValue ?? stateValue;
    // Keep edit value in sync with value (controlled or state) and reset when
    // edit mode is cancelled.
    const [editValue, setEditValue] = useState(value);
    useEffect(() => setEditValue(value), [editMode, value]);
    const [noFocusTransition, setNoFocusTransition] = useState(false);
    // Focus input whenever edit mode is enabled, and button when disabled.
    const firstRender = useRef(true);
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
        }
        else if (editMode) {
            inputRef.current?.focus();
            setNoFocusTransition(true);
        }
        else {
            buttonRef.current?.focus();
            setNoFocusTransition(false);
        }
    }, [editMode]);
    const handleOnEdit = () => {
        if (controlledEditMode === undefined)
            setStateEditMode(true);
        onEdit?.();
    };
    const handleOnCancel = () => {
        if (controlledEditMode === undefined)
            setStateEditMode(false);
        setEditValue(value);
        onCancel?.(value);
    };
    const handleOnSave = () => {
        if (controlledValue === undefined)
            setStateValue(editValue);
        if (controlledEditMode === undefined)
            setStateEditMode(false);
        onSave?.(editValue);
    };
    const handleOnKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleOnSave();
            event.stopPropagation();
        }
    };
    const handleOnKeyDown = (event) => {
        if (event.key === 'Escape') {
            handleOnCancel();
        }
        event.stopPropagation();
    };
    const [valueToDisplay, isPlaceholder] = useMemo(() => {
        const renderedValue = onRenderText ? onRenderText(value) : value;
        if (placeholder && !renderedValue)
            return [placeholder, true];
        return [renderedValue, false];
    }, [onRenderText, placeholder, value]);
    const isUserTabbing = useAccessibleFocus();
    const editableTextClass = classnames('ui__base ui__editableText', {
        'ui__editableText--disabled': disabled,
        'ui__editableText--locked': locked,
        'ui__editableText--centerText': centerText,
        'ui__editableText--bordered': bordered,
    }, className);
    const buttonClass = classnames('ui__editableText__button', {
        'ui__editableText__button--placeholder': isPlaceholder,
        'ui__editableText__button--noFocusTransition': noFocusTransition,
    });
    const fieldClass = classnames('ui__editableText__field', {
        'ui__editableText__field--tabbing': isUserTabbing,
    });
    return (React.createElement("div", { className: editableTextClass }, editMode ? (React.createElement("input", { className: fieldClass, value: editValue, onChange: (e) => setEditValue(e.target.value), onKeyPress: handleOnKeyPress, onKeyDown: handleOnKeyDown, ref: inputRef, onBlur: handleOnSave, onClick: (e) => e.stopPropagation() })) : (React.createElement(ClickableDiv, Object.assign({}, clickableDivProps, { className: buttonClass, disabled: disabled || locked, onClick: handleOnEdit, ref: buttonRef, usePointer: true }),
        React.createElement("span", null, valueToDisplay)))));
});
