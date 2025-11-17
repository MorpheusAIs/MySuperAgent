import { ComponentType } from 'react';
import { AxisInterval, AxisTick, BaseAxisProps, PresentationAttributesAdaptChildEvent } from '../util/types';
import { XAxisOrientation, XAxisPadding } from '../state/cartesianAxisSlice';
interface XAxisProps extends BaseAxisProps {
    /** The unique id of x-axis */
    xAxisId?: string | number;
    /** The height of axis, which need to be set by user */
    height?: number;
    mirror?: boolean;
    orientation?: XAxisOrientation;
    /**
     * Ticks can be any type when the axis is the type of category
     * Ticks must be numbers when the axis is the type of number
     */
    ticks?: ReadonlyArray<AxisTick>;
    padding?: XAxisPadding;
    minTickGap?: number;
    interval?: AxisInterval;
    reversed?: boolean;
    /** the rotate angle of tick */
    angle?: number;
    tickMargin?: number;
}
export type Props = Omit<PresentationAttributesAdaptChildEvent<any, SVGElement>, 'scale' | 'ref'> & XAxisProps;
export declare const XAxis: ComponentType<Props>;
export {};
