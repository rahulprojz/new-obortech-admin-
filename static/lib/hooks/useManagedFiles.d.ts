import { Dispatch, MouseEvent, SetStateAction } from 'react';
import { ObjectWithId } from '../utils';
export interface UseManagedFilesOptions<F> {
    /**
     * The initial files for managing.
     */
    initialFiles?: F[];
    /**
     * Prevent multiple items from being dragged.
     */
    preventMultiDrag?: boolean;
    /**
     * Prevent multi select with shift or command/control.
     */
    preventMultiSelect?: boolean;
    /**
     * Prevent selecting the item you are currently dragging.
     */
    preventSelectOnDrag?: boolean;
    /**
     * Prevent deselecting all selected items when you drag an unselected item.
     */
    preventDeselectOnDragOther?: boolean;
    /**
     * Allows multi-select by clicking other files without holding command/control.
     */
    easyMultiSelect?: boolean;
}
export interface UseManagedFilesOutput<F> {
    /**
     * An array of files.
     */
    files: F[];
    /**
     * Do any state manipulation on the files array.
     */
    setFiles: Dispatch<SetStateAction<F[]>>;
    /**
     * An array of every selected ID.
     */
    selectedIds: string[];
    /**
     * Do any state manipulation on the selected IDs array.
     */
    setSelectedIds: Dispatch<SetStateAction<string[]>>;
    /**
     * Toggle whether an ID is selected or not.
     * @param id The ID of the selected item to toggle.
     * @param event If provided, will only allow multi-select when shiftKey is true.
     */
    toggleSelectedId(id: string, event?: MouseEvent<HTMLElement>): void;
    /**
     * The number if files being dragged. Can be used to render a drag layer.
     */
    draggingIds: string[];
    /**
     * Simply add a file at the index, or to the end if not provided.
     * @param file The file to add.
     * @param index The index to add at.
     */
    addFile(file: F, index?: number): void;
    /**
     * Remove the provided file from the files array.
     * @param file The file to remove.
     */
    removeFile(file: F): void;
    /**
     * You can spread these directly to `FileOrganizer`.
     */
    fileOrganizerProps: {
        files: F[];
        onMove(fromIndex: number, toIndex: number): boolean;
        onDragChange(id?: string): void;
        onDeselectAll(): void;
        onSelectAll(): void;
        draggingIds: string[];
    };
    /**
     * You can spread the result of this function directly to `Thumbnail`. It has
     * a boolean for whether the `Thumbnail` is selected, as well as an `onClick`
     * function to select it.
     * @param id The `File` id for the thumbnail.
     */
    getThumbnailSelectionProps(id: string): {
        selected: boolean;
        onClick: (event: MouseEvent<HTMLElement>) => void;
    };
}
/**
 * Combines most of the necessary functionality to manage files for the
 * `FileOrganizer` component.
 * @param options Options for managing files.
 */
export declare function useManagedFiles<F extends ObjectWithId>({ initialFiles, preventMultiDrag, preventDeselectOnDragOther, preventSelectOnDrag, preventMultiSelect, easyMultiSelect, }?: UseManagedFilesOptions<F>): UseManagedFilesOutput<F>;
