import React, { ImgHTMLAttributes, ReactNode } from 'react';
import { FuturableOrLazy } from '../../data';
import { Remove } from '../../utils';
export interface ImageProps extends Remove<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    /**
     * The image source can be a `Futurable` or `LazyFuturable`, or undefined. If
     * undefined or if a promise will display as loading.
     */
    src?: FuturableOrLazy<string | undefined>;
    /**
     * Manually set whether image should show loading state.
     */
    pending?: boolean;
    /**
     * Render out an element to be shown while src is loading.
     */
    onRenderLoading?(): ReactNode;
    /**
     * Render out an element to be shown if the image fails to load src, or src
     * is falsy.
     */
    onRenderFallback?(): ReactNode;
}
export declare const Image: React.ForwardRefExoticComponent<ImageProps & React.RefAttributes<HTMLImageElement>>;
