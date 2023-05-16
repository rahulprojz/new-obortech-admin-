/// <reference types="react" />
export interface SpinnerProps {
    /**
     * Set the size of the spinner.
     * @default "default"
     */
    spinnerSize?: 'tiny' | 'small' | 'default' | 'large';
    /**
     * Classname for the container div.
     */
    className?: string;
}
export declare const Spinner: ({ spinnerSize, className }: SpinnerProps) => JSX.Element;
