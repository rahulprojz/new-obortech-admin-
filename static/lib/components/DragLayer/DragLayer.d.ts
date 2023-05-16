import { FC, HTMLAttributes, ReactNode } from 'react';
import { XYCoord } from 'react-dnd';
export interface DragLayerProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * The children passed to the drag layer will be rendered whenever an item is
     * drag-and-dropped. You may have to disable their image preview or else you
     * will see both.
     */
    children?: ReactNode;
    /**
     * If not given, will use `currentOffset.x` and `currentOffset.y`. Can return
     * custom translate coordinates. This allows you to always center on mouse
     * position, or translate to any coordinates.
     */
    customTranslate?: (params: {
        currentOffset: XYCoord;
        mousePosition: XYCoord;
    }) => {
        x: number;
        y: number;
    };
}
export declare const DragLayer: FC<DragLayerProps>;
