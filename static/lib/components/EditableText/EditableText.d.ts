import React from 'react';
import { ClickableDivProps } from '../ClickableDiv';
export interface EditableTextProps extends ClickableDivProps {
    /**
     * If provided, value becomes controlled. The component will request to change
     * the value with the onSave callback, and this must be set to change.
     */
    value?: string;
    /**
     * If provided, edit mode becomes controlled. The component will request to
     * enter via the onEdit callback, and this must be set to true to enable.
     */
    editMode?: boolean;
    /**
     * Classname for outermost div.
     */
    className?: string;
    /**
     * Lock the text in view mode. Similar to disabled, but without the reduced
     * opacity.
     */
    locked?: boolean;
    /**
     * A placeholder to display if there's no value. This will also account for
     * `onRenderText`, so if you want to display this then `onRenderText` must
     * return a falsy value like empty string.
     */
    placeholder?: string;
    /**
     * Center the text within the editable text field.
     */
    centerText?: boolean;
    /**
     * Always show a border, and highlight on hover.
     */
    bordered?: boolean;
    /**
     * Callback fired whenever the component wishes to enter edit mode.
     */
    onEdit?(): void;
    /**
     * Callback fired whenever the component wishes to update the value.
     * @param newValue The new value to save.
     */
    onSave?(newValue: string): void;
    /**
     * Callback fired whenever the component wishes to cancel edit mode without
     * saving the new value.
     * @param originalValue The original value to revert to.
     */
    onCancel?(originalValue: string): void;
    /**
     * Render out a custom string to display when not in edit mode.
     * @param value The value of the editable text.
     */
    onRenderText?(value: string): string;
}
export declare const EditableText: React.ForwardRefExoticComponent<EditableTextProps & React.RefAttributes<HTMLDivElement>>;
