import classnames from 'classnames';
import React from 'react';
export const Spinner = ({ spinnerSize = 'default', className }) => {
    const spinnerClass = classnames('ui__base ui__spinner', `ui__spinner--size-${spinnerSize}`, className);
    return (React.createElement("div", { className: spinnerClass },
        React.createElement("div", { className: "ui__spinner__animated" })));
};
