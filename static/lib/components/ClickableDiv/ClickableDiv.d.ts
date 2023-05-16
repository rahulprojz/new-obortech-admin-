import React, { HTMLAttributes } from 'react';
import { Remove } from '../../utils';
export interface ClickableDivProps extends Remove<HTMLAttributes<HTMLDivElement>, 'role'> {
    /**
     * Is the clickable div disabled. Disabled will stop the onClick callback from
     * firing (similar to a button).
     */
    disabled?: boolean;
    /**
     * No style when focused. If true will have no focus outline.
     */
    noFocusStyle?: boolean;
    /**
     * Specify whether clickable div uses a pointer cursor. Otherwise is default.
     */
    usePointer?: boolean;
}
export declare const ClickableDiv: React.ForwardRefExoticComponent<ClickableDivProps & React.RefAttributes<HTMLDivElement>>;
