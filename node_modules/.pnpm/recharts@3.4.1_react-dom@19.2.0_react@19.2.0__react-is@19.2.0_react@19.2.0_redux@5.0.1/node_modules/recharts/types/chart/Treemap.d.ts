import * as React from 'react';
import { ReactNode } from 'react';
import { AnimationDuration, AnimationTiming, DataKey, Percent } from '../util/types';
import { TooltipIndex, TooltipPayloadSearcher } from '../state/tooltipSlice';
/**
 * This is what end users defines as `data` on Treemap.
 */
export interface TreemapDataType {
    children?: ReadonlyArray<TreemapDataType>;
    [key: string]: unknown;
}
/**
 * This is what is returned from `squarify`, the final treemap data structure
 * that gets rendered and is stored in
 */
export interface TreemapNode {
    children: ReadonlyArray<TreemapNode> | null;
    value: number;
    depth: number;
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    tooltipIndex: TooltipIndex;
    [k: string]: any;
}
export declare const treemapPayloadSearcher: TooltipPayloadSearcher<TreemapNode, TreemapNode>;
export declare const addToTreemapNodeIndex: (indexInChildrenArr: number, activeTooltipIndexSoFar?: TooltipIndex | undefined) => TooltipIndex;
export declare const computeNode: ({ depth, node, index, dataKey, nameKey, nestedActiveTooltipIndex, }: {
    depth: number;
    node: TreemapNode;
    index: number;
    dataKey: DataKey<unknown>;
    nameKey: DataKey<unknown>;
    nestedActiveTooltipIndex: TooltipIndex | undefined;
}) => TreemapNode;
type TreemapContentType = ReactNode | ((props: TreemapNode) => React.ReactElement);
export interface Props {
    width?: number | Percent;
    height?: number | Percent;
    data?: ReadonlyArray<TreemapDataType>;
    /**
     * @deprecated unused prop, doesn't do anything, use `key` instead
     */
    animationId?: number;
    style?: React.CSSProperties;
    /**
     * This is aspect ratio of the individual treemap rectangles.
     * If you want to define aspect ratio of the chart itself, set it via the `style` prop:
     * e.g. `<Treemap style={{ aspectRatio: 4 / 3 }}>`
     */
    aspectRatio?: number;
    content?: TreemapContentType;
    fill?: string;
    stroke?: string;
    className?: string;
    nameKey?: DataKey<any>;
    dataKey?: DataKey<any>;
    children?: ReactNode;
    /**
     * The type of treemap to render.
     *
     * - 'flat': Renders the entire treemap at once, with all leaf nodes visible.
     * - 'nest': Renders an interactive, nested treemap. Clicking on a parent node will "zoom in" to show its children,
     *   and a breadcrumb navigation will be displayed to allow navigating back up the hierarchy.
     *
     * @default 'flat'
     */
    type?: 'flat' | 'nest';
    colorPanel?: [];
    nestIndexContent?: React.ReactElement | ((item: TreemapNode, i: number) => ReactNode);
    onAnimationStart?: () => void;
    onAnimationEnd?: () => void;
    onMouseEnter?: (node: TreemapNode, e: React.MouseEvent) => void;
    onMouseLeave?: (node: TreemapNode, e: React.MouseEvent) => void;
    onClick?: (node: TreemapNode) => void;
    isAnimationActive?: boolean;
    isUpdateAnimationActive?: boolean;
    animationBegin?: number;
    animationDuration?: AnimationDuration;
    animationEasing?: AnimationTiming;
}
export declare function Treemap(outsideProps: Props): React.JSX.Element;
export {};
