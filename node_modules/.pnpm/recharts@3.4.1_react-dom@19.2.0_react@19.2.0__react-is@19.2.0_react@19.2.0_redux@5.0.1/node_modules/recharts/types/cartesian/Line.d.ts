import { ComponentType } from 'react';
import { CurveType, Props as CurveProps } from '../shape/Curve';
import { ImplicitLabelListType } from '../component/LabelList';
import { ActiveDotType, ActiveShape, AnimationDuration, AnimationTiming, DataKey, DotType, LegendType, TickItem, TooltipType } from '../util/types';
import { BaseAxisWithScale } from '../state/selectors/axisSelectors';
import { AxisId } from '../state/cartesianAxisSlice';
import { ZIndexable } from '../zIndex/ZIndexLayer';
export interface LinePointItem {
    readonly value: number;
    readonly payload?: any;
    /**
     * Line coordinates can have gaps in them. We have `connectNulls` prop that allows to connect those gaps anyway.
     * What it means is that some points can have `null` x or y coordinates.
     */
    x: number | null;
    y: number | null;
}
/**
 * External props, intended for end users to fill in
 */
interface LineProps extends ZIndexable {
    activeDot?: ActiveDotType;
    animateNewValues?: boolean;
    animationBegin?: number;
    animationDuration?: AnimationDuration;
    animationEasing?: AnimationTiming;
    className?: string;
    connectNulls?: boolean;
    data?: any;
    dataKey?: DataKey<any>;
    dot?: DotType;
    hide?: boolean;
    id?: string;
    isAnimationActive?: boolean;
    label?: ImplicitLabelListType;
    legendType?: LegendType;
    shape?: ActiveShape<CurveProps, SVGPathElement>;
    name?: string | number;
    onAnimationEnd?: () => void;
    onAnimationStart?: () => void;
    tooltipType?: TooltipType;
    type?: CurveType;
    unit?: string | number | null;
    xAxisId?: AxisId;
    yAxisId?: AxisId;
}
/**
 * Because of naming conflict, we are forced to ignore certain (valid) SVG attributes.
 */
type LineSvgProps = Omit<CurveProps, 'points' | 'pathRef' | 'ref'>;
export type Props = LineSvgProps & LineProps;
export declare function computeLinePoints({ layout, xAxis, yAxis, xAxisTicks, yAxisTicks, dataKey, bandSize, displayedData, }: {
    layout: Props['layout'];
    xAxis: BaseAxisWithScale;
    yAxis: BaseAxisWithScale;
    xAxisTicks: TickItem[];
    yAxisTicks: TickItem[];
    dataKey: Props['dataKey'];
    bandSize: number;
    displayedData: any[];
}): ReadonlyArray<LinePointItem>;
export declare const Line: ComponentType<Props>;
export {};
