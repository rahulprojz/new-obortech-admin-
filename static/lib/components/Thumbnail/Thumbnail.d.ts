import { MouseEvent, ReactNode, ReactText } from 'react';
import { FileLike } from '../../data';
import { ClickableDivProps } from '../ClickableDiv';
export interface ThumbnailButtonProps<F> {
    key: ReactText;
    onClick: (event: MouseEvent<HTMLButtonElement>, file: F) => void;
    children: ReactNode;
}
export interface ThumbnailProps<F> extends ClickableDivProps {
    /**
     * The file to display the thumbnail from.
     */
    file: F;
    /**
     * Optional label. Will fallback to file name if not provided. To remove label
     * you can set `label` to an empty string.
     */
    label?: string;
    /**
     * Display thumbnail with selected props.
     */
    selected?: boolean;
    /**
     * Display this thumbnail as a dragging item.
     */
    dragging?: boolean;
    /**
     * Set to true while other thumbnails are dragging to prevent changes to
     * appearance due to mouse hover.
     */
    otherDragging?: boolean;
    /**
     * Provide an array of button props to add tool buttons on thumbnail. Each
     * must have a unique ID.
     */
    buttonProps?: ThumbnailButtonProps<F>[];
    /**
     * A node to render on the top-left of the thumbnail.
     */
    selectedIcon?: ReactNode;
    /**
     * Class for the thumbnail image.
     */
    imageClassName?: string;
    /**
     * Callback fired when the name is edited and saved.
     * @param newName The new name to set on the file.
     * @param file The target file.
     */
    onRename?(newName: string, file: F): void;
    /**
     * Callback fired whenever edit mode changes.
     * @param isEditing Is the target currently editing.
     * @param file The target file.
     */
    onEditingChange?(isEditing: boolean, file: F): void;
}
export declare function Thumbnail<F extends FileLike>({ file, label, selected, dragging, otherDragging, buttonProps, selectedIcon, onRename, onEditingChange, imageClassName, className, disabled, onFocus, onBlur, ...divProps }: ThumbnailProps<F>): JSX.Element;
