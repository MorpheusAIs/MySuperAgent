/**
 * @fileOverview Reference Line
 */
import * as React from 'react';
import { ReactElement, SVGProps } from 'react';
import { ImplicitLabelType } from '../component/Label';
import { IfOverflow } from '../util/IfOverflow';
import { CartesianViewBoxRequired } from '../util/types';
import { RequiresDefaultProps } from '../util/resolveDefaultProps';
import { ZIndexable } from '../zIndex/ZIndexLayer';
/**
 * Single point that defines one end of a segment.
 * These coordinates are in data space, meaning that you should provide
 * values that correspond to the data domain of the axes.
 * So you would provide a value of `Page A` to indicate the data value `Page A`
 * and then recharts will convert that to pixels.
 *
 * Likewise for numbers. If your x-axis goes from 0 to 100,
 * and you want the line to end at 50, you would provide `50` here.
 */
export type ReferenceLineSegment = [
    {
        x?: number | string;
        y?: number | string;
    },
    {
        x?: number | string;
        y?: number | string;
    }
];
export type ReferenceLinePosition = 'middle' | 'start' | 'end';
interface ReferenceLineProps extends ZIndexable {
    ifOverflow?: IfOverflow;
    /**
     * The y-coordinate of the reference line in data space.
     * This value is used when you want to draw a horizontal reference line.
     *
     * You should provide a value that corresponds to the data domain of the y-axis.
     * So you would provide a value of `100` to indicate the data value `100`
     * and then recharts will convert that to pixels.
     *
     * If you provide this prop, then the `x` and `segment` props will be ignored.
     */
    y?: number | string;
    /**
     * The x-coordinate of the reference line in data space.
     * This value is used when you want to draw a vertical reference line.
     *
     * You should provide a value that corresponds to the data domain of the x-axis.
     * So you would provide a value of `Page A` to indicate the data value `Page A`
     * and then recharts will convert that to pixels.
     *
     * This prop is ignored if the `y` prop is provided.
     * If you provide this prop, then the `segment` prop will be ignored.
     */
    x?: number | string;
    /**
     * An array of two points that define the start and end of a line segment.
     * Each point is an object with `x` and `y` properties.
     * If this array has other than two points, it will be ignored.
     *
     * These coordinates are in data space, meaning that you should provide
     * values that correspond to the data domain of the axes.
     * So you would provide a value of `Page A` to indicate the data value `Page A`
     * and then recharts will convert that to pixels.
     *
     * Likewise for numbers. If your x-axis goes from 0 to 100,
     * and you want the line to end at 50, you would provide `50` here.
     *
     * This prop is only used if both `x` and `y` props are undefined.
     */
    segment?: ReferenceLineSegment;
    /**
     * The position of the reference line when the axis has bandwidth
     * (e.g., a band scale). This determines where within the band
     * the line is drawn.
     */
    position?: ReferenceLinePosition;
    className?: number | string;
    yAxisId?: number | string;
    xAxisId?: number | string;
    shape?: ReactElement<SVGElement> | ((props: any) => ReactElement<SVGElement>);
    label?: ImplicitLabelType;
}
/**
 * This excludes `viewBox` prop from svg for two reasons:
 * 1. The components wants viewBox of object type, and svg wants string
 *    - so there's a conflict, and the component will throw if it gets string
 * 2. Internally the component calls `svgPropertiesNoEvents` which filters the viewBox away anyway
 */
export type Props = Omit<SVGProps<SVGLineElement>, 'viewBox'> & ReferenceLineProps;
type EndPointsPropsSubset = Pick<PropsWithDefaults, 'y' | 'x' | 'segment' | 'ifOverflow'>;
export declare const getEndPoints: (scales: any, viewBox: CartesianViewBoxRequired, position: Props["position"], xAxisOrientation: Props["orientation"], yAxisOrientation: Props["orientation"], props: EndPointsPropsSubset) => any[] | null;
declare const referenceLineDefaultProps: {
    readonly ifOverflow: "discard";
    readonly xAxisId: 0;
    readonly yAxisId: 0;
    readonly fill: "none";
    readonly stroke: "#ccc";
    readonly fillOpacity: 1;
    readonly strokeWidth: 1;
    readonly position: "middle";
    readonly zIndex: 400;
};
type PropsWithDefaults = RequiresDefaultProps<Props, typeof referenceLineDefaultProps>;
export declare function ReferenceLine(outsideProps: Props): React.JSX.Element;
export declare namespace ReferenceLine {
    var displayName: string;
}
export {};
