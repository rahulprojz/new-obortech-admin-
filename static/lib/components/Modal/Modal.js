import classnames from 'classnames';
import React, { useEffect, useMemo, useCallback, } from 'react';
import { useUnmountDelay } from '../../hooks';
import { getStringId } from '../../utils';
import { ButtonGroup } from '../ButtonGroup';
import { FocusTrap } from '../FocusTrap';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { Overlay } from '../Overlay';
/* eslint-disable jsx-a11y/interactive-supports-focus, jsx-a11y/click-events-have-key-events */
export const Modal = ({ closeOnBackgroundClick, closeOnEscape, heading, open, onClose, fullWidth, noUnmount, wrapperClassName, closeLabel = 'Close', children, buttonGroup, className, role = 'dialog', 'aria-modal': ariaModal = true, ...props }) => {
    const { mounted } = useUnmountDelay(open);
    const headingId = useMemo(() => getStringId('modal_heading'), []);
    const bodyId = useMemo(() => getStringId('modal_body'), []);
    useEffect(() => {
        if (open && closeOnEscape && onClose) {
            const listener = (event) => {
                if (event.key === 'Escape')
                    onClose(event);
            };
            window.addEventListener('keydown', listener);
            return () => window.removeEventListener('keydown', listener);
        }
        return;
    }, [closeOnEscape, onClose, open]);
    const backgroundIsButton = !!(open && closeOnBackgroundClick && onClose);
    const handleBackgroundClick = useCallback((event) => {
        if (!backgroundIsButton)
            return;
        if (event.currentTarget !== event.target)
            return;
        onClose?.(event);
    }, [backgroundIsButton, onClose]);
    const modalWrapperClass = classnames('ui__base ui__modal__wrapper', {
        'ui__modal__wrapper--closed': !open,
        'ui__modal__wrapper--fullWidth': fullWidth,
    }, wrapperClassName);
    const modalClass = classnames('ui__modal', { 'ui__modal--hidden': noUnmount && !mounted }, className);
    const bodyClass = classnames('ui__modal__body', {
        'ui__modal__body--noButton': !buttonGroup,
    });
    return (React.createElement(Overlay, null,
        React.createElement("div", { role: backgroundIsButton ? 'button' : undefined, className: modalWrapperClass, onClick: handleBackgroundClick }, noUnmount || mounted ? (React.createElement("div", { className: "ui__modal__paddingFix" },
            React.createElement(FocusTrap, { focusLastOnUnlock: true, locked: open },
                React.createElement("div", Object.assign({ "aria-labelledby": heading ? headingId : undefined, "aria-describedby": bodyId }, props, { className: modalClass, role: role, "aria-modal": ariaModal }),
                    React.createElement("div", { className: "ui__modal__top" },
                        React.createElement("div", { className: "ui__modal__top__heading", id: headingId }, heading),
                        onClose ? (React.createElement(IconButton, { className: "ui__modal__top__close", onClick: onClose, "aria-label": closeLabel },
                            React.createElement(Icon, { icon: "Close" }))) : undefined),
                    React.createElement("div", { className: bodyClass, id: bodyId }, children),
                    buttonGroup ? React.createElement(ButtonGroup, { className: "ui__modal__buttonGroup" }, buttonGroup) : undefined)))) : undefined)));
};
