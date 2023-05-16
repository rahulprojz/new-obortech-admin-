import { HTMLAttributes } from 'react';
export interface ThumbnailDragLayerProps extends HTMLAttributes<HTMLDivElement> {
    /**
     * Must be a positive integer (1, 2, 3...) or falsy to default.
     * @default 1
     */
    numFiles?: number;
}
export declare const ThumbnailDragLayer: ({ numFiles, className, ...divProps }: ThumbnailDragLayerProps) => JSX.Element;
