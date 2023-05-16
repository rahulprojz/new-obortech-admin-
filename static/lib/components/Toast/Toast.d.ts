import { AriaAttributes, FC, HTMLAttributes, MouseEventHandler } from 'react';
import { CommonToastProps } from '../../hooks';
export interface ToastProps extends CommonToastProps, HTMLAttributes<HTMLDivElement> {
    /**
     * If provided, toast will have a close button.
     */
    onClose?: MouseEventHandler<HTMLButtonElement>;
    /**
     * Provide alongside `onClose` for localized accessibility.
     * @default "Close"
     */
    closeLabel?: AriaAttributes['aria-label'];
    /** @default "status" */
    role?: HTMLAttributes<HTMLDivElement>['role'];
    /** @default "polite" */
    'aria-live'?: AriaAttributes['aria-live'];
    /** @default true */
    'aria-atomic'?: AriaAttributes['aria-atomic'];
}
export declare const Toast: FC<ToastProps>;
