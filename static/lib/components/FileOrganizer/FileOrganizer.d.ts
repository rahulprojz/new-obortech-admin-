import { HTMLAttributes, ReactNode, Ref } from 'react';
import { FixedSizeGrid } from 'react-window';
import { ObjectWithId } from '../../utils';
export interface FileOrganizerProps<F> extends HTMLAttributes<HTMLDivElement> {
    /**
     * A list of files to render out within the page organizer.
     */
    files: F[];
    /**
     * If true, will disable drag-and-drop functionality within the organizer.
     */
    disableMove?: boolean;
    /**
     * Classname for outer div.
     */
    className?: string;
    /**
     * Removes the ability to change indexes with arrow keys. This removes the
     * ability to re-sort accessibly. Generally, left and right arrow keys will
     * call `onMove` if a file is focused.
     */
    preventArrowsToMove?: boolean;
    /**
     * Prevents clicking on background to deselect all items. Can still use
     * `escape` key.
     */
    preventClickAwayDeselect?: boolean;
    /**
     * The IDs of any files that are being moved along with the primary drag
     * target. Prevents the move-to-location animation of any files with matching
     * IDs, and passes true for `dragging` to the `OnRenderThumbnailProps`.
     */
    draggingIds?: string[];
    /**
     * Use this instead of CSS or `style` to set the outside padding. This is
     * because the virtualization process requires exact padding values to
     * ensure that the elements are positioned properly.
     */
    padding?: number;
    /**
     * If provided, the ref is attached to the `react-window` FixedSizeGrid.
     */
    gridRef?: Ref<FixedSizeGrid>;
    /**
     * If you know exactly what size your thumbnail is going to be, you can input
     * the value here. Use this if the thumbnail is going to change sizes, since
     * `FileOrganizer` will only detect changes when files change.
     */
    thumbnailSize?: {
        width: number;
        height: number;
    };
    /**
     * On render function for generating the thumbnails for the page organizer.
     * If you do not want to build your own, try using the `Thumbnail` component.
     * @param onRenderProps An object to use in rendering the thumbnail.
     */
    onRenderThumbnail(onRenderProps: OnRenderThumbnailProps<F>): ReactNode;
    /**
     * If provided, will call to render a custom drag layer while a thumbnail is
     * being dragged. Otherwise will show a preview of the thumbnail.
     */
    onRenderDragLayer?(): ReactNode;
    /**
     * Callback fired when a file is moved within the page organizer. Returns
     * whether the move was successful.
     * @param fromIndex The previous index of the item.
     * @param toIndex The next index of the item.
     */
    onMove?(fromIndex: number, toIndex: number): boolean;
    /**
     * Called whenever dragging begins or ends. If drag ends, the id will be
     * undefined.
     * @param id The ID of the dragging item.
     */
    onDragChange?(id?: string): void;
    /**
     * Called whenever `escape` key is pressed while focusing the file organizer,
     * or if background of organizer is clicked.
     */
    onDeselectAll?(): void;
    /**
     * Called whenever all items are selected at once (usually `ctrl` or
     * `command` + `A`).
     */
    onSelectAll?(): void;
}
export interface OnRenderThumbnailProps<F> {
    /**
     * This can be spread directly to the `Thumbnail`.
     */
    onRenderThumbnailProps: {
        /** The file to render into a thumbnail. */
        file: F;
        /** Is this file being dragged currently. */
        dragging: boolean;
        /** Are other files being dragged other than this one. */
        otherDragging: boolean;
        /** Callback for setting whether the thumbnail is in editing mode. */
        onEditingChange: (isEditing: boolean) => void;
    };
    /** ID of the file. */
    id: string;
    /** The index of this file within the file organizer. */
    index: number;
}
export declare function FileOrganizer<F extends ObjectWithId>({ files, onMove, onDragChange, onDeselectAll, onSelectAll, onRenderThumbnail, onRenderDragLayer, disableMove, preventArrowsToMove, preventClickAwayDeselect, draggingIds, padding, gridRef: _gridRef, thumbnailSize, className, onClick, onKeyDown, style, ...divProps }: FileOrganizerProps<F>): JSX.Element;
