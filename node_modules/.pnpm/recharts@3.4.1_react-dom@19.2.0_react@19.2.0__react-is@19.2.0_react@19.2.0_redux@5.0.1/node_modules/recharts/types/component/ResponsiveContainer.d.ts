import * as React from 'react';
import { CSSProperties, ReactNode } from 'react';
import { Percent, Size } from '../util/types';
export interface Props {
    /**
     * The aspect ratio of the chart. It is calculated as `width / height`.
     * If specified, the height will be calculated by the width and this ratio.
     */
    aspect?: number;
    /**
     * The width of the container. If a percentage string is specified, it is calculated responsive to the width of the parent element.
     * @default '100%'
     */
    width?: Percent | number;
    /**
     * The height of the container. If a percentage string is specified, it is calculated responsive to the height of the parent element.
     * @default '100%'
     */
    height?: Percent | number;
    /**
     * The minimum width of the container. It can be a percentage string or a number.
     * @default 0
     */
    minWidth?: string | number;
    /** The minimum height of the container. It can be a percentage string or a number. */
    minHeight?: string | number;
    /**
     * The initial width and height of the container.
     * @default { width: -1, height: -1 }
     */
    initialDimension?: {
        width: number;
        height: number;
    };
    /** The maximum height of the container. It can be a number. */
    maxHeight?: number;
    /**
     * The content of the container.
     * It can contain multiple charts, and then they will all share the same dimensions.
     */
    children: ReactNode;
    /**
     * The debounce time for resizing events.
     * @default 0
     */
    debounce?: number;
    /** The id of the container. */
    id?: string | number;
    /** The class name of the container. */
    className?: string | number;
    /** The style of the container. */
    style?: Omit<CSSProperties, keyof Props>;
    /**
     * A callback function that will be called when the container is resized.
     * @param width The new width of the container.
     * @param height The new height of the container.
     */
    onResize?: (width: number, height: number) => void;
}
export declare const useResponsiveContainerContext: () => Size;
/**
 * The `ResponsiveContainer` component is a container that adjusts its width and height based on the size of its parent element.
 * It is used to create responsive charts that adapt to different screen sizes.
 *
 * This component uses the `ResizeObserver` API to monitor changes to the size of its parent element.
 * If you need to support older browsers that do not support this API, you may need to include a polyfill.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 */
export declare const ResponsiveContainer: React.ForwardRefExoticComponent<Props & React.RefAttributes<HTMLDivElement>>;
