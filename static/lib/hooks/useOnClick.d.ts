import { MouseEvent, MouseEventHandler } from 'react';
export interface UseOnClickOptions {
    stopPropagation?: boolean;
    preventDefault?: boolean;
    blurOnClick?: boolean;
    disabled?: boolean;
}
declare type UseOnClickOutput<T> = (event: MouseEvent<T>) => void;
/**
 * Returns the handler for onClick. Allows you to add specific options to the
 * event before passing it through to the default onClick.
 * @param onClick The onClick prop if it's available.
 * @param options UseOnClickOptions for the hook.
 */
export declare function useOnClick<T>(onClick?: MouseEventHandler<T>, options?: UseOnClickOptions): UseOnClickOutput<T>;
export {};
