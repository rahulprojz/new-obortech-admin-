import React, { InputHTMLAttributes, ReactNode } from 'react';
declare type InputTypes = 'color' | 'date' | 'datetime-local' | 'email' | 'month' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'time' | 'url' | 'week';
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    /**
     * Messaging feedback for the input. This can be used for displaying feedback
     * inside of forms.
     * @default "default"
     */
    message?: 'default' | 'warning' | 'error';
    /**
     * Text to display under the input describing the message.
     */
    messageText?: string;
    /**
     * Should this input fill the width of the parent container.
     */
    fillWidth?: boolean;
    /**
     * A class for the wrapper div which encompases the input and icon and warning
     * texrt. Use this to do things like add margin-bottom to the entire input for
     * alignment in forms.
     */
    wrapperClassName?: string;
    /**
     * If true, will add padding below the input to compensate for message text
     * being absent. This prevents UI jumping when message text appears.
     */
    padMessageText?: boolean;
    /**
     * A custom element to place on the right of the input.
     */
    rightElement?: ReactNode;
    /**
     * A custom element to place on the left of the input.
     */
    leftElement?: ReactNode;
    /**
     * A smaller subset of all possible input types.
     * @default "text"
     */
    type?: InputTypes;
}
export declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
export {};
