import classnames from 'classnames';
import React from 'react';
import { useAccessibleFocus, useFileSubscribe, useFocus } from '../../hooks';
import { ClickableDiv } from '../ClickableDiv';
import { EditableText } from '../EditableText';
import { FilePlaceholder } from '../FilePlaceholder';
import { FileSkeleton } from '../FileSkeleton';
import { Image } from '../Image';
import { ToolButton } from '../ToolButton';
import { thumbnailFocusObservable } from './thumbnailFocusObservable';
export function Thumbnail({ file, label, selected, dragging, otherDragging, buttonProps, selectedIcon, onRename, onEditingChange, imageClassName, className, disabled, onFocus, onBlur, ...divProps }) {
    const isUserTabbing = useAccessibleFocus(thumbnailFocusObservable);
    const { focused, handleOnFocus, handleOnBlur } = useFocus(onFocus, onBlur);
    const [thumbnail, thumbnailErr] = useFileSubscribe(file, (f) => f.thumbnail, 'onthumbnailchange');
    const [name] = useFileSubscribe(file, (f) => f.name, 'onnamechange');
    const handleOnSave = (newName) => {
        onRename?.(newName, file);
        onEditingChange?.(false, file);
    };
    const handleOnCancel = () => {
        onEditingChange?.(false, file);
    };
    const handleOnEdit = () => {
        onEditingChange?.(true, file);
    };
    const thumbnailClass = classnames('ui__base ui__thumbnail', {
        'ui__thumbnail--tabbing': isUserTabbing,
        'ui__thumbnail--selected': selected,
        'ui__thumbnail--focused': focused,
        'ui__thumbnail--disabled': disabled,
        'ui__thumbnail--dragging': dragging,
        'ui__thumbnail--otherDragging': otherDragging,
    }, className);
    return (React.createElement(ClickableDiv, Object.assign({}, divProps, { className: thumbnailClass, noFocusStyle: true, disabled: disabled, onFocus: handleOnFocus, onBlur: handleOnBlur }),
        React.createElement("div", { className: "ui__thumbnail__image" },
            React.createElement(Image, { src: thumbnail, alt: name, pending: !thumbnail && !thumbnailErr, onRenderLoading: () => React.createElement(FileSkeleton, { className: "ui__thumbnail__image__skeleton" }), onRenderFallback: () => (React.createElement(FilePlaceholder, { className: "ui__thumbnail__image__placeholder", extension: file.extension })), className: imageClassName })),
        React.createElement("div", { className: "ui__thumbnail__controls" }, buttonProps?.map(({ key, ...buttonPropObject }) => (React.createElement(ToolButton, { key: key, disabled: disabled, onClick: (e) => buttonPropObject.onClick(e, file) }, buttonPropObject.children)))),
        selectedIcon ? React.createElement("div", { className: "ui__thumbnail__selectedIcon" }, selectedIcon) : undefined,
        (label ?? name) || onRename ? (React.createElement(EditableText, { className: "ui__thumbnail__label", value: label ?? name, centerText: true, disabled: disabled, locked: !onRename || otherDragging, onSave: handleOnSave, onCancel: handleOnCancel, onEdit: handleOnEdit })) : undefined));
}
