import * as React from 'react';
import { CSSProperties } from 'react';
import { TooltipIndex, TooltipPayloadSearcher } from '../state/tooltipSlice';
import { DataKey, Percent } from '../util/types';
export interface SunburstData {
    [key: string]: any;
    name: string;
    value?: number;
    fill?: string;
    tooltipIndex?: TooltipIndex | undefined;
    children?: SunburstData[];
}
interface TextOptions {
    fontFamily?: string;
    fontWeight?: string;
    paintOrder?: string;
    stroke?: string;
    fill?: string;
    fontSize?: string;
    pointerEvents?: string;
}
export interface SunburstChartProps {
    className?: string;
    data: SunburstData;
    width?: number | Percent;
    height?: number | Percent;
    /**
     * If true, then it will listen to container size changes and adapt the SVG chart accordingly.
     * If false, then it renders the chart at the specified width and height and will stay that way
     * even if the container size changes.
     *
     * This is similar to ResponsiveContainer but without the need for an extra wrapper component.
     * The `responsive` prop also uses standard CSS sizing rules, instead of custom resolution logic (like ResponsiveContainer does).
     * @default false
     */
    responsive?: boolean;
    padding?: number;
    dataKey?: string;
    nameKey?: DataKey<any>;
    ringPadding?: number;
    innerRadius?: number;
    outerRadius?: number;
    /** The abscissa of pole in polar coordinate  */
    cx?: number;
    /** The ordinate of pole in polar coordinate  */
    cy?: number;
    /** Angle in degrees from which the chart should start.  */
    startAngle?: number;
    /** Angle, in degrees, at which the chart should end. Can be used to generate partial sunbursts.  */
    endAngle?: number;
    children?: React.ReactNode;
    fill?: string;
    stroke?: string;
    textOptions?: TextOptions;
    onMouseEnter?: (node: SunburstData, e: React.MouseEvent) => void;
    onMouseLeave?: (node: SunburstData, e: React.MouseEvent) => void;
    onClick?: (node: SunburstData) => void;
    style?: CSSProperties;
}
export declare const payloadSearcher: TooltipPayloadSearcher<SunburstData[], SunburstData>;
export declare const addToSunburstNodeIndex: (indexInChildrenArr: number, activeTooltipIndexSoFar?: TooltipIndex | undefined) => TooltipIndex;
export declare const SunburstChart: (props: SunburstChartProps) => React.JSX.Element;
export {};
