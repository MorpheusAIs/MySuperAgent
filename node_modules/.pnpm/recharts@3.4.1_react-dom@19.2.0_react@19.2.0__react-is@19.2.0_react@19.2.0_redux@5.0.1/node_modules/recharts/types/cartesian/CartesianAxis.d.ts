/**
 * @fileOverview Cartesian Axis
 */
import * as React from 'react';
import { SVGProps } from 'react';
import { Props as TextProps } from '../component/Text';
import { ImplicitLabelType } from '../component/Label';
import { CartesianViewBox, PresentationAttributesAdaptChildEvent, CartesianTickItem, AxisInterval, TickProp } from '../util/types';
import { RechartsScale } from '../util/ChartUtils';
import { XAxisPadding, YAxisPadding } from '../state/cartesianAxisSlice';
import { ZIndexable } from '../zIndex/ZIndexLayer';
/** The orientation of the axis in correspondence to the chart */
export type Orientation = 'top' | 'bottom' | 'left' | 'right';
/** A unit to be appended to a value */
export type Unit = string | number;
/** The formatter function of tick */
export type TickFormatter = (value: any, index: number) => string;
export interface CartesianAxisProps extends ZIndexable {
    className?: string;
    axisType?: 'xAxis' | 'yAxis';
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    unit?: Unit;
    orientation?: Orientation;
    viewBox?: CartesianViewBox;
    tick?: TickProp;
    /**
     * Additional props to spread to each tick Text element.
     * Optional, the CartesianAxis component will provide its own defaults calculated from other props.
     */
    tickTextProps?: TextProps;
    axisLine?: boolean | SVGProps<SVGLineElement>;
    tickLine?: boolean | SVGProps<SVGLineElement>;
    mirror?: boolean;
    tickMargin?: number;
    hide?: boolean;
    label?: ImplicitLabelType;
    /** Padding information passed to custom tick components */
    padding?: XAxisPadding | YAxisPadding;
    minTickGap?: number;
    /**
     * Careful - this is the same name as XAxis + YAxis `ticks` but completely different object!
     */
    ticks?: ReadonlyArray<CartesianTickItem>;
    tickSize?: number;
    tickFormatter?: TickFormatter;
    interval?: AxisInterval;
    /** Angle in which ticks will be rendered. */
    angle?: number;
    /**
     * This is NOT SVG scale attribute;
     * this is Recharts scale, based on d3-scale.
     */
    scale?: RechartsScale;
    labelRef?: React.RefObject<SVGTextElement> | null;
    ref?: React.Ref<CartesianAxisRef>;
}
export interface CartesianAxisRef {
    getCalculatedWidth(): number;
}
export declare const defaultCartesianAxisProps: {
    readonly x: 0;
    readonly y: 0;
    readonly width: 0;
    readonly height: 0;
    readonly viewBox: {
        readonly x: 0;
        readonly y: 0;
        readonly width: 0;
        readonly height: 0;
    };
    readonly orientation: "bottom";
    readonly ticks: CartesianAxisProps["ticks"];
    readonly stroke: "#666";
    readonly tickLine: true;
    readonly axisLine: true;
    readonly tick: true;
    readonly mirror: false;
    readonly minTickGap: 5;
    readonly tickSize: 6;
    readonly tickMargin: 2;
    readonly interval: "preserveEnd";
    readonly zIndex: 500;
};
export type Props = Omit<PresentationAttributesAdaptChildEvent<any, SVGElement>, 'viewBox' | 'scale' | 'ref'> & CartesianAxisProps;
export declare const CartesianAxis: React.ForwardRefExoticComponent<Omit<Props, "ref"> & React.RefAttributes<CartesianAxisRef>>;
