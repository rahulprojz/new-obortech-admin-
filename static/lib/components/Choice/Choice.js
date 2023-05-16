import classnames from 'classnames';
import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, } from 'react';
import { useAccessibleFocus, useFocus } from '../../hooks';
import { useID } from '../../hooks/useID';
import { Icon } from '../Icon';
export const Choice = forwardRef(({ label, leftLabel, className, children, id, radio, isSwitch, center, disabledLabelChange, onChange, onFocus, onBlur, ...props }, ref) => {
    const inputRef = useRef(null);
    useImperativeHandle(ref, () => inputRef.current);
    const isUserTabbing = useAccessibleFocus();
    const { focused, handleOnFocus, handleOnBlur } = useFocus(onFocus, onBlur);
    const choiceID = useID(id);
    const [checked, setChecked] = useState(() => props.checked ?? inputRef.current?.checked ?? false);
    useEffect(() => {
        if (props.checked !== undefined)
            setChecked(props.checked);
    }, [props.checked]);
    const handleOnChange = (event) => {
        if (props.checked === undefined)
            setChecked(event.target.checked);
        onChange?.(event);
    };
    // HACK: since there is no way to detect that a radio button is being
    // unchecked due to form activity, we subscribe all radio buttons to an
    // observable. When checked changes and props.checked is undefined, this
    // will trigger the observable which will ping all other subscribers to
    // check if they have become unchecked, and if so change their internal
    // state.
    useEffect(() => {
        if (props.name && radio) {
            return observable.subscribe(props.name, () => {
                if (inputRef.current && inputRef.current.checked !== checked) {
                    setChecked(inputRef.current.checked);
                }
            });
        }
        return;
    }, [checked, props.name, radio]);
    const choiceClass = classnames('ui__base ui__choice', {
        'ui__choice--radio': radio,
        'ui__choice--leftLabel': leftLabel,
        'ui__choice--checked': checked,
        'ui__choice--center': center,
        'ui__choice--disabled': props.disabled,
    }, className);
    const inputClass = classnames('ui__choice__input', {
        'ui__choice__input--switch': isSwitch,
    });
    const checkClass = isSwitch
        ? classnames('ui__choice__input__switch', {
            'ui__choice__input__switch--checked': checked,
            'ui__choice__input__switch--disabled': props.disabled,
            'ui__choice__input__switch--focus': isUserTabbing && focused,
        })
        : classnames('ui__choice__input__check', {
            'ui__choice__input__check--checked': checked,
            'ui__choice__input__check--disabled': props.disabled,
            'ui__choice__input__check--focus': isUserTabbing && focused,
        });
    const labelClass = classnames('ui__choice__label', {
        'ui__choice__label--disabled': props.disabled && disabledLabelChange,
    });
    const labelElement = useMemo(() => {
        if (!label)
            return undefined;
        return (React.createElement("label", { className: labelClass, htmlFor: choiceID }, label));
    }, [choiceID, label, labelClass]);
    return (React.createElement("span", { className: choiceClass },
        leftLabel ? labelElement : undefined,
        React.createElement("span", { className: inputClass },
            isSwitch ? (React.createElement("div", { className: checkClass },
                React.createElement("div", { className: "ui__choice__input__toggle" }))) : (React.createElement("div", { className: checkClass }, checked && !radio ? React.createElement(Icon, { icon: "Check", className: "ui__choice__input__icon" }) : undefined)),
            React.createElement("input", Object.assign({}, props, { id: choiceID, type: radio ? 'radio' : 'checkbox', onChange: handleOnChange, ref: inputRef, onFocus: handleOnFocus, onBlur: handleOnBlur }), children)),
        !leftLabel ? labelElement : undefined));
});
/**
 * Observable helper to notify radio buttons that they have become unchecked.
 */
class RadioObservable {
    constructor() {
        this._subscribers = [];
    }
    subscribe(name, subscriber) {
        this._trigger(name);
        this._subscribers.push({ name, subscriber });
        return this._unsubscribe(subscriber);
    }
    _trigger(name) {
        this._subscribers.forEach((s) => {
            if (name === s.name)
                s.subscriber();
        });
    }
    _unsubscribe(subscriber) {
        return () => {
            this._subscribers = this._subscribers.filter((s) => s.subscriber !== subscriber);
        };
    }
}
const observable = new RadioObservable();
