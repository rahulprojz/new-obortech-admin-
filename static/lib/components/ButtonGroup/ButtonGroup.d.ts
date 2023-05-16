import { FC, HTMLAttributes } from 'react';
export interface ButtonGroupProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * Position the buttons within the group.
     * @default "right"
     */
    position?: 'left' | 'center' | 'right' | 'space-between' | 'space-around';
    /**
     * If given, will wrap the buttons in reverse order. This is valuable if you
     * have an accept button on the left, but want it on the bottom when wrapped.
     */
    reverseWrap?: boolean;
    /**
     * Center the buttons at mobile widths.
     */
    centerMobile?: boolean;
}
export declare const ButtonGroup: FC<ButtonGroupProps>;
