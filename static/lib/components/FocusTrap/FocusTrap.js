import { cloneElement } from 'react';
import { useFocusTrap } from '../../hooks';
export const FocusTrap = ({ locked, focusLastOnUnlock, children }) => {
    const focusRef = useFocusTrap(locked, { focusLastOnUnlock });
    return cloneElement(children, { ref: focusRef });
};
