import { KeyboardEvent } from 'react';
/**
 * Returns an object describing whether the object is visible. It will detect if
 * the item is cut off by either the top or bottom of the window, or by the
 * container passed in.
 * @param element The element to detect scroll position of.
 * @param container The scroll container which could be cutting off the item.
 */
export declare function isScrolledIntoView(element: Element | null | undefined, container: Element | null | undefined): {
    isVisible: boolean;
    isAbove: boolean;
    isBelow: boolean;
};
/**
 * Get a sibling in the DOM based on an index diff.
 * @param element The element to find the sibling of.
 * @param indexDiff The index diff of the sibling to find (ex: 1 returns next sibling).
 */
export declare function getSibling(element: HTMLElement | null | undefined, indexDiff: number): Element | undefined;
/**
 * Generates a click mouse event from an input keyboard event.
 * @param keyboardEvent The keyboard event to translate into a mouse event.
 */
export declare function generateClickEventFromKeyboardEvent(keyboardEvent: KeyboardEvent<HTMLElement>): MouseEvent;
/**
 * A string for querying all focusable elements.
 */
export declare const focusableElementDomString: string;
