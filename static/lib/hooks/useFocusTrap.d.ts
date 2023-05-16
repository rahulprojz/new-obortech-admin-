import { RefObject } from 'react';
export interface UseFocusTrapOptions {
    /**
     * If true, will focus the previously-focused element on focus lock off.
     */
    focusLastOnUnlock?: boolean;
}
/**
 * A hook for trapping focus within an element. Returns a ref which can be given
 * to any element to trap focus within that element when `locked` is true.
 * @param locked When true, focus will be locked within the element you passed
 * the returned ref to.
 * @param options Options to control the focus trap.
 */
export declare function useFocusTrap<T extends HTMLElement>(locked?: boolean, options?: UseFocusTrapOptions): RefObject<T>;
export declare function findFocusableIndex(elements: NodeListOf<HTMLElement>, toFind: Element | EventTarget | null): number;
