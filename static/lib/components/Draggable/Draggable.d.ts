import React, { HTMLAttributes, ReactNode } from 'react';
export interface DraggableProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * The current index of the draggable wrapper.
     */
    index: number;
    /**
     * Prevent this draggable wrapper from dragging.
     */
    disableDrag?: boolean;
    /**
     * Hides the snapshot preview of the item while dragging. The most common use
     * case would be if you're implementing a custom drag layer and you don't want
     * the preview snapshot to clash with it.
     */
    hideDragPreview?: boolean;
    /**
     * Prevent the move-to-location animation of this draggable.
     */
    preventAnimation?: boolean;
    /**
     * Call instead of providing children if you wish to use the `isDragging`
     * prop.
     * @param isDragging Is the child dragging.
     */
    onRenderChildren?(isDragging: boolean): ReactNode;
    /**
     * If given, will be called any time the draggable wrapper is moved. Returns
     * whether the move was successful.
     * @param fromIndex The previous index of the item.
     * @param toIndex The next index of the item.
     */
    onMove?(fromIndex: number, toIndex: number): boolean;
    /**
     * Called whenever the dnd property `isDragging` changes.
     * @param isDragging Is the child dragging.
     */
    onDragChange?(isDragging: boolean): void;
}
export declare const Draggable: React.ForwardRefExoticComponent<DraggableProps & React.RefAttributes<HTMLDivElement>>;
