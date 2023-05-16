import { KeyboardEvent, KeyboardEventHandler, RefObject } from 'react';
/**
 * Returns the handler for onKeyPress. If it hears a space or Enter key, it will
 * fire onClick. If you provide a ref, will compare the target and make sure it
 * is the same as the ref, then will fire onClick on the ref. Otherwise will
 * call it on the event target.
 * @param onKeyPress The onKeyPress prop if it's available.
 * @param ref If given, will compare event target to prevent any bubbling events.
 */
export declare function useKeyForClick<T extends HTMLElement>(onKeyPress?: KeyboardEventHandler<T>, ref?: RefObject<T>): (event: KeyboardEvent<T>) => void;
