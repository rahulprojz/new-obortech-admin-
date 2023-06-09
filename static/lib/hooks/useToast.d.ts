/// <reference types="@emotion/core" />
import { MouseEventHandler, ReactNode } from 'react';
export interface CommonToastProps {
    /**
     * The heading to display on the toast. Use this for a brief overview of the
     * reason for the toast.
     */
    heading: ReactNode;
    /**
     * The body of the toast. This is where you can elaborate with more
     * information about the toast.
     */
    children?: ReactNode;
    /**
     * The type of message the toast is displaying. Will change the color and
     * icon of the toast.
     * @default "info"
     */
    message?: 'info' | 'success' | 'warning' | 'error' | 'loading';
    /**
     * Adds an action button to the toast. Will position to the left of the close
     * button if `onClose` was provided.
     */
    action?: {
        text: ReactNode;
        onClick: MouseEventHandler<HTMLButtonElement>;
    };
}
export interface AddToast extends CommonToastProps {
    /**
     * If true, toast will have a close button.
     * @default true
     */
    closable?: boolean;
    /**
     * If provided, will set a timeout for the toast to disappear. This will
     * override the `defaultTimeout` prop from `ToastProvider`. Give a value of
     * 0 to prevent the toast from timing out.
     * @default defaultTimeout
     */
    timeout?: number;
}
export interface ToastContextValue {
    /**
     * Add a toast with parameters outlined by the `AddToast` object.
     * @param toast Adds this toast to the end of the queue.
     * @returns The ID of the added toast to use for early removal.
     */
    add(toast: AddToast): number;
    /**
     * Remove a toast by ID. If no ID provided, removes the current toast.
     * @param toastId The ID of the toast to remove.
     */
    remove(toastId?: number): void;
    /**
     * Modify a toast by providing the ID, then a partial toast object with fields
     * you wish to update.
     * @param toastId The ID of the toast to update.
     * @param toUpdate The toast fields to update.
     */
    modify(toastId: number, toUpdate: Partial<AddToast>): void;
    /**
     * Returns true if toast exists in the queue.
     * @param toastId The ID of the toast to check.
     */
    exists(toastId: number): boolean;
}
export declare const ToastContext: import("react").Context<ToastContextValue>;
/**
 * Returns the toast context object for managing toasts.
 */
export declare function useToast(): ToastContextValue;
