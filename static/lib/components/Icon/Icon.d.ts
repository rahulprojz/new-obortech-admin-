import React, { HTMLAttributes, ReactNode, SVGProps } from 'react';
import * as icons from './../../icons';
export declare type AvailableIcons = keyof typeof icons;
export interface IconProps extends HTMLAttributes<HTMLElement> {
    /**
     * Specify one of the included icons from the toolkit. If provided, do not add
     * `children` or they will override this.
     */
    icon?: AvailableIcons;
    /**
     * Props that will be passed to the included icons. This will not be used if
     * `children` is provided.
     */
    svgProps?: SVGProps<SVGSVGElement>;
    /**
     * Provide a custom child instead of a provided icon. Will override `icon` if
     * provided.
     */
    children?: ReactNode;
}
export declare const Icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<HTMLButtonElement>>;
