import { FC } from 'react';
export interface FilePlaceholderProps {
    /**
     * Classname of the placeholder wrapper.
     */
    className?: string;
    /**
     * The file extension to display on the placeholder.
     */
    extension?: string;
}
export declare const FilePlaceholder: FC<FilePlaceholderProps>;
