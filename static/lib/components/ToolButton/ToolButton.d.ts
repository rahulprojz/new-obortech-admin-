import React, { ButtonHTMLAttributes, RefAttributes } from 'react';
import { Remove } from '../../utils';
export interface ToolButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /**
     * If provided will add an expand button. You can provide any standard button
     * props, except for children (children will be a drop down arrow
     * automatically). There is an additional `position` prop so you can set
     * the position to be `'right'` rather than the default `'bottom'`.
     */
    expandProps?: {
        position?: 'right' | 'bottom';
    } & Remove<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & RefAttributes<HTMLButtonElement>;
}
export declare const ToolButton: React.ForwardRefExoticComponent<ToolButtonProps & React.RefAttributes<HTMLButtonElement>>;
