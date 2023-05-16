import classnames from 'classnames';
import React, { useMemo } from 'react';
import { getStringId } from '../../utils';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { IconButton } from '../IconButton';
import { Spinner } from '../Spinner';
export const Toast = ({ heading, children, message = 'info', onClose, closeLabel = 'Close', action, className, role = 'status', 'aria-live': ariaLive = 'polite', 'aria-atomic': ariaAtomic = true, ...props }) => {
    const headingId = useMemo(() => getStringId('toast_heading'), []);
    const bodyId = useMemo(() => getStringId('toast_body'), []);
    const icon = useMemo(() => {
        switch (message) {
            case 'info':
                return 'Info';
            case 'success':
                return 'Success';
            case 'warning':
                return 'Warning';
            case 'error':
                return 'Error';
            case 'loading':
                return undefined;
        }
    }, [message]);
    const toastClass = classnames('ui__base ui__toast', `ui__toast--message-${message}`, className);
    return (React.createElement("div", Object.assign({ "aria-labelledby": heading ? headingId : undefined, "aria-describedby": children ? bodyId : undefined }, props, { className: toastClass, role: role, "aria-live": ariaLive, "aria-atomic": ariaAtomic }),
        React.createElement("div", { className: "ui__toast__border" }),
        icon ? React.createElement(Icon, { icon: icon, className: "ui__toast__icon" }) : React.createElement(Spinner, { className: "ui__toast__spinner" }),
        React.createElement("div", { className: "ui__toast__copy" },
            heading ? (React.createElement("div", { className: "ui__toast__copy__heading", id: headingId }, heading)) : undefined,
            children ? (React.createElement("div", { className: "ui__toast__copy__body", id: bodyId }, children)) : undefined),
        action ? (React.createElement("div", { className: "ui__toast__action" },
            React.createElement(Button, { className: "ui__toast__button", onClick: action.onClick, buttonStyle: "borderless" }, action.text))) : undefined,
        onClose ? (React.createElement("div", { className: "ui__toast__action" },
            React.createElement(IconButton, { onClick: onClose, "aria-label": closeLabel },
                React.createElement(Icon, { icon: "Close" })))) : undefined));
};
