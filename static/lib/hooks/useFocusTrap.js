import { useCallback, useEffect, useRef } from 'react';
import { focusableElementDomString } from '../utils';
import { useCurrentRef } from './useCurrentRef';
/**
 * A hook for trapping focus within an element. Returns a ref which can be given
 * to any element to trap focus within that element when `locked` is true.
 * @param locked When true, focus will be locked within the element you passed
 * the returned ref to.
 * @param options Options to control the focus trap.
 */
export function useFocusTrap(locked = false, options = {}) {
    const focusLastOnUnlock = options.focusLastOnUnlock;
    const focusRef = useRef(null);
    // Get the focusable elements. Assumes that focusRef exists. DON'T CALL if
    // you haven't asserted existance of focusRef.current.
    const getFocusableElements = useCallback(() => {
        return focusRef.current.querySelectorAll(focusableElementDomString);
    }, []);
    // Cycles tabs within the lock zone when enabled, or prevents default
    // if there are no elements within the lock (rare edge case).
    const lockFocus = useCallback((event) => {
        // Return if not locked, other key pressed, or no ref.
        if (!locked || (event && event.key !== 'Tab') || !focusRef.current)
            return;
        const focusableElements = getFocusableElements();
        // If no focusable elements, simply prevent tab default.
        if (!focusableElements.length)
            return event?.preventDefault();
        const focusedItemIndex = findFocusableIndex(focusableElements, document.activeElement);
        // If focused inside and initial call (no event), leave focused element.
        if (focusedItemIndex !== -1 && !event)
            return;
        // If focused outside, or tabbing past last element, cycle to beginning.
        if (focusedItemIndex === -1 || (!event?.shiftKey && focusedItemIndex === focusableElements.length - 1)) {
            focusableElements[0].focus();
            return event?.preventDefault();
        }
        // If tabbing backwards and focusing first element, cycle to end.
        if (event?.shiftKey && focusedItemIndex === 0) {
            focusableElements[focusableElements.length - 1].focus();
            return event?.preventDefault();
        }
    }, [getFocusableElements, locked]);
    // Ensure that user can not focus outside of lock. If an attempt is made
    // and focusable elements exist inside, will focus first element inside.
    const checkFocus = useCallback((event) => {
        // Return if not locked or no focus ref.
        if (!locked || !focusRef.current)
            return;
        // Blur focus target if no focusable elements.
        const focusableElements = getFocusableElements();
        if (!focusableElements.length)
            return event.target?.blur();
        // Focus initial element if focused outside.
        const focusedItemIndex = findFocusableIndex(focusableElements, event.target);
        if (focusedItemIndex === -1)
            return focusableElements[0].focus();
    }, [getFocusableElements, locked]);
    // Add document listeners for lock focus and check focus
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        document.addEventListener('keydown', lockFocus);
        document.addEventListener('focusin', checkFocus);
        return () => {
            document.removeEventListener('keydown', lockFocus);
            document.removeEventListener('focusin', checkFocus);
        };
    }, [checkFocus, lockFocus]);
    // Keep the ref to focusLastOnUnlock fresh, prevents useEffect refresh.
    const focusLastOnUnlockRef = useCurrentRef(focusLastOnUnlock);
    // When locked is changed, will maybe store last element focused prior
    // to lock being enabled, and will call lockFocus to focus first element
    // if it exists. Returns when locked is disabled, and will focus prior
    // element if stored (return focus to previous element).
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        let lastFocusedElement;
        if (locked) {
            if (focusLastOnUnlockRef.current && !focusRef.current?.contains(document.activeElement)) {
                lastFocusedElement = document.activeElement;
                lockFocus();
                return () => lastFocusedElement.focus();
            }
            lockFocus();
        }
        return;
    }, [focusLastOnUnlockRef, lockFocus, locked]);
    return focusRef;
}
export function findFocusableIndex(elements, toFind) {
    let index = -1;
    if (!toFind)
        return index;
    for (let i = 0; i < elements.length; i++) {
        if (elements[i] === toFind) {
            index = i;
            break;
        }
    }
    return index;
}
