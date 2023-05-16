import { FC } from 'react';
import { CommonToastProps } from '../../hooks';
export interface ToastProviderProps {
    /**
     * If provided, added toasts will disappear in this timeout. This is
     * overridden if the `timeout` property is specified for an added toast.
     */
    defaultTimeout?: number;
    /**
     * Specify toast types that should have no timeout by default. Provide a toast
     * type, or array of types. This could be used to persist error toasts until
     * they are cleared manually.
     */
    noTimeout?: CommonToastProps['message'] | CommonToastProps['message'][];
    /**
     * Specify the location where the toasts will appear from.
     * @default "top-right"
     */
    position?: 'top-left' | 'top' | 'top-right' | 'bottom-left' | 'bottom' | 'bottom-right';
    /**
     * If provided, will position the toast this number of pixels away from the
     * edge of the screen. This only applies on the y axis, you will have to use
     * `className` to add any other styles.
     */
    customPadding?: number;
    /**
     * Custom classname for the div that wraps the toast. This can be used to add
     * custom padding or override the animations.
     */
    className?: string;
}
export declare const ToastProvider: FC<ToastProviderProps>;
