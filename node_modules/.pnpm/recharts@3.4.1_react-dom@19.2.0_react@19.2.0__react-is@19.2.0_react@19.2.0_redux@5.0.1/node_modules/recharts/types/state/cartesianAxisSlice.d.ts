import { AxisDomain, AxisDomainType, AxisInterval, AxisTick, DataKey, ScaleType, TickProp } from '../util/types';
import { RechartsScale } from '../util/ChartUtils';
import { TickFormatter } from '../cartesian/CartesianAxis';
import type { AxisRange } from './selectors/axisSelectors';
export type AxisId = string | number;
export declare const defaultAxisId: AxisId;
export type XAxisPadding = {
    left?: number;
    right?: number;
} | 'gap' | 'no-gap';
export type YAxisPadding = {
    top?: number;
    bottom?: number;
} | 'gap' | 'no-gap';
export type XAxisOrientation = 'top' | 'bottom';
export type YAxisOrientation = 'left' | 'right';
/**
 * Properties shared in X, Y, and Z axes
 */
export type BaseCartesianAxis = {
    id: AxisId;
    scale: ScaleType | RechartsScale | undefined;
    type: AxisDomainType;
    /**
     * The axis functionality is severely restricted without a dataKey
     * - but there is still something left, and the prop is optional
     * so this can also be undefined even in real charts.
     * There are no defaults.
     */
    dataKey: DataKey<any> | undefined;
    unit: string | undefined;
    name: string | undefined;
    allowDuplicatedCategory: boolean;
    allowDataOverflow: boolean;
    reversed: boolean;
    includeHidden: boolean;
    domain: AxisDomain | undefined;
};
export type TicksSettings = {
    allowDecimals: boolean;
    /**
     * We pass the suggested number of ticks to d3 https://d3js.org/d3-scale/linear#linear_ticks
     * This number is a suggestion. d3 tries to accommodate it, but it might return more or less ticks than requested:
     * > The specified count is only a hint; the scale may return more or fewer values depending on the domain.
     *
     * If undefined, then d3 decides the number of ticks on its own. The default in d3 is 10,
     * but it can vary based on the domain size and other factors.
     */
    tickCount: number | undefined;
    /**
     * Ticks can be any type when the axis is the type of category
     * Ticks must be numbers when the axis is the type of number
     */
    ticks: ReadonlyArray<AxisTick> | undefined;
    tick: TickProp;
};
/**
 * These are the external props, visible for users as they set them using our public API.
 * There is all sorts of internal computed things based on these, but they will come through selectors.
 *
 * Properties shared between X and Y axes
 */
export type CartesianAxisSettings = BaseCartesianAxis & TicksSettings & {
    interval: AxisInterval;
    mirror: boolean;
    minTickGap: number;
    angle: number;
    hide: boolean;
    tickFormatter: TickFormatter | undefined;
};
export type XAxisSettings = CartesianAxisSettings & {
    padding: XAxisPadding;
    height: number;
    orientation: XAxisOrientation;
};
export type YAxisWidth = number | 'auto';
export type YAxisSettings = CartesianAxisSettings & {
    padding: YAxisPadding;
    width: YAxisWidth;
    orientation: YAxisOrientation;
    widthHistory?: number[];
};
/**
 * Z axis is special because it's never displayed. It controls the size of Scatter dots,
 * but it never displays ticks anywhere.
 */
export type ZAxisSettings = BaseCartesianAxis & {
    range: AxisRange;
};
type AxisMapState = {
    xAxis: Record<AxisId, XAxisSettings>;
    yAxis: Record<AxisId, YAxisSettings>;
    zAxis: Record<AxisId, ZAxisSettings>;
};
export declare const addXAxis: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[payload: XAxisSettings], XAxisSettings, "cartesianAxis/addXAxis", never, unknown>, removeXAxis: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[payload: XAxisSettings], XAxisSettings, "cartesianAxis/removeXAxis", never, unknown>, addYAxis: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[payload: YAxisSettings], YAxisSettings, "cartesianAxis/addYAxis", never, unknown>, removeYAxis: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[payload: YAxisSettings], YAxisSettings, "cartesianAxis/removeYAxis", never, unknown>, addZAxis: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[payload: ZAxisSettings], ZAxisSettings, "cartesianAxis/addZAxis", never, unknown>, removeZAxis: import("@reduxjs/toolkit").ActionCreatorWithPreparedPayload<[payload: ZAxisSettings], ZAxisSettings, "cartesianAxis/removeZAxis", never, unknown>, updateYAxisWidth: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    id: AxisId;
    width: number;
}, "cartesianAxis/updateYAxisWidth">;
export declare const cartesianAxisReducer: import("redux").Reducer<AxisMapState>;
export {};
