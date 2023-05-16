import React, { ButtonHTMLAttributes } from 'react';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /**
     * Sets the visual appearance of the button.
     * @default "default"
     */
    buttonStyle?: 'default' | 'borderless' | 'outline';
    /**
     * Sets the size of the button.
     * @default "default"
     */
    buttonSize?: 'small' | 'default' | 'large';
    /**
     * Defaults to 'button' instead of 'submit' to prevent accidental submissions.
     * @default "button"
     */
    type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
}
export declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
