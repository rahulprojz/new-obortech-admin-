import classnames from 'classnames';
import React from 'react';
import { EditableText } from '../EditableText';
import { IconButton } from '../IconButton';
import { Icon } from '../Icon';
export const FilePicker = ({ items, className, ...props }) => {
    const filePickerClass = classnames('ui__base ui__filePicker', className);
    return (React.createElement("div", Object.assign({}, props, { className: filePickerClass }), items.map((item) => (React.createElement("div", { className: classnames('ui__filePicker__file', item.className), key: item.key },
        React.createElement(EditableText, { className: "ui__filePicker__file__text", value: item.name, onSave: item.onRename, locked: !item.onRename }),
        item.onDelete ? (React.createElement(IconButton, { className: "ui__filePicker__file__delete", onClick: item.onDelete },
            React.createElement(Icon, { icon: "Close" }))) : undefined)))));
};
