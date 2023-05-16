import React, { ButtonHTMLAttributes } from 'react';
export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /**
     * Defaults to 'button' instead of 'submit' to prevent accidental submissions.
     * @default "button"
     */
    type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
}
export declare const IconButton: React.ForwardRefExoticComponent<IconButtonProps & React.RefAttributes<HTMLButtonElement>>;
