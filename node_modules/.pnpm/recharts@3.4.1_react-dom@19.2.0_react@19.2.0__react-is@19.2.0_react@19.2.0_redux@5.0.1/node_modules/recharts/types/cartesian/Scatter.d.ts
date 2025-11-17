import { ComponentType, ReactElement } from 'react';
import { ImplicitLabelListType } from '../component/LabelList';
import { CurveType, Props as CurveProps } from '../shape/Curve';
import { ActiveShape, AnimationDuration, AnimationTiming, Coordinate, DataKey, LegendType, PresentationAttributesAdaptChildEvent, SymbolType, TickItem } from '../util/types';
import { TooltipType } from '../component/DefaultTooltipContent';
import { InnerSymbolsProp } from '../shape/Symbols';
import { TooltipPayload } from '../state/tooltipSlice';
import { AxisId } from '../state/cartesianAxisSlice';
import { BaseAxisWithScale, ZAxisWithScale } from '../state/selectors/axisSelectors';
import { ScatterSettings } from '../state/types/ScatterSettings';
import { ZIndexable } from '../zIndex/ZIndexLayer';
interface ScatterPointNode {
    x?: number | string;
    y?: number | string;
    z?: number | string;
}
/**
 * Scatter coordinates are nullable because sometimes the point value is out of the domain
 * and we can't compute a valid coordinate for it.
 *
 * Scatter -> Symbol ignores points with null cx or cy so those won't render if using the default shapes.
 * However the points are exposed via various props and can be used in custom shapes so we keep them around.
 */
export interface ScatterPointItem {
    /**
     * The x coordinate of the point center in pixels.
     */
    cx: number | undefined;
    /**
     * The y coordinate of the point center in pixels.
     */
    cy: number | undefined;
    /**
     * The x coordinate (in pixels) of the top-left corner of the rectangle that wraps the point.
     */
    x: number | undefined;
    /**
     * The y coordinate (in pixels) of the top-left corner of the rectangle that wraps the point.
     */
    y: number | undefined;
    /**
     * ScatterPointItem size is an abstract number that is used to calculate the radius of the point.
     * It's not the radius itself, but rather a value that is used to calculate the radius.
     * Interacts with the zAxis range.
     */
    size: number;
    /**
     * Width of the point in pixels.
     */
    width: number;
    /**
     * Height of the point in pixels.
     */
    height: number;
    node: ScatterPointNode;
    payload?: any;
    tooltipPayload?: TooltipPayload;
    tooltipPosition: Coordinate;
}
export type ScatterCustomizedShape = ActiveShape<ScatterPointItem, SVGPathElement & InnerSymbolsProp> | SymbolType;
/**
 * External props, intended for end users to fill in
 */
interface ScatterProps extends ZIndexable {
    data?: any[];
    xAxisId?: AxisId;
    yAxisId?: string | number;
    zAxisId?: string | number;
    dataKey?: DataKey<any>;
    line?: ReactElement<SVGElement> | ((props: any) => ReactElement<SVGElement>) | CurveProps | boolean;
    lineType?: 'fitting' | 'joint';
    lineJointType?: CurveType;
    legendType?: LegendType;
    tooltipType?: TooltipType;
    className?: string;
    name?: string;
    activeShape?: ScatterCustomizedShape;
    shape?: ScatterCustomizedShape;
    hide?: boolean;
    label?: ImplicitLabelListType;
    isAnimationActive?: boolean;
    animationBegin?: number;
    animationDuration?: AnimationDuration;
    animationEasing?: AnimationTiming;
}
/**
 * Because of naming conflict, we are forced to ignore certain (valid) SVG attributes.
 */
type BaseScatterSvgProps = Omit<PresentationAttributesAdaptChildEvent<any, SVGElement>, 'points' | 'ref'>;
export type Props = BaseScatterSvgProps & ScatterProps;
export declare function computeScatterPoints({ displayedData, xAxis, yAxis, zAxis, scatterSettings, xAxisTicks, yAxisTicks, cells, }: {
    displayedData: ReadonlyArray<any>;
    xAxis: BaseAxisWithScale;
    yAxis: BaseAxisWithScale;
    zAxis: ZAxisWithScale;
    scatterSettings: ScatterSettings;
    xAxisTicks: TickItem[];
    yAxisTicks: TickItem[];
    cells: ReadonlyArray<ReactElement> | undefined;
}): ReadonlyArray<ScatterPointItem>;
export declare const Scatter: ComponentType<Props>;
export {};
