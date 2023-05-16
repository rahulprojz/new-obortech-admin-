import React, { InputHTMLAttributes, ReactNode } from 'react';
import { Remove } from '../../utils';
export interface ChoiceProps extends Remove<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    /**
     * Label is optional, but it is encouraged to add the `aria-label` prop if you
     * are not labeling the choice, or if label is not a string.
     */
    label?: ReactNode;
    /**
     * If true, label will appear to the left of the choice.
     */
    leftLabel?: boolean;
    /**
     * Choice is a checkbox unless radio is true, in which case it is a radio
     * button.
     */
    radio?: boolean;
    /**
     * Choice becomes a switch, rather than a checkbox or radio. It will still
     * behave as either a checkbox, or radio if `radio` is true.
     */
    isSwitch?: boolean;
    /**
     * If true, choice will be centered vertically in the content.
     */
    center?: boolean;
    /**
     * If true, text will change color when Choice is disabled.
     */
    disabledLabelChange?: boolean;
}
export declare const Choice: React.ForwardRefExoticComponent<ChoiceProps & React.RefAttributes<HTMLInputElement>>;
