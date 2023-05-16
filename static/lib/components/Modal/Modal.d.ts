import { AriaAttributes, FC, HTMLAttributes, MouseEvent, ReactNode } from 'react';
export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * Heading to display at the top of the modal.
     */
    heading?: ReactNode;
    /**
     * The primary body content of the modal.
     */
    children: ReactNode;
    /**
     * Content, generally buttons, can be passed to this prop in order to render
     * them within a special button group section at the bottom of the modal.
     */
    buttonGroup?: ReactNode;
    /**
     * If given, modal will fire `onClose` (if provided) when the background is
     * clicked.
     */
    closeOnBackgroundClick?: boolean;
    /**
     * If given, modal will fire `onClose` (if provided) when escape key is
     * pressed.
     */
    closeOnEscape?: boolean;
    /**
     * Modal opens when true.
     */
    open?: boolean;
    /**
     * If given, modal will have a close button, and clicking it will fire this
     * callback function.
     * @param event Either a mouse event (background or close button clicked) or
     * a keyboard event (escape key pressed).
     */
    onClose?(event: KeyboardEvent | MouseEvent): void;
    /**
     * Modal does not have a max width.
     */
    fullWidth?: boolean;
    /**
     * Do not unmount the modal when it is closed.
     */
    noUnmount?: boolean;
    /**
     * Class for the outermost wrapper
     */
    wrapperClassName?: string;
    /**
     * Provide alongside `onClose` for localized accessibility.
     * @default "Close"
     */
    closeLabel?: AriaAttributes['aria-label'];
    /** @default "dialog" */
    role?: HTMLAttributes<HTMLDivElement>['role'];
    /** @default true */
    'aria-modal'?: AriaAttributes['aria-atomic'];
}
export declare const Modal: FC<ModalProps>;
