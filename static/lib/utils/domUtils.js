/**
 * Returns an object describing whether the object is visible. It will detect if
 * the item is cut off by either the top or bottom of the window, or by the
 * container passed in.
 * @param element The element to detect scroll position of.
 * @param container The scroll container which could be cutting off the item.
 */
export function isScrolledIntoView(element, container) {
    if (!element || !container)
        return { isVisible: true, isAbove: false, isBelow: false };
    const elem = element.getBoundingClientRect();
    const cont = container.getBoundingClientRect();
    const elemTop = elem.top;
    const elemBottom = elem.bottom;
    // Can be cut off by container, or by window if container extends outside.
    const contTop = Math.max(cont.top, 0);
    const contBottom = Math.min(cont.bottom, window.innerHeight);
    // Only completely visible elements return true:
    const isAbove = elemTop < contTop;
    const isBelow = elemBottom > contBottom;
    const isVisible = !isAbove && !isBelow;
    return { isVisible, isAbove, isBelow };
}
/**
 * Get a sibling in the DOM based on an index diff.
 * @param element The element to find the sibling of.
 * @param indexDiff The index diff of the sibling to find (ex: 1 returns next sibling).
 */
export function getSibling(element, indexDiff) {
    if (!element || !element.parentElement)
        return undefined;
    const siblings = Array.from(element.parentElement.children);
    const nodeIndex = siblings.indexOf(element);
    // Get the item occupying the previous index location.
    const sibling = siblings[nodeIndex + indexDiff];
    return sibling;
}
/**
 * Generates a click mouse event from an input keyboard event.
 * @param keyboardEvent The keyboard event to translate into a mouse event.
 */
export function generateClickEventFromKeyboardEvent(keyboardEvent) {
    const clickEvent = new MouseEvent('click', {
        bubbles: keyboardEvent.bubbles,
        cancelable: keyboardEvent.cancelable,
        altKey: keyboardEvent.altKey,
        shiftKey: keyboardEvent.shiftKey,
        ctrlKey: keyboardEvent.ctrlKey,
        metaKey: keyboardEvent.metaKey,
    });
    return clickEvent;
}
/**
 * A string for querying all focusable elements.
 */
export const focusableElementDomString = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
    'select:not([disabled]):not([aria-hidden])',
    'textarea:not([disabled]):not([aria-hidden])',
    'button:not([disabled]):not([aria-hidden])',
    'iframe',
    'object',
    'embed',
    '[contenteditable]',
    '[tabindex]:not([tabindex^="-"])',
].join(',');
