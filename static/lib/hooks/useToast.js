import { createContext, useContext } from 'react';
export const ToastContext = createContext({});
/**
 * Returns the toast context object for managing toasts.
 */
export function useToast() {
    return useContext(ToastContext);
}
