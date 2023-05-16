import { FocusEvent, FocusEventHandler } from 'react';
/**
 * Returns handlers for onFocus and onBlur, as well as a property focused which
 * is true if the component or any child is being focused.
 * @param onFocus The onFocus prop if it's available.
 * @param onBlur The onBlur prop if it's available.
 */
export declare function useFocus<T>(onFocus?: FocusEventHandler<T>, onBlur?: FocusEventHandler<T>): {
    focused: boolean;
    handleOnFocus: (event: FocusEvent<T>) => void;
    handleOnBlur: (event: FocusEvent<T>) => void;
};
