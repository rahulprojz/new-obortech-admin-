import { useCallback } from 'react';
import { generateClickEventFromKeyboardEvent } from '../utils';
/**
 * Returns the handler for onKeyPress. If it hears a space or Enter key, it will
 * fire onClick. If you provide a ref, will compare the target and make sure it
 * is the same as the ref, then will fire onClick on the ref. Otherwise will
 * call it on the event target.
 * @param onKeyPress The onKeyPress prop if it's available.
 * @param ref If given, will compare event target to prevent any bubbling events.
 */
export function useKeyForClick(onKeyPress, ref) {
    const handler = useCallback((event) => {
        // Fire click on space or enter press.
        if (event.key === ' ' || event.key === 'Enter') {
            const clickEvent = generateClickEventFromKeyboardEvent(event);
            // If ref is provided and it matches the event target, click ref.
            if (ref && event.target === ref.current) {
                ref.current.dispatchEvent(clickEvent);
                // Stop scrolling if space is pressed.
                if (event.key === ' ')
                    event.preventDefault();
            }
            else if (!ref) {
                event.target.dispatchEvent(clickEvent);
            }
        }
        onKeyPress?.(event);
    }, [ref, onKeyPress]);
    return handler;
}
